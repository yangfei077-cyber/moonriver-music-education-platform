import type { NextRequest } from "next/server"

import { auth0 } from "../../../../../lib/auth0" // Adjust path if your auth0 client is elsewhere

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request)
}