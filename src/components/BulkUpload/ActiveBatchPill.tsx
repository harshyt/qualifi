"use client";
import { memo } from "react";
import { Box, Typography } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useActiveBatch } from "@/hooks/useActiveBatch";
import { useBatch } from "@/hooks/useBatch";
import { lightTokens } from "@/theme/tokens";

// Intentionally dark/inverse — these are not in lightTokens
const PILL = {
  bg: "#1e1e2e",
  bgHover: "#2a2a3e",
  text: "#fff",
  textMuted: "rgba(255,255,255,0.5)",
  track: "rgba(255,255,255,0.15)",
} as const;

const PulsingDot = memo(function PulsingDot() {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: lightTokens.brandBase,
        flexShrink: 0,
        "@keyframes pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
});

function ActivePill({ batchId }: { batchId: string }) {
  const router = useRouter();
  const { data } = useBatch(batchId);

  const batch = data?.batch;
  const counts = data?.counts;

  if (!batch || batch.status === "done") return null;

  const done = (counts?.done ?? 0) + (counts?.error ?? 0);
  const total = batch.total_files;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <Box
      onClick={() => router.push(`/bulk-upload/${batchId}`)}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: PILL.bg,
        borderRadius: "24px",
        px: 1.5,
        py: 0.75,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        "&:hover": { bgcolor: PILL.bgHover },
        transition: "background-color 0.15s",
        "@keyframes slideUp": {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        animation: "slideUp 0.25s ease",
      }}
    >
      <PulsingDot />
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: PILL.text, whiteSpace: "nowrap" }}>
        Analyzing · {done}/{total}
      </Typography>
      <Box
        sx={{
          width: 48,
          height: 4,
          borderRadius: 2,
          bgcolor: PILL.track,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${pct}%`,
            bgcolor: lightTokens.brandBase,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </Box>
      <Typography sx={{ fontSize: 11, color: PILL.textMuted }}>↑</Typography>
    </Box>
  );
}

export default function ActiveBatchPill() {
  const pathname = usePathname();
  const { data } = useActiveBatch();

  // Hide on the processing / results pages
  if (pathname?.startsWith("/bulk-upload/")) return null;

  const batchId = data?.batch?.id;
  if (!batchId) return null;

  return <ActivePill batchId={batchId} />;
}
