"use client";
import * as React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Tooltip,
} from "@mui/material";
import Image from "next/image";
import { Inbox, Briefcase, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/Providers/AuthContext";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useTransition, useCallback, memo } from "react";

const drawerWidth = 240;

const menuItems = [
  { text: "Dashboard", icon: <Inbox size={20} />, path: "/dashboard" },
  {
    text: "Job Library",
    icon: <Briefcase size={20} />,
    path: "/jobs",
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleLogout = useCallback(() => {
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      } catch (error) {
        console.error("Logout failed:", error);
        toast.error("Logout failed. Please try again.");
      }
    });
  }, [router]);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "U";
  const userEmail = user?.email ?? "";

  const drawerContent = (
    <>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Image
            src="/logos/gemini_logo.png"
            alt="Qualifi Logo"
            width={32}
            height={32}
            style={{ flexShrink: 0 }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: "bolder",
              color: "primary.main",
            }}
          >
            Qualifi
          </Typography>
        </Box>
      </Box>
      <Box sx={{ overflow: "auto", flexGrow: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => {
                  router.push(item.path);
                  onClose(); // Close drawer on mobile after navigation
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.50",
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: "primary.100",
                    },
                    "& .lucide": {
                      color: "primary.main",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color:
                      pathname === item.path
                        ? "primary.main"
                        : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: pathname === item.path ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User info + Logout */}
      <Box sx={{ p: 2, borderTop: "1px solid #E0E0E0" }}>
        {user && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1.5,
                px: 1,
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "primary.main",
                  fontSize: 14,
                }}
              >
                {userInitial}
              </Avatar>
              <Tooltip title={userEmail}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 12,
                    color: "text.secondary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                  }}
                >
                  {userEmail}
                </Typography>
              </Tooltip>
            </Box>
            <ListItemButton
              onClick={handleLogout}
              disabled={isPending}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText
                primary={isPending ? "Logging out…" : "Logout"}
                primaryTypographyProps={{ fontSize: 14 }}
              />
            </ListItemButton>
          </>
        )}
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid #E0E0E0",
            backgroundColor: "background.default",
          },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid #E0E0E0",
            backgroundColor: "background.default",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export default memo(Sidebar);
