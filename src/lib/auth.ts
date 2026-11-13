// Username + password login on top of Supabase Auth, which requires an email:
// we derive a synthetic one. The form only ever asks for the username.

export const USERNAME_DOMAIN = 'users.ouwork.local';
const USERNAME_RE = /^[a-z0-9_.-]{3,24}$/;
export const MIN_PASSWORD_LENGTH = 8;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  return USERNAME_RE.test(normalizeUsername(raw));
}

export function usernameToEmail(raw: string): string {
  return `${normalizeUsername(raw)}@${USERNAME_DOMAIN}`;
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH && password.length <= 72;
}

/** Only same-origin relative paths are allowed as post-login redirects. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/';
  return next;
}
