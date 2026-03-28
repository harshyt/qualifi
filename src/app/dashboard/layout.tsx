"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Box, LinearProgress } from "@mui/material";
import Sidebar from "@/components/Sidebar";

function NavigationProgress() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setNavigating(true);
  }

  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => setNavigating(false), 400);
    return () => clearTimeout(timer);
  }, [navigating]);

  if (!navigating) return null;

  return (
    <LinearProgress
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 1300,
        "& .MuiLinearProgress-bar": {
          bgcolor: "#2196F3",
        },
      }}
    />
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: 3,
          position: "relative",
        }}
      >
        <NavigationProgress />
        {children}
      </Box>
    </Box>
  );
}
