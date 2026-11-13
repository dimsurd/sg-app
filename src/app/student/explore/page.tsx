import type { Metadata } from "next";
import { ClassCatalogue } from "@/components/student/class-catalogue";

export const metadata: Metadata = { title: "Explore classes" };

export default function ExplorePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Explore classes</h1>
        <p className="text-sm text-muted-foreground">Small groups, one tutor. Pay per package of hours.</p>
      </div>
      <ClassCatalogue />
    </div>
  );
}
