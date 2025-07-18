import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId, sessionClaims } = await auth();
    await auth.protect();
    // Forçage du rôle ADMIN pour l'utilisateur cible
    if (userId && sessionClaims?.email_address === 'tatchumkamgajordandouglas@gmail.com') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.role !== 'ADMIN') {
        await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
      }
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}