"use client";
import {
  Dialog,
  type DialogProps,
  type SxProps,
  type Theme,
} from "@mui/material";

interface AppDialogProps extends Omit<DialogProps, "PaperProps"> {
  paperSx?: SxProps<Theme>;
}

export default function AppDialog({
  maxWidth = "sm",
  fullWidth = true,
  paperSx,
  ...props
}: AppDialogProps) {
  return (
    <Dialog
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          ...((paperSx ?? {}) as object),
        },
      }}
      {...props}
    />
  );
}
