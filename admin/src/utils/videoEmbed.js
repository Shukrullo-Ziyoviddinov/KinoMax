/**
 * YouTube / Mover.uz havolalaridan (yoki iframe HTML dan) embed URL yasaydi.
 */

/**
 * Input URL yoki <iframe src="..."> bo‘lishi mumkin — toza URL qaytaradi.
 */
export function extractVideoInputUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  // To‘liq yoki qisman iframe HTML
  if (/<iframe[\s>]/i.test(raw) || /src\s*=/i.test(raw)) {
    const match =
      raw.match(/<iframe[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i) ||
      raw.match(/\bsrc\s*=\s*["'](https?:\/\/[^"']+)["']/i) ||
      raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (match?.[1]) {
      return match[1]
        .trim()
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'");
    }
  }

  return raw;
}

export function getYouTubeVideoId(url) {
  const raw = extractVideoInputUrl(url);
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0] || '';
      return id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = parsed.searchParams.get('v');
      if (v) return v.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'v') {
        return (parts[1] || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
      }
    }
  } catch {
    /* ignore */
  }

  return '';
}

/**
 * Mover: /watch/ID, /video/embed/ID
 */
export function getMoverVideoId(url) {
  const raw = extractVideoInputUrl(url);
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host !== 'mover.uz') return '';

    const parts = parsed.pathname.split('/').filter(Boolean);
    // /watch/mXqLYRt5
    if (parts[0] === 'watch' && parts[1]) {
      return parts[1].replace(/[^a-zA-Z0-9_-]/g, '');
    }
    // /video/embed/mXqLYRt5
    if (parts[0] === 'video' && parts[1] === 'embed' && parts[2]) {
      return parts[2].replace(/[^a-zA-Z0-9_-]/g, '');
    }
  } catch {
    /* ignore */
  }

  return '';
}

export function isYouTubeUrl(url) {
  return Boolean(getYouTubeVideoId(url));
}

export function isMoverUrl(url) {
  return Boolean(getMoverVideoId(url));
}

export function getYouTubeEmbedUrl(url, { autoplay = false } = {}) {
  const id = getYouTubeVideoId(url);
  if (!id) return '';
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function getMoverEmbedUrl(url) {
  const id = getMoverVideoId(url);
  if (!id) return '';
  return `https://mover.uz/video/embed/${id}`;
}

/**
 * @returns {{ provider: 'youtube'|'mover', embedUrl: string } | null}
 */
export function getVideoEmbed(url, options = {}) {
  const raw = extractVideoInputUrl(url);
  if (!raw) return null;

  if (isYouTubeUrl(raw)) {
    return {
      provider: 'youtube',
      embedUrl: getYouTubeEmbedUrl(raw, options),
    };
  }

  if (isMoverUrl(raw)) {
    return {
      provider: 'mover',
      embedUrl: getMoverEmbedUrl(raw),
    };
  }

  return null;
}

export function isEmbeddableVideoUrl(url) {
  return Boolean(getVideoEmbed(url));
}

/**
 * Iframe/URL ni toza saqlash uchun: embed URL bo‘lsa uni, aks holda asl matn.
 */
export function normalizeVideoSource(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const embed = getVideoEmbed(raw)?.embedUrl;
  return embed || extractVideoInputUrl(raw) || raw;
}
