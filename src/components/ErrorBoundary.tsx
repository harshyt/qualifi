"use client";
import { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";

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
      <Button
        variant="outlined"
        onClick={reset}
        sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
      >
        Try again
      </Button>
    </Box>
  );
}
