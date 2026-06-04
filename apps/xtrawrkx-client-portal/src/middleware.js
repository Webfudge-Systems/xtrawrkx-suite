import { NextResponse } from 'next/server';

export function middleware(request) {
    // Check if onboarding is enabled
    const onboardingEnabled = true;

    // If onboarding is disabled and user tries to access /onboarding, redirect to 404
    if (!onboardingEnabled && request.nextUrl.pathname.startsWith('/onboarding')) {
        return NextResponse.rewrite(new URL('/', request.url));
    }

    // For now, we'll let the page handle auth checks
    // In a real implementation, you would check the user's auth status here

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
