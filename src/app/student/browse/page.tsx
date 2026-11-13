import { redirect } from "next/navigation";

/** The catalogue moved to /student/explore; keep old links working. */
export default function BrowseRedirect() {
  redirect("/student/explore");
}
