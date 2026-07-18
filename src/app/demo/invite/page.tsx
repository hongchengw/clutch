import { AppNav } from "@/components/AppNav";
import { DemoBanner } from "@/components/DemoBanner";
import { InviteManagerForm } from "@/components/InviteManagerForm";

export default function DemoInvitePage() {
  return (
    <main>
      <DemoBanner />
      <AppNav demo basePath="/demo" />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <InviteManagerForm demo />
      </div>
    </main>
  );
}
