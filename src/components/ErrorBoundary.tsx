"use client";
import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import AppButton from "@/components/ui/AppButton";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
        p: 4,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#37474F" }}>
        Something went wrong
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 480, textAlign: "center" }}
      >
        {error.message || "An unexpected error occurred. Please try again."}
      </Typography>
      <AppButton variant="outlined" onClick={reset} sx={{ mt: 1 }}>
        Try again
      </AppButton>
    </Box>
  );
}
