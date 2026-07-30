import * as cheerio from 'cheerio';
import { Impit } from 'impit';

const BASE_URL = 'https://leagueofcomicgeeks.com';
const MAIN_COVER_LABEL = 'Main Cover';

export function parseLocgUrl(input) {
  const trimmed = input.trim();
  let url;
  try {
    url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error('Invalid LOCG URL');
  }

  if (!url.hostname.replace(/^www\./, '').endsWith('leagueofcomicgeeks.com')) {
    throw new Error('URL must be from leagueofcomicgeeks.com');
  }

  const match = url.pathname.match(/^\/comic\/(\d+)\//);
  if (!match) {
    throw new Error('URL must be a League of Comic Geeks comic link (e.g. .../comic/1234567/slug)');
  }

  const baseComicId = Number(match[1]);
  const variantParam = url.searchParams.get('variant');
  const variantId = variantParam ? Number(variantParam) : null;
  const isVariant = Boolean(variantId);
  const comicId = variantId || baseComicId;

  return {
    comicId,
    baseComicId,
    variantId,
    isVariant,
    url: url.href,
  };
}

function getText($, el) {
  if (!el) return '';
  return $(el).text().replace(/\s+/g, ' ').trim();
}

function parseTitleParts(name) {
  const match = name.match(/^(.+?)\s+#\s*(.+)$/);
  if (match) {
    return { series: match[1].trim(), issueNumber: match[2].trim() };
  }
  return { series: name, issueNumber: '' };
}

function parseReleaseDate(text) {
  if (!text) return '';
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return '';
}

function extractSeriesName($) {
  let seriesName = '';
  $('a[href^="/comics/series/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('submit')) return;
    const text = getText($, el);
    if (text && text !== 'Series') {
      seriesName = text;
    }
  });
  return seriesName;
}

function isValidVariantSubtitle(text, issueTitle) {
  if (!text || text.length < 3) return false;
  if (text === issueTitle) return false;
  if (/reviews?$/i.test(text)) return false;
  if (/league of comic geeks/i.test(text)) return false;
  if (/^credits$/i.test(text)) return false;
  return true;
}

function stripIssuePrefix(name, issueTitle) {
  if (!name) return '';
  if (issueTitle && name.startsWith(issueTitle)) {
    return name.slice(issueTitle.length).trim();
  }

  const match = name.match(/^(.+?\#\s*\S+)\s+(.+)$/);
  if (match) {
    return match[2].trim();
  }

  return name.trim();
}

export function extractVariantNameFromList($, variantId, issueTitle) {
  const item = $(`li[data-comic="${variantId}"]`).first();
  if (!item.length) return '';

  const name = getText($, item.find('.title a, .title, a').first());
  return stripIssuePrefix(name, issueTitle);
}

export function extractVariantSubtitle($, variantId, issueTitle) {
  const subtitleSelectors = [
    '.header-title h2',
    '.comic-header h2',
    'h1 + h2',
  ];

  for (const selector of subtitleSelectors) {
    const text = getText($, $(selector).first());
    if (isValidVariantSubtitle(text, issueTitle)) {
      return text;
    }
  }

  const h1 = $('h1').first();
  const header = h1.closest('.header-title, .comic-header, header, .header');
  if (header.length) {
    for (const el of header.find('h2').toArray()) {
      const text = getText($, el);
      if (isValidVariantSubtitle(text, issueTitle)) {
        return text;
      }
    }
  }

  let sibling = h1.next();
  while (sibling.length) {
    const tag = sibling.prop('tagName')?.toLowerCase();
    const text = getText($, sibling);
    if (text && (tag === 'h2' || tag === 'p' || sibling.hasClass('subtitle'))) {
      if (isValidVariantSubtitle(text, issueTitle)) {
        return text;
      }
    }
    sibling = sibling.next();
  }

  const fromList = extractVariantNameFromList($, variantId, issueTitle);
  if (fromList) return fromList;

  const active = $('.cover-variant-list .active, .variant-thumbs .active, .cover-variant.active').first();
  const activeText = getText($, active);
  if (isValidVariantSubtitle(activeText, issueTitle)) {
    return activeText;
  }

  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  if (ogTitle && issueTitle) {
    for (const part of ogTitle.split('|').map((value) => value.trim())) {
      if (!isValidVariantSubtitle(part, issueTitle)) continue;
      if (part.startsWith(issueTitle)) {
        const trimmed = part.slice(issueTitle.length).trim();
        if (trimmed) return trimmed;
      }
      if (part !== issueTitle) return part;
    }
  }

  return '';
}

export function resolveVariantCover($, { isVariant, variantId, issueTitle }) {
  if (!isVariant) {
    return MAIN_COVER_LABEL;
  }

  const subtitle = extractVariantSubtitle($, variantId, issueTitle);
  return subtitle || 'Variant Cover';
}

function locgCoverUrl(comicId) {
  return `https://s3.amazonaws.com/comicgeeks/comics/covers/large-${comicId}.jpg`;
}

function upgradeCoverUrl(url, comicId) {
  if (url) {
    const upgraded = url
      .replace(/\/covers\/medium-(\d+)/, `/covers/large-${comicId}`)
      .replace(/\/covers\/small-(\d+)/, `/covers/large-${comicId}`)
      .replace(/\/covers\/large-(\d+)/, `/covers/large-${comicId}`)
      .replace(/\?.*$/, '');
    if (upgraded.includes('/covers/large-')) {
      return upgraded;
    }
  }
  return locgCoverUrl(comicId);
}

function extractImageSrc($, img) {
  if (!img.length) return '';
  return img.attr('data-src') || img.attr('src') || '';
}

function extractCoverFromVariantList($, variantId) {
  const item = $(`li[data-comic="${variantId}"]`).first();
  if (!item.length) return '';

  const src = extractImageSrc($, item.find('img').first());
  return src ? upgradeCoverUrl(src, variantId) : '';
}

function extractCoverFromActiveVariant($, variantId) {
  const active = $(
    '.cover-variant-list .active img, .variant-thumbs .active img, .cover-variant.active img',
  ).first();
  const src = extractImageSrc($, active);
  return src ? upgradeCoverUrl(src, variantId) : '';
}

function extractCoverFromPage($, comicId) {
  const selectors = [
    '.comic-cover-art img',
    '.cover-art img',
    '.cover-image img',
    '.primary-cover img',
  ];

  for (const selector of selectors) {
    const src = extractImageSrc($, $(selector).first());
    if (src && !src.includes('no-cover')) {
      return upgradeCoverUrl(src, comicId);
    }
  }

  return '';
}

export function resolveCoverImage($, ogCover, { isVariant, variantId, comicId }) {
  const coverId = isVariant && variantId ? variantId : comicId;

  if (isVariant && variantId) {
    const variantSources = [
      () => extractCoverFromPage($, variantId),
      () => extractCoverFromActiveVariant($, variantId),
      () => extractCoverFromVariantList($, variantId),
      () => (ogCover && ogCover.includes(String(variantId))
        ? upgradeCoverUrl(ogCover, variantId)
        : ''),
      () => locgCoverUrl(variantId),
    ];

    for (const getCover of variantSources) {
      const cover = getCover();
      if (cover) return cover;
    }
  }

  const pageCover = extractCoverFromPage($, coverId);
  if (pageCover) return pageCover;

  if (ogCover) return upgradeCoverUrl(ogCover, coverId);

  return locgCoverUrl(coverId);
}

async function fetchLocgHtml(impit, locgUrl, comicId, isVariant, variantId) {
  const targets = isVariant && variantId
    ? [
        `${BASE_URL}/comic/${variantId}/x`,
        locgUrl,
        `${BASE_URL}/comic/${comicId}/x`,
      ]
    : [
        locgUrl,
        `${BASE_URL}/comic/${comicId}/x`,
      ];

  for (const target of targets) {
    const response = await impit.fetch(target);
    if (response.status === 404) {
      throw new Error('Comic not found on League of Comic Geeks');
    }
    if (!response.ok) {
      continue;
    }

    const html = await response.text();
    if (html.includes('Just a moment...') || html.includes('Access Restricted')) {
      continue;
    }

    return html;
  }

  throw new Error('Could not reach League of Comic Geeks. Try again in a moment.');
}

export async function fetchLocgComic(input) {
  const { comicId, variantId, isVariant, url: locgUrl } = parseLocgUrl(input);

  const impit = new Impit({ browser: 'chrome' });
  const html = await fetchLocgHtml(impit, locgUrl, comicId, isVariant, variantId);
  const $ = cheerio.load(html);
  const name = getText($, 'h1');
  if (!name) {
    throw new Error('Could not parse comic details from the LOCG page');
  }

  const publisher = getText($, '.header-intro a').split('·')[0]?.trim() || '';

  let storeDate = '';
  $('.header-intro a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('/comics/new-comics/')) {
      storeDate = getText($, el);
    }
  });

  const ogCover = $('meta[property="og:image"]').attr('content') || '';
  const coverImage = resolveCoverImage($, ogCover, { isVariant, variantId, comicId });
  const { series: parsedSeries, issueNumber } = parseTitleParts(name);
  const series = extractSeriesName($) || parsedSeries;
  const variantCover = resolveVariantCover($, {
    isVariant,
    variantId,
    issueTitle: name,
  });

  const notes = `Imported from ${locgUrl}`;

  return {
    title: name,
    publisher,
    series,
    issueNumber,
    releaseDate: parseReleaseDate(storeDate),
    coverImage,
    variantCoverImage: '',
    variantCover,
    notes,
    locgUrl,
    locgId: comicId,
  };
}
