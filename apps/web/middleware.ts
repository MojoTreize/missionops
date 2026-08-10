import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/config";

/**
 * Premier filtrage des routes protégées : on redirige vers `/login` en
 * l'absence de cookie de session. Ce contrôle est volontairement superficiel
 * (le middleware s'exécute sur le runtime Edge, sans accès à la base) ; la
 * validation réelle de la session est faite côté serveur dans `(app)/layout`.
 */
export function middleware(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
