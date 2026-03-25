import type { Candidate } from "@/components/Dashboard/DashboardTable";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateBulkEmail(candidates: Candidate[]): {
  subject: string;
  body: string;
} {
  const shortlisted = candidates.filter((c) => c.status === "SHORTLIST");
  const rejected = candidates.filter((c) => c.status === "REJECT");

  // Pick most common role for subject line
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
  lines.push(
    `Please find below the screening summary for the ${topRole} position.`,
  );
  lines.push("");

  if (shortlisted.length > 0) {
    lines.push(
      `── SCREEN SELECTED (${shortlisted.length}) ──────────────────────`,
    );
    lines.push("");
    for (const c of shortlisted) {
      const level = c.analysis?.experienceLevel ?? "Unknown";
      lines.push(`• ${c.name}  |  Score: ${c.score}/100  |  ${level}`);
      const strengths = c.analysis?.strengths?.slice(0, 2) ?? [];
      if (strengths.length > 0) {
        lines.push(`  Strengths: ${strengths.join("; ")}`);
      }
      lines.push("");
    }
  }

  if (rejected.length > 0) {
    lines.push(
      `── SCREEN REJECTED (${rejected.length}) ──────────────────────`,
    );
    lines.push("");
    for (const c of rejected) {
      const level = c.analysis?.experienceLevel ?? "Unknown";
      lines.push(`• ${c.name}  |  Score: ${c.score}/100  |  ${level}`);
      const gaps = c.analysis?.gaps?.slice(0, 2) ?? [];
      if (gaps.length > 0) {
        lines.push(`  Gaps: ${gaps.join("; ")}`);
      }
      lines.push("");
    }
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
