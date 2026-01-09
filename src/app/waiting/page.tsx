import { redirect } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import { getSessionToken } from "@/lib/auth";
import { WaitingRoom } from "@/components/waiting-room";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function WaitingPage() {
  const token = await getSessionToken();

  if (!token) {
    redirect("/login");
  }

  const user = await convex.query(api.users.me, { sessionToken: token });

  if (!user) {
    redirect("/login");
  }

  // If user has workspaces, redirect to dashboard
  const hasWorkspaces = user.workspaces && user.workspaces.length > 0;
  if (hasWorkspaces) {
    redirect("/");
  }

  // If user is approved but has no workspace, redirect to setup to create one
  if (user.isApproved) {
    redirect("/setup");
  }

  return <WaitingRoom user={user} />;
}
