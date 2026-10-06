import { NextResponse, type NextRequest } from "next/server";
import { readSessionUserId, SESSION_COOKIE } from "./lib/auth/session";

export function proxy(request: NextRequest) {
  const userId = readSessionUserId(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(userId ? "/caja" : "/login", request.url));
  }
  if (!userId && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (userId && pathname === "/login") {
    return NextResponse.redirect(new URL("/caja", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|pdf)$).*)"],
};
