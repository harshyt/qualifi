"use client";
import {
  Drawer,
  type DrawerProps,
  type SxProps,
  type Theme,
} from "@mui/material";

interface AppDrawerProps extends Omit<DrawerProps, "anchor"> {
  paperSx?: SxProps<Theme>;
}

export default function AppDrawer({ paperSx, ...props }: AppDrawerProps) {
  return (
    <Drawer
      anchor="right"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 520 },
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          ...((paperSx ?? {}) as object),
        },
      }}
      {...props}
    />
  );
}
