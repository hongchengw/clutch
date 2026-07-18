import { ManagerBriefView } from "@/components/ManagerBriefView";

export default async function ManagerPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ManagerBriefView token={token} />;
}
