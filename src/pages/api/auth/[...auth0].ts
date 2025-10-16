import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0';

export default handleAuth({
  login: handleLogin({
    authorizationParams: {
      scope: 'openid profile email',
      // If you set an API Audience in .env.local, you can add it here too
      // audience: process.env.AUTH0_AUDIENCE,
    },
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL,
  }),
  callback: handleCallback({
    // Optionally enrich the session after Auth0 callback
    afterCallback: async (_req, _res, session) => {
      // Example: derive a role from email for demo; replace with RBAC/Rules/Actions if needed
      const email = session.user?.email || '';
      let roles: string[] = [];
      if (email.endsWith('@moonriver.com')) {
        const prefix = email.split('@')[0];
        roles = prefix === 'admin' ? ['admin'] : prefix === 'educator' ? ['educator'] : ['student'];
      } else {
        roles = ['student'];
      }
      (session.user as any)['https://moonriver.com/roles'] = roles;
      return session;
    },
  }),
});


