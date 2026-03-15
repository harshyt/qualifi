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
import { Inbox, Briefcase, Settings, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers/AuthContext";
import { logoutAction } from "@/actions/auth";
import { useTransition } from "react";

const drawerWidth = 240;

const menuItems = [
  { text: "Inbox", icon: <Inbox size={20} />, path: "/dashboard" },
  {
    text: "Job Library",
    icon: <Briefcase size={20} />,
    path: "/dashboard/jobs",
  },
  {
    text: "Settings",
    icon: <Settings size={20} />,
    path: "/dashboard/settings",
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "U";
  const userEmail = user?.email ?? "";

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid #E0E0E0",
          backgroundColor: "#F9FAFB",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: 700, color: "#2196F3" }}
        >
          Screener.ai
        </Typography>
      </Box>
      <Box sx={{ overflow: "auto", flexGrow: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={pathname === item.path}
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "#E3F2FD",
                    color: "#2196F3",
                    "&:hover": {
                      backgroundColor: "#BBDEFB",
                    },
                    "& .lucide": {
                      color: "#2196F3",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "#F5F5F5",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: pathname === item.path ? "#2196F3" : "#78909C",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, px: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "#2196F3", fontSize: 14 }}>
              {userInitial}
            </Avatar>
            <Tooltip title={userEmail}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: 12,
                  color: "#546E7A",
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
        )}
        <ListItemButton
          onClick={handleLogout}
          disabled={isPending}
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: "#78909C" }}>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText
            primary={isPending ? "Logging out…" : "Logout"}
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
