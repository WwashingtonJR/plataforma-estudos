import { courseSources } from './course-sources.js';

const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com']);
const videoIdPattern = /^[\w-]{11}$/;
const playlistIdPattern = /^[\w-]{10,100}$/;

export function describeMedia(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const known = courseSources[value];
    if (!youtubeHosts.has(url.hostname)) {
      return known?.kind === 'external' ? { kind: 'external', original: url.href } : null;
    }
    const list = url.searchParams.get('list');
    if (list && playlistIdPattern.test(list)) {
      const embed = new URL('https://www.youtube-nocookie.com/embed/videoseries');
      embed.searchParams.set('listType', 'playlist');
      embed.searchParams.set('list', list);
      embed.searchParams.set('playsinline', '1');
      return { kind: 'playlist', list, embed: embed.href, original: url.href, count: known?.countText, verified: known?.status === 'available' };
    }
    const [kind, segment] = url.pathname.slice(1).split('/');
    const id = url.hostname === 'youtu.be' ? kind : kind === 'watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(kind) ? segment : null;
    return videoIdPattern.test(id ?? '') ? {
      kind: 'video', embed: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1`, original: url.href,
    } : null;
  } catch {
    return null;
  }
}
