"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, GraduationCap, Hourglass, ReceiptText } from "lucide-react";
import { SectionTitle, StatTile, WelcomeBanner } from "@/components/home/home-kit";
import { ClassAdvisor } from "@/components/student/class-advisor";
import { FeaturedClasses } from "@/components/student/featured-classes";
import { api, unwrap } from "@/lib/api/client";
import { formatDateTime, formatIDR, formatMinutes, formatTime, TZ } from "@/lib/format";

const shortDay = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });

export default function StudentHome() {
  const classes = useQuery({ queryKey: ["my-classes"], queryFn: () => unwrap(api.GET("/student/classes")) });
  const invoices = useQuery({ queryKey: ["my-invoices"], queryFn: () => unwrap(api.GET("/student/invoices")) });

  const mine = classes.data?.classes ?? [];
  const unpaid = invoices.data?.invoices.filter((i) => i.status === "unpaid") ?? [];
  const toPay = unpaid.reduce((s, i) => s + i.amount, 0);
  const hoursLeft = mine.reduce((s, c) => s + c.remainingMinutes, 0);
  const next = mine
    .filter((c) => c.nextLessonAt)
    .sort((a, b) => a.nextLessonAt!.localeCompare(b.nextLessonAt!))[0];

  const banner =
    unpaid.length > 0
      ? {
          title: "Almost there!",
          body: `Pay your ${unpaid[0]!.className} invoice to unlock the schedule and tutor notes.`,
          action: { href: "/student/invoices", label: "Pay invoice" },
        }
      : next
        ? {
            title: `Next up: ${next.name}`,
            body: `${formatDateTime(next.nextLessonAt!)} with ${next.tutorName}.`,
            action: { href: `/student/classes/${next.id}`, label: "See schedule" },
          }
        : mine.length > 0
          ? { title: "You're all set", body: "No lessons scheduled yet. Your tutor will add them soon." }
          : {
              title: "Find your first class",
              body: "Small groups, one tutor. Pick a subject and level to get started.",
              action: { href: "/student/explore", label: "Explore classes" },
            };

  return (
    <div className="space-y-6">
      <WelcomeBanner eyebrow="Star Generation" title={banner.title} body={banner.body} action={banner.action} />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3">
        <StatTile
          icon={Hourglass}
          tone="navy"
          label="Hours left"
          value={classes.data ? formatMinutes(hoursLeft) : "—"}
          hint={mine.length ? `across ${mine.length} class${mine.length === 1 ? "" : "es"}` : undefined}
          href="/student/classes"
        />
        <StatTile
          icon={CalendarClock}
          tone="green"
          label="Next lesson"
          value={next ? shortDay.format(new Date(next.nextLessonAt!)) : "—"}
          hint={next ? `${formatTime(next.nextLessonAt!)} WIB` : "Nothing scheduled"}
          href={next ? `/student/classes/${next.id}` : undefined}
        />
        <StatTile
          icon={GraduationCap}
          tone="gold"
          label="My classes"
          value={classes.data ? mine.length : "—"}
          href="/student/classes"
        />
        <StatTile
          icon={ReceiptText}
          tone={toPay > 0 ? "red" : "green"}
          label={toPay > 0 ? "To pay" : "Invoices"}
          value={invoices.data ? (toPay > 0 ? formatIDR(toPay) : "All paid") : "—"}
          hint={unpaid.length ? `${unpaid.length} invoice${unpaid.length === 1 ? "" : "s"}` : undefined}
          href="/student/invoices"
        />
      </section>

      <section aria-label="Featured">
        <SectionTitle action={{ href: "/student/explore", label: "See all" }}>Featured classes</SectionTitle>
        <FeaturedClasses />
      </section>

      <ClassAdvisor />
    </div>
  );
}
