import { MobileShell } from "@/components/mobile-shell";

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell role="tutor">{children}</MobileShell>;
}
