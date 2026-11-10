import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { isPrivateAddress, parsePreview } = await import('./linkPreview');

describe('isPrivateAddress', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', '::ffff:127.0.0.1'])(
    'blocks %s',
    (ip) => expect(isPrivateAddress(ip)).toBe(true)
  );
  it.each(['93.184.216.34', '1.1.1.1', '2606:4700:4700::1111'])('allows %s', (ip) =>
    expect(isPrivateAddress(ip)).toBe(false)
  );
});

describe('parsePreview', () => {
  const page = new URL('https://www.example.com/articles/1');

  it('prefers OpenGraph and resolves relative urls', () => {
    const html = `<html><head><title>Fallback</title>
      <meta property="og:title" content="Tram 28 &amp; more">
      <meta content="/img/cover.jpg" property="og:image">
      <link rel="icon" href="/fav.png"></head><body></body></html>`;
    expect(parsePreview(html, page)).toEqual({
      title: 'Tram 28 & more',
      description: null,
      image: 'https://www.example.com/img/cover.jpg',
      favicon: 'https://www.example.com/fav.png',
      domain: 'example.com',
    });
  });

  it('falls back to <title> and /favicon.ico', () => {
    const p = parsePreview('<head><title> Hello  world </title></head>', page);
    expect(p.title).toBe('Hello world');
    expect(p.favicon).toBe('https://www.example.com/favicon.ico');
    expect(p.image).toBeNull();
  });

  it('drops non-http image urls', () => {
    const p = parsePreview('<head><meta property="og:image" content="javascript:alert(1)"></head>', page);
    expect(p.image).toBeNull();
  });
});
