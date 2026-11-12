import { describe, expect, it } from 'vitest';
import { isValidPassword, isValidUsername, safeNextPath, usernameToEmail } from './auth';

describe('auth helpers', () => {
  it('builds the synthetic email from a normalised username', () => {
    expect(usernameToEmail('  Dana ')).toBe('dana@users.ouwork.local');
  });

  it('validates usernames', () => {
    expect(isValidUsername('alberto')).toBe(true);
    expect(isValidUsername('al')).toBe(false);
    expect(isValidUsername('dana@evil.com')).toBe(false);
    expect(isValidUsername('with space')).toBe(false);
  });

  it('validates passwords', () => {
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('long-enough')).toBe(true);
  });

  it('only allows same-origin redirects', () => {
    expect(safeNextPath('/invite/abc')).toBe('/invite/abc');
    expect(safeNextPath('https://evil.com')).toBe('/');
    expect(safeNextPath('//evil.com')).toBe('/');
    expect(safeNextPath(null)).toBe('/');
  });
});
