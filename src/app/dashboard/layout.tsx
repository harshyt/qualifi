"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  LinearProgress,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from "@mui/material";
import { Menu as MenuIcon } from "lucide-react";
import Sidebar from "@/components/Sidebar";

const drawerWidth = 240;

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
      aria-label="Loading"
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        sx={{
          display: { md: "none" },
          bgcolor: "#FFFFFF",
          color: "#37474F",
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontWeight: 700, color: "#2196F3" }}
          >
            Qualifi
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Responsive Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: { xs: 2, sm: 3 },
          pt: { xs: 10, sm: 11, md: 3 },
          position: "relative",
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <NavigationProgress />
        {children}
      </Box>
    </Box>
  );
}
