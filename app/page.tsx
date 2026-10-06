import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <Landing />;

  return <Dashboard userEmail={session.user.email ?? ""} userName={session.user.name ?? ""} />;
}
