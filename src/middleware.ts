import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
	function middleware(_req) {
		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token }) => !!token,
		},
		pages: {
			signIn: "/auth/signin",
		},
	},
);

// Защищаем только определённые роуты
export const config = {
	matcher: [
		"/dashboard/:path*",
		"/projects/:path*",
		"/api/projects/:path*",
		"/api/models/:path*",
		"/api/modifications/:path*",
	],
};
