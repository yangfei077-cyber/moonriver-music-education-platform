import { getAccessToken } from "@auth0/nextjs-auth0";

// Auth0 v4 Token Vault helper functions
export const auth0 = {
  async getAccessTokenForConnection({ connection }: { connection: string }) {
    try {
      const accessToken = await getAccessToken({
        audience: connection,
      });
      
      return { token: accessToken };
    } catch (error) {
      console.error('Error getting access token for connection:', error);
      return { token: null };
    }
  }
};
