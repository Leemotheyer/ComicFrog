import * as cheerio from 'cheerio';
import { Impit } from 'impit';

const BASE_URL = 'https://leagueofcomicgeeks.com';

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

  const variantParam = url.searchParams.get('variant');
  const comicId = variantParam ? Number(variantParam) : Number(match[1]);

  return { comicId, url: url.href };
}

function getText($, el) {
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

function extractVariantName($) {
  const active = $('.cover-variant-list .active, .variant-thumbs .active, .cover-variant.active');
  if (active.length) {
    return getText($, active);
  }
  return '';
}

function locgCoverUrl(comicId) {
  return `https://s3.amazonaws.com/comicgeeks/comics/covers/large-${comicId}.jpg`;
}

function upgradeCoverUrl(url, comicId) {
  if (url) {
    const upgraded = url
      .replace(/\/covers\/medium-(\d+)/, '/covers/large-$1')
      .replace(/\/covers\/small-(\d+)/, '/covers/large-$1')
      .replace(/\?.*$/, '');
    if (upgraded.includes('/covers/large-')) {
      return upgraded;
    }
  }
  return locgCoverUrl(comicId);
}

export async function fetchLocgComic(input) {
  const { comicId, url: locgUrl } = parseLocgUrl(input);

  const impit = new Impit({ browser: 'chrome' });
  const pageUrl = `${BASE_URL}/comic/${comicId}/x`;
  const response = await impit.fetch(pageUrl);

  if (response.status === 404) {
    throw new Error('Comic not found on League of Comic Geeks');
  }
  if (!response.ok) {
    throw new Error(`Could not fetch comic from League of Comic Geeks (${response.status})`);
  }

  const html = await response.text();
  if (html.includes('Just a moment...') || html.includes('Access Restricted')) {
    throw new Error('Could not reach League of Comic Geeks. Try again in a moment.');
  }

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
  const coverImage = upgradeCoverUrl(ogCover, comicId);
  const { series: parsedSeries, issueNumber } = parseTitleParts(name);
  const series = extractSeriesName($) || parsedSeries;
  const variantCover = extractVariantName($);

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
