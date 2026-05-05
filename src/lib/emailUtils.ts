import type { Candidate } from "@/components/candidates/CandidateTable";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function padEnd(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

export function generateBulkEmail(candidates: Candidate[]): {
  subject: string;
  body: string;
} {
  const shortlisted = candidates.filter((c) => c.status === "SHORTLIST");
  const rejected = candidates.filter((c) => c.status === "REJECT");

  const roleCount = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.role] = (acc[c.role] ?? 0) + 1;
    return acc;
  }, {});
  const topRole =
    Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Multiple Roles";

  const subject = `Screening Summary – ${topRole} – ${formatDate(new Date())}`;

  const lines: string[] = [];
  lines.push("Hi Team,");
  lines.push("");
  lines.push(`Please find below the screening summary for the ${topRole} position.`);
  lines.push("");

  if (shortlisted.length > 0) {
    lines.push(`SCREEN SELECTED (${shortlisted.length})`);
    lines.push("");

    // Column widths
    const nameW = Math.min(30, Math.max(20, ...shortlisted.map((c) => c.name.length)));
    const scoreW = 8;
    const levelW = 16;
    const strengthW = 40;

    const sep = `+${"-".repeat(nameW + 2)}+${"-".repeat(scoreW + 2)}+${"-".repeat(levelW + 2)}+${"-".repeat(strengthW + 2)}+`;
    const header = `| ${padEnd("Name", nameW)} | ${padEnd("Score", scoreW)} | ${padEnd("Level", levelW)} | ${padEnd("Key Strengths", strengthW)} |`;

    lines.push(sep);
    lines.push(header);
    lines.push(sep);

    for (const c of shortlisted) {
      const level = c.analysis?.experienceLevel ?? "—";
      const strengths = (c.analysis?.strengths ?? []).slice(0, 2).join("; ") || "—";
      lines.push(
        `| ${padEnd(c.name, nameW)} | ${padEnd(`${c.score}/100`, scoreW)} | ${padEnd(level, levelW)} | ${padEnd(strengths, strengthW)} |`,
      );
    }
    lines.push(sep);
    lines.push("");
  }

  if (rejected.length > 0) {
    lines.push(`SCREEN REJECTED (${rejected.length})`);
    lines.push("");

    const nameW = Math.min(30, Math.max(20, ...rejected.map((c) => c.name.length)));
    const scoreW = 8;
    const levelW = 16;
    const gapW = 40;

    const sep = `+${"-".repeat(nameW + 2)}+${"-".repeat(scoreW + 2)}+${"-".repeat(levelW + 2)}+${"-".repeat(gapW + 2)}+`;
    const header = `| ${padEnd("Name", nameW)} | ${padEnd("Score", scoreW)} | ${padEnd("Level", levelW)} | ${padEnd("Key Gaps", gapW)} |`;

    lines.push(sep);
    lines.push(header);
    lines.push(sep);

    for (const c of rejected) {
      const level = c.analysis?.experienceLevel ?? "—";
      const gaps = (c.analysis?.gaps ?? []).slice(0, 2).join("; ") || "—";
      lines.push(
        `| ${padEnd(c.name, nameW)} | ${padEnd(`${c.score}/100`, scoreW)} | ${padEnd(level, levelW)} | ${padEnd(gaps, gapW)} |`,
      );
    }
    lines.push(sep);
    lines.push("");
  }

  lines.push("Best regards,");
  lines.push("[Your Name]");

  return { subject, body: lines.join("\n") };
}

export function generateCandidateEmail(candidate: Candidate): {
  subject: string;
  body: string;
} {
  const isShortlisted = candidate.status === "SHORTLIST";
  const statusText = isShortlisted ? "SCREEN SELECTED" : "SCREEN REJECTED";
  const subject = `Candidate Profile – ${candidate.name} – ${candidate.role} – ${statusText}`;

  const level = candidate.analysis?.experienceLevel ?? "Unknown";
  const summary = candidate.analysis?.summary ?? "";
  const strengths = candidate.analysis?.strengths ?? [];
  const gaps = candidate.analysis?.gaps ?? [];

  const lines: string[] = [];
  lines.push("Hi Team,");
  lines.push("");
  lines.push(
    `Here is the screening summary for ${candidate.name} who applied for the ${candidate.role} position.`,
  );
  lines.push("");
  lines.push(`Status: ${statusText}`);
  lines.push(`Score: ${candidate.score}/100  |  Experience Level: ${level}`);

  if (summary) {
    lines.push("");
    lines.push("Summary:");
    lines.push(summary);
  }

  if (isShortlisted && strengths.length > 0) {
    lines.push("");
    lines.push("Strengths:");
    for (const s of strengths) {
      lines.push(`• ${s}`);
    }
  }

  if (!isShortlisted && gaps.length > 0) {
    lines.push("");
    lines.push("Gaps / Areas of concern:");
    for (const g of gaps) {
      lines.push(`• ${g}`);
    }
  }

  lines.push("");
  lines.push(
    isShortlisted
      ? "Please proceed with scheduling an interview."
      : "No further action required for this candidate.",
  );
  lines.push("");
  lines.push("Best regards,");
  lines.push("[Your Name]");

  return { subject, body: lines.join("\n") };
}
