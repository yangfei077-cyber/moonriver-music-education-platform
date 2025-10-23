import { NextResponse } from 'next/server';

// MCP Protected Resource Metadata endpoint (RFC 9728)
export async function GET() {
  return NextResponse.json({
    resource: "https://music-education-platform.vercel.app",
    authorization_servers: [
      "https://genai-2976115566729862.au.auth0.com/.well-known/oauth-authorization-server"
    ],
    scopes_supported: [
      "read:calendar",
      "write:calendar", 
      "read:appointments",
      "write:appointments",
      "read:ai-tools",
      "write:ai-tools"
    ],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://music-education-platform.vercel.app/api/docs",
    mcp_compliant: true
  });
}
