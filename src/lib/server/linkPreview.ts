import 'server-only';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

export interface Preview {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  domain: string;
}

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

/** True for loopback, private, link-local, CGNAT, multicast and other non-public ranges. */
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number) as [number, number];
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
    return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') ||
      v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff');
  }
  return true;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('protocol');
  if (url.username || url.password) throw new Error('credentials');
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('port');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) throw new Error('private');
  return url;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim();
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? null) : null;
}

/** Extracts OpenGraph / Twitter / <title> metadata from the <head> of a page. */
export function parsePreview(html: string, pageUrl: URL): Preview {
  const head = html.slice(0, html.search(/<\/head>/i) > 0 ? html.search(/<\/head>/i) : html.length);
  const meta = new Map<string, string>();
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (attr(tag, 'property') ?? attr(tag, 'name'))?.toLowerCase();
    const content = attr(tag, 'content');
    if (key && content && !meta.has(key)) meta.set(key, decode(content));
  }
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  let icon: string | null = null;
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = attr(tag, 'rel')?.toLowerCase() ?? '';
    if (/\bicon\b/.test(rel)) {
      icon = attr(tag, 'href');
      if (rel.includes('apple-touch-icon')) break;
    }
  }
  const abs = (u: string | null | undefined) => {
    if (!u) return null;
    try {
      const resolved = new URL(decode(u), pageUrl);
      return resolved.protocol === 'https:' || resolved.protocol === 'http:' ? resolved.toString() : null;
    } catch {
      return null;
    }
  };
  const clip = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : null);
  return {
    title: clip(meta.get('og:title') ?? meta.get('twitter:title') ?? (titleTag ? decode(titleTag) : null), 200),
    description: clip(meta.get('og:description') ?? meta.get('description') ?? meta.get('twitter:description'), 300),
    image: abs(meta.get('og:image') ?? meta.get('og:image:url') ?? meta.get('twitter:image')),
    favicon: abs(icon) ?? new URL('/favicon.ico', pageUrl).toString(),
    domain: pageUrl.hostname.replace(/^www\./, ''),
  };
}

/** Fetches a public page with SSRF guards (no private hosts, manual redirects, size and time limits). */
export async function fetchPreview(raw: string): Promise<Preview> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; OuWorkPreview/1.0)', accept: 'text/html,*/*;q=0.5' },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) break;
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.includes('html') || !res.body) break;

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
      if (new TextDecoder().decode(value).match(/<\/head>/i)) break;
    }
    await reader.cancel().catch(() => undefined);
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return parsePreview(html, url);
  }
  return { title: null, description: null, image: null, favicon: null, domain: url.hostname.replace(/^www\./, '') };
}
