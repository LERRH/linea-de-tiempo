import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// "/" is public: it shows the landing page to visitors and the dashboard to signed-in users.
export const config = {
  matcher: ["/timelines/:path*"],
};
