import { describe, expect, it } from 'vitest';
import { readAuthConfig } from './auth-config';

const oidcEnv = {
  TASKS_AUTH: 'oidc',
  TASKS_OIDC_ISSUER: 'https://id.example.com/tasks/',
  TASKS_OIDC_CLIENT_ID: 'client',
  TASKS_OIDC_CLIENT_SECRET: 'secret',
};

describe('readAuthConfig', () => {
  it('uses local accounts when TASKS_AUTH is unset or empty', () => {
    expect(readAuthConfig({})).toEqual({ mode: 'local' });
    expect(readAuthConfig({ TASKS_AUTH: '' })).toEqual({ mode: 'local' });
  });

  it('ignores OIDC settings in local mode', () => {
    expect(readAuthConfig({ ...oidcEnv, TASKS_AUTH: 'local' })).toEqual({ mode: 'local' });
  });

  it('reads the OIDC settings, dropping the trailing slash from the issuer', () => {
    expect(readAuthConfig(oidcEnv)).toEqual({
      mode: 'oidc',
      oidc: {
        issuer: 'https://id.example.com/tasks',
        clientId: 'client',
        clientSecret: 'secret',
        name: 'SSO',
      },
    });
  });

  it('accepts the mode in any case and uses the configured button name', () => {
    const config = readAuthConfig({ ...oidcEnv, TASKS_AUTH: ' OIDC ', TASKS_OIDC_NAME: 'Company SSO' });
    expect(config).toMatchObject({ mode: 'oidc', oidc: { name: 'Company SSO' } });
  });

  it('names every missing OIDC setting', () => {
    expect(() => readAuthConfig({ TASKS_AUTH: 'oidc', TASKS_OIDC_CLIENT_ID: 'client' })).toThrow(
      'TASKS_AUTH=oidc also needs TASKS_OIDC_ISSUER, TASKS_OIDC_CLIENT_SECRET.'
    );
  });

  it('rejects an unknown mode', () => {
    expect(() => readAuthConfig({ TASKS_AUTH: 'both' })).toThrow('TASKS_AUTH must be "local" or "oidc"');
  });
});
