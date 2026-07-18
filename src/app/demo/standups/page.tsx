import { AppNav } from "@/components/AppNav";
import { DemoBanner } from "@/components/DemoBanner";
import { StandupGenerator } from "@/components/StandupGenerator";
import { demoIntern } from "@/data/demo";

export default function DemoStandupsPage() {
  return (
    <main>
      <DemoBanner />
      <AppNav demo basePath="/demo" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-bold">Standups</h1>
        <p className="mt-2 text-sm text-[var(--mist)]">
          Demo generator — template engine, no OAuth, no network.
        </p>
        <div className="mt-6">
          <StandupGenerator
            demo
            events={demoIntern.events}
            internshipStart={demoIntern.internshipStartDate}
          />
        </div>
      </div>
    </main>
  );
}
