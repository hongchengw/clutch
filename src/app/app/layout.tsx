import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <AppNav />
      {children}
    </main>
  );
}
