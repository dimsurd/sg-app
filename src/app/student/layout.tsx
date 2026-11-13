import { MobileShell } from "@/components/mobile-shell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell role="student">{children}</MobileShell>;
}
