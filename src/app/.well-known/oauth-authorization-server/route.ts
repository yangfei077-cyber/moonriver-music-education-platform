import { NextResponse } from 'next/server';

// MCP Authorization Server Metadata endpoint
// This points to Auth0's authorization server metadata
export async function GET() {
  return NextResponse.json({
    issuer: "https://genai-2976115566729862.au.auth0.com/",
    authorization_endpoint: "https://genai-2976115566729862.au.auth0.com/authorize",
    token_endpoint: "https://genai-2976115566729862.au.auth0.com/oauth/token",
    userinfo_endpoint: "https://genai-2976115566729862.au.auth0.com/userinfo",
    jwks_uri: "https://genai-2976115566729862.au.auth0.com/.well-known/jwks.json",
    registration_endpoint: "https://genai-2976115566729862.au.auth0.com/oidc/register",
    scopes_supported: [
      "openid",
      "profile", 
      "email",
      "read:calendar",
      "write:calendar",
      "read:appointments", 
      "write:appointments",
      "read:ai-tools",
      "write:ai-tools"
    ],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    mcp_compliant: true,
    note: "This endpoint provides Auth0 authorization server metadata for MCP clients"
  });
}
