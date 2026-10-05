// src/proxy.ts
// Gives every browser a signed anonymous identity (device ID + funny username) on first visit.

import { NextResponse, type NextRequest } from "next/server";
import {
  IDENTITY_COOKIE,
  cookieOptions,
  decodeIdentity,
  encodeIdentity,
  needsRefresh,
  newIdentity,
  nowSeconds,
} from "@/lib/identity/cookie";

export function proxy(request: NextRequest) {
  const existing = decodeIdentity(request.cookies.get(IDENTITY_COOKIE)?.value);
  if (existing && !needsRefresh(existing)) return NextResponse.next();

  const identity = existing ? { ...existing, issuedAt: nowSeconds() } : newIdentity();
  const value = encodeIdentity(identity);

  // Make the new cookie visible to this same request's server code.
  request.cookies.set(IDENTITY_COOKIE, value);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(IDENTITY_COOKIE, value, cookieOptions());
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|evidence|sw.js|favicon.ico|icon|apple-icon|manifest.webmanifest|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)",
  ],
};
