import { AppNav } from "@/components/AppNav";
import { DashboardView } from "@/components/DashboardView";
import { DemoBanner } from "@/components/DemoBanner";
import { demoIntern } from "@/data/demo";

export default function DemoPage() {
  return (
    <main>
      <DemoBanner />
      <AppNav demo basePath="/demo" />
      <DashboardView
        demo
        events={demoIntern.events}
        internshipStart={demoIntern.internshipStartDate}
        internshipEnd={demoIntern.internshipEndDate}
      />
    </main>
  );
}
