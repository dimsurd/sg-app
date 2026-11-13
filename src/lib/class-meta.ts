/**
 * Scannable facts about a class, derived from its name and description
 * (the API has no structured level/subject/schedule fields yet).
 * Anything that can't be recognised is simply left out.
 */
export type Subject = "math" | "science" | "english" | "other";

export interface ClassMeta {
  level?: string; // "Grade 6", "Grade 5-6", "SMP"…
  program?: string; // "Cambridge", "IGCSE", "OSN", "Olympiad"
  subject: Subject;
  subjectLabel?: string; // "Math", "Physics", "Biology", "Science", "English"
  day?: string; // "Friday"
  time?: string; // "18.00–19.00 WIB"
  mode?: string; // "Online" | "Offline" | "Hybrid"
}

export function classMeta(name: string, description = ""): ClassMeta {
  const text = `${name} ${description}`;

  const grade = text.match(/\bgrade\s*(\d+(?:\s*-\s*\d+)?)/i);
  const school = text.match(/\b(SD|SMP|SMA)\b/);
  const level = grade ? `Grade ${grade[1]!.replace(/\s/g, "")}` : school?.[1];

  const program = /igcse/i.test(text)
    ? "IGCSE"
    : /cambridge/i.test(text)
      ? "Cambridge"
      : /\bosn\b/i.test(text)
        ? "OSN"
        : /olympiad/i.test(text)
          ? "Olympiad"
          : undefined;

  let subject: Subject = "other";
  let subjectLabel: string | undefined;
  if (/math|matematika/i.test(text)) [subject, subjectLabel] = ["math", "Math"];
  else if (/physics|fisika/i.test(text)) [subject, subjectLabel] = ["science", "Physics"];
  else if (/biolog/i.test(text)) [subject, subjectLabel] = ["science", "Biology"];
  else if (/science|\bipa\b/i.test(text)) [subject, subjectLabel] = ["science", "Science"];
  else if (/english/i.test(text)) [subject, subjectLabel] = ["english", "English"];

  const sched = description.match(/weekly on (\w+),\s*([\d.:]+)\s*[–-]\s*([\d.:]+)\s*WIB(?:,\s*(online|offline|hybrid))?/i);
  return {
    level,
    program,
    subject,
    subjectLabel,
    day: sched?.[1],
    time: sched ? `${sched[2]}–${sched[3]} WIB` : undefined,
    mode: sched?.[4] ? sched[4][0]!.toUpperCase() + sched[4].slice(1).toLowerCase() : undefined,
  };
}
