// import { sign } from "crypto";
import type { NextAuthConfig } from "next-auth";
// import { pages } from "next/dist/build/templates/app-page";

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized( { auth, request: { nextUrl }}) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false;
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;