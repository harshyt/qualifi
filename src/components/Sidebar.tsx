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
} from "@mui/material";
import { Inbox, Briefcase, Settings, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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
      <Box sx={{ overflow: "auto" }}>
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
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <ListItemButton sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 40, color: "#78909C" }}>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: 14 }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}
