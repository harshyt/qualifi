"use client";
import { Box, Typography } from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { useActiveBatch } from "@/hooks/useActiveBatch";
import { useBatch } from "@/hooks/useBatch";
import { lightTokens } from "@/theme/tokens";

function PulsingDot() {
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
          "50%": { opacity: 0.4 },
        },
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

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
        bgcolor: "#1e1e2e",
        borderRadius: "24px",
        px: 1.5,
        py: 0.75,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        "&:hover": { bgcolor: "#2a2a3e" },
        transition: "background-color 0.15s",
      }}
    >
      <PulsingDot />
      <Typography
        sx={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}
      >
        Analyzing · {done}/{total}
      </Typography>
      <Box
        sx={{
          width: 48,
          height: 4,
          borderRadius: 2,
          bgcolor: "rgba(255,255,255,0.15)",
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
      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>↑</Typography>
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
