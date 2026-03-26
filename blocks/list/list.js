import ffetch from '../../scripts/ffetch.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';

/**
 * Reads the block's authored field values from its DOM rows.
 * Each row maps to one model field in definition order:
 *   0: rootPath, 1: sortBy, 2: showDescription, 3: showImage, 4: showDate, 5: limit
 * @param {Element} block
 * @returns {{ rootPath: string, sortBy: string, showDescription: boolean, showImage: boolean, showDate: boolean, limit: number }}
 */
function readConfig(block) {
  const rows = [...block.children];
  const get = (i) => rows[i]?.textContent?.trim() || '';
  return {
    rootPath: get(0) || '/en/news',
    sortBy: get(1) || 'alphabetical',
    showDescription: get(2) === 'true',
    showImage: get(3) === 'true',
    showDate: get(4) === 'true',
    limit: parseInt(get(5), 10) || 0,
  };
}

/**
 * Derives the language code (e.g. "en") from an EDS rootPath (e.g. "/en/news").
 * @param {string} rootPath
 * @returns {string}
 */
function getLangFromPath(rootPath) {
  return rootPath.replace(/^\//, '').split('/')[0] || 'en';
}

/**
 * Maps an EDS rootPath (e.g. "/en/news") to a JCR content path for use on the author tier.
 * The author URL follows /content/{site}/{country}/{lang}/...; we locate the lang segment
 * and reconstruct the path by appending the rootPath's sub-path after the lang code.
 * @param {string} rootPath  e.g. "/en/news"
 * @param {string} langCode  e.g. "en"
 * @returns {string|null} JCR path, or null if mapping fails
 */
function resolveJcrRoot(rootPath, langCode) {
  const { pathname } = window.location;
  const parts = pathname.split('/');
  const langIdx = parts.indexOf(langCode);
  if (langIdx === -1) return null;
  const contentRoot = parts.slice(0, langIdx + 1).join('/');

  // Strip the leading "/{lang}" from rootPath to get the sub-path (e.g. "/news")
  const subPath = rootPath.replace(new RegExp(`^\\/${langCode}`), '');
  return `${contentRoot}${subPath}`;
}

/**
 * Fetches child pages from the AEM JCR on the author tier.
 * Uses the Sling GET servlet (.2.json) which returns one level of child nodes
 * including their jcr:content properties.
 * Note: og:image is not reliably available from .2.json, so image is omitted on author.
 * @param {string} rootPath  EDS-style path, e.g. "/en/news"
 * @param {string} langCode
 * @returns {Promise<Array>}
 */
async function fetchAuthorListPages(rootPath, langCode) {
  const jcrRoot = resolveJcrRoot(rootPath, langCode);
  if (!jcrRoot) return [];

  try {
    const resp = await fetch(`${jcrRoot}.2.json`);
    if (!resp.ok) return [];
    const json = await resp.json();

    const pages = [];
    Object.entries(json).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;
      if (value['jcr:primaryType'] !== 'cq:Page') return;
      const content = value['jcr:content'] || {};
      const title = content['jcr:title'] || key;
      const lastModifiedRaw = content['cq:lastModified'] || content['jcr:lastModified'] || '';
      pages.push({
        path: `${rootPath}/${key}`,
        title,
        description: content['jcr:description'] || '',
        image: '',
        lastModified: lastModifiedRaw ? new Date(lastModifiedRaw).getTime() / 1000 : 0,
        listOrder: parseInt(content.listOrder, 10) || null,
      });
    });

    return pages;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('List block: failed to fetch author page list', e);
    return [];
  }
}

/**
 * Fetches published pages from the EDS query index.
 * First tries a scoped index at {rootPath}/query-index.json (small, fast).
 * Falls back to /{lang}/query-index.json with path-prefix filtering if the scoped index
 * returns a 404 (i.e. no dedicated index exists for that path yet).
 * @param {string} rootPath  e.g. "/en/news"
 * @param {string} langCode  e.g. "en"
 * @returns {Promise<Array>}
 */
