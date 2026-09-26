process.env.NEXTAUTH_URL ??= process.env.TASKS_NEXTAUTH_URL;

const useSecureCookies = (process.env.TASKS_NEXTAUTH_URL ?? '').startsWith('https://');

const securePrefix = useSecureCookies ? '__Secure-' : '';

export const sessionCookieName = `${securePrefix}tasks.session-token`;
export const callbackCookieName = `${securePrefix}tasks.callback-url`;
export const csrfCookieName = `${useSecureCookies ? '__Host-' : ''}tasks.csrf-token`;

export const baseCookieOptions = {
  sameSite: 'lax' as const,
  path: '/',
  secure: useSecureCookies,
};
