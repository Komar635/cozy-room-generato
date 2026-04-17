import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Защищаем только определённые роуты
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/api/projects/:path*',
    '/api/models/:path*',
    '/api/modifications/:path*',
  ],
};
