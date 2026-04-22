"use client";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  Divider,
  LinearProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  Menu as MenuIcon,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers/AuthContext";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useCallback, useState, useTransition, useEffect, memo } from "react";
import { toast } from "sonner";

const DRAWER_WIDTH = 256;

type NavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    match: (p) => p === "/dashboard",
  },
  {
    label: "Candidates",
    icon: Users,
    href: "/candidates",
    match: (p) => p.startsWith("/candidates") || p.startsWith("/candidate/"),
  },
  {
    label: "Job Library",
    icon: Briefcase,
    href: "/jobs",
    match: (p) => p.startsWith("/jobs"),
  },
];

function NavProgress() {
  const pathname = usePathname();
  const [prev, setPrev] = useState(pathname);
  const [active, setActive] = useState(false);

  if (prev !== pathname) {
    setPrev(pathname);
    setActive(true);
  }

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), 400);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;
  return (
    <LinearProgress
      aria-label="Navigating"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 1400,
        "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
      }}
    />
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleLogout = useCallback(() => {
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      } catch {
        toast.error("Logout failed. Please try again.");
      }
    });
  }, [router]);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "U";
  const userEmail = user?.email ?? "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Branding */}
      <Box
        sx={{
          px: 2.5,
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexShrink: 0,
        }}
      >
        <Image
          src="/logos/gemini_logo.png"
          alt="Qualifi"
          width={28}
          height={28}
          style={{ flexShrink: 0 }}
        />
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: "primary.main", letterSpacing: "-0.01em" }}
        >
          Qualifi
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, py: 2, overflow: "auto" }}>
        <Typography
          variant="caption"
          sx={{
            px: 2.5,
            mb: 0.5,
            display: "block",
            color: "text.disabled",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: 10,
          }}
        >
          Menu
        </Typography>
        <List disablePadding sx={{ px: 1.5 }}>
          {NAV_ITEMS.map(({ label, icon: Icon, href, match }) => {
            const active = match(pathname);
            return (
              <ListItem key={href} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  onClick={() => {
                    router.push(href);
                    onClose?.();
                  }}
                  selected={active}
                  sx={{
                    borderRadius: 1.5,
                    py: 0.875,
                    transition: "background-color 0.15s",
                    "&.Mui-selected": {
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                      "&:hover": {
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                      },
                    },
                    "&:hover:not(.Mui-selected)": {
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? "primary.main" : "text.secondary",
                      transition: "color 0.15s",
                    }}
                  >
                    <Icon size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        fontSize: 14,
                        fontWeight: active ? 600 : 400,
                        color: active ? "primary.main" : "text.primary",
                        sx: { transition: "color 0.15s" },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* User section */}
      <Box sx={{ p: 1.5 }}>
        {user && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 1,
                py: 0.75,
                mb: 0.5,
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "primary.main",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {userInitial}
              </Avatar>
              <Tooltip title={userEmail} placement="top">
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 12,
                    color: "text.secondary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userEmail}
                </Typography>
              </Tooltip>
            </Box>
            <ListItemButton
              onClick={handleLogout}
              disabled={isPending}
              sx={{
                borderRadius: 1.5,
                py: 0.75,
                color: "text.secondary",
                "&:hover": {
                  color: "error.main",
                  bgcolor: (t) => alpha(t.palette.error.main, 0.06),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                <LogOut size={16} />
              </ListItemIcon>
              <ListItemText
                primary={isPending ? "Logging out…" : "Logout"}
                slotProps={{ primary: { fontSize: 13 } }}
              />
            </ListItemButton>
          </>
        )}
      </Box>
    </Box>
  );
}

const drawerSx = {
  "& .MuiDrawer-paper": {
    width: DRAWER_WIDTH,
    boxSizing: "border-box",
    bgcolor: "background.paper",
    borderRight: "1px solid",
    borderColor: "divider",
  },
} as const;

function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <NavProgress />

      {/* Mobile top bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: "flex", md: "none" },
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            size="small"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ color: "text.primary" }}
            aria-label="Open navigation"
          >
            <MenuIcon size={20} />
          </IconButton>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ color: "primary.main", letterSpacing: "-0.01em" }}
            noWrap
          >
            Qualifi
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          ...drawerSx,
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </Drawer>

      {/* Desktop drawer (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          ...drawerSx,
        }}
        open
      >
        <SidebarContent />
      </Drawer>

      {/* Page content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: "background.default",
          pt: { xs: 8, md: 0 },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default memo(AppLayout);