async function fetchPublishedListPages(rootPath, langCode) {
  const base = (window.hlx && window.hlx.codeBasePath) || '';

  // Try scoped index first
  const scopedUrl = `${base}${rootPath}/query-index.json`;
  try {
    const probe = await fetch(scopedUrl, { method: 'HEAD' });
    if (probe.ok) {
      const items = await ffetch(scopedUrl).all();
      return items.map((p) => ({
        path: p.path,
        title: p.title || p.navTitle || '',
        description: p.description || '',
        image: p.image || '',
        lastModified: p.lastModified || 0,
        listOrder: p.listOrder ? parseInt(p.listOrder, 10) : null,
      }));
    }
  } catch (e) {
    // scoped index unavailable — fall through to full index
  }

  // Fallback: full language index filtered by path prefix
  const langIndexUrl = `${base}/${langCode}/query-index.json`;
  try {
    const items = await ffetch(langIndexUrl)
      .filter((p) => p.path && p.path.startsWith(`${rootPath}/`))
      .all();
    return items.map((p) => ({
      path: p.path,
      title: p.title || p.navTitle || '',
      description: p.description || '',
      image: p.image || '',
      lastModified: p.lastModified || 0,
      listOrder: p.listOrder ? parseInt(p.listOrder, 10) : null,
    }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('List block: failed to fetch query index', e);
    return [];
  }
}

/**
 * Sorts pages by the configured mode.
 * - alphabetical:  ascending by title
 * - lastModified:  descending by lastModified timestamp (newest first)
 * - listOrder:     numeric listOrder ascending, then alphabetical for pages with no value
 * @param {Array} pages
 * @param {string} sortBy
 * @returns {Array}
 */
function sortPages(pages, sortBy) {
  const sorted = [...pages];
  if (sortBy === 'lastModified') {
    sorted.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
  } else if (sortBy === 'listOrder') {
    sorted.sort((a, b) => {
      const oa = a.listOrder !== null ? a.listOrder : 9999;
      const ob = b.listOrder !== null ? b.listOrder : 9999;
      if (oa !== ob) return oa - ob;
      return (a.title || '').localeCompare(b.title || '');
    });
  } else {
    // alphabetical (default)
    sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }
  return sorted;
}

/**
 * Formats a Unix timestamp (seconds) as a localised date string.
 * @param {number} ts
 * @returns {string}
 */
function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString(document.documentElement.lang || 'en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Builds and returns the <ul> list element from the page array.
 * @param {Array} pages
 * @param {{ showDescription: boolean, showImage: boolean, showDate: boolean }} config
 * @returns {Element}
 */
function renderList(pages, config) {
  const { showDescription, showImage, showDate } = config;
  const ul = document.createElement('ul');
  ul.className = 'list-items';

  pages.forEach((page) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const a = document.createElement('a');
    a.href = page.path;

    if (showImage && page.image) {
      const pic = createOptimizedPicture(page.image, page.title, false, [{ width: '400' }]);
      pic.classList.add('list-item-image');
      a.append(pic);
    }

    const body = document.createElement('div');
    body.className = 'list-item-body';

    const heading = document.createElement('h3');
    heading.textContent = page.title;
    body.append(heading);

    if (showDescription && page.description) {
      const desc = document.createElement('p');
      desc.className = 'list-item-description';
      desc.textContent = page.description;
      body.append(desc);
    }

    if (showDate && page.lastModified) {
      const dateEl = document.createElement('p');
      dateEl.className = 'list-item-date';
      const time = document.createElement('time');
      time.dateTime = new Date(page.lastModified * 1000).toISOString().split('T')[0];
      time.textContent = formatDate(page.lastModified);
      dateEl.append(time);
      body.append(dateEl);
    }

    a.append(body);
    li.append(a);
    ul.append(li);
  });

  return ul;
}

/**
 * List block decorator.
 * Reads config from the block's authored rows, fetches child pages from the appropriate
 * data source (JCR on author, query index on EDS), sorts them, and renders the list.
 * @param {Element} block
 */
export default async function decorate(block) {
  const config = readConfig(block);
  const { rootPath, sortBy, limit } = config;
  const langCode = getLangFromPath(rootPath);

  // Add a sort-mode class for CSS targeting
  block.classList.add(`list-sortby-${sortBy}`);

  // Clear the raw config rows before rendering
  block.textContent = '';

  let pages;
  if (isAuthorEnvironment()) {
    pages = await fetchAuthorListPages(rootPath, langCode);
  } else {
    pages = await fetchPublishedListPages(rootPath, langCode);
  }

  if (!pages || !pages.length) {
    const empty = document.createElement('p');
    empty.className = 'list-empty';
    empty.textContent = 'No pages found.';
    block.append(empty);
    return;
  }

  const sorted = sortPages(pages, sortBy);
  const limited = limit > 0 ? sorted.slice(0, limit) : sorted;

  block.append(renderList(limited, config));
}
