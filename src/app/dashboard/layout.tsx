"use client";
import AppLayout from "@/components/layout/AppLayout";
import { Box } from "@mui/material";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>{children}</Box>
    </AppLayout>
  );
}
