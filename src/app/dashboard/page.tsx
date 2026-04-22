import { Box, Typography, Divider } from "@mui/material";
import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: "text.primary",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Overview and insights
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Coming soon state */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          color: "text.secondary",
          minHeight: 320,
        }}
      >
        <LayoutDashboard size={40} strokeWidth={1.2} color="#CBD5E1" />
        <Typography variant="body1" fontWeight={600} color="text.secondary">
          Coming soon
        </Typography>
        <Typography variant="body2" color="text.disabled" textAlign="center">
          Analytics, pipeline metrics, and hiring insights will appear here.
        </Typography>
      </Box>
    </Box>
  );
}
