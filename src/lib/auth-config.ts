export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  name: string;
}

export type AuthConfig = { mode: 'local' } | { mode: 'oidc'; oidc: OidcConfig };

export function readAuthConfig(env: Record<string, string | undefined>): AuthConfig {
  const mode = (env.TASKS_AUTH ?? '').trim().toLowerCase() || 'local';
  if (mode === 'local') return { mode };
  if (mode !== 'oidc') {
    throw new Error(`TASKS_AUTH must be "local" or "oidc", not "${env.TASKS_AUTH}".`);
  }

  const required = ['TASKS_OIDC_ISSUER', 'TASKS_OIDC_CLIENT_ID', 'TASKS_OIDC_CLIENT_SECRET'];
  const missing = required.filter(name => !env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`TASKS_AUTH=oidc also needs ${missing.join(', ')}.`);
  }

  return {
    mode,
    oidc: {
      issuer: env.TASKS_OIDC_ISSUER!.trim().replace(/\/+$/, ''),
      clientId: env.TASKS_OIDC_CLIENT_ID!.trim(),
      clientSecret: env.TASKS_OIDC_CLIENT_SECRET!.trim(),
      name: env.TASKS_OIDC_NAME?.trim() || 'SSO',
    },
  };
}

export const authConfig = readAuthConfig(process.env);
