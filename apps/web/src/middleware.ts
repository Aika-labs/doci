import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicPatterns = ['/', '/sign-in', '/sign-up', '/api/webhooks', '/offline'];

export default async function middleware(request: NextRequest) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // No Clerk configured — allow all requests (landing-only mode)
  if (!clerkKey) {
    return NextResponse.next();
  }

  // Dynamically load Clerk middleware only when the key is present
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  const isPublic = createRouteMatcher(publicPatterns.map((p) => p + '(.*)'));

  const handler = clerkMiddleware(async (auth, req) => {
    if (!isPublic(req)) {
      await auth.protect();
    }
  });

  return handler(request, {} as never);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
