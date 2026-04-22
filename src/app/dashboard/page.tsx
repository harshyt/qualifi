import { Box, Typography } from "@mui/material";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
        color: "text.secondary",
      }}
    >
      <LayoutDashboard size={48} strokeWidth={1.2} color="#CBD5E1" />
      <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
        Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Coming soon — overview and insights will appear here.
      </Typography>
    </Box>
  );
}
