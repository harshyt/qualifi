"use client";
import {
  Dialog,
  type DialogProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { lightTokens } from "@/theme/tokens";

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
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${lightTokens.borderSubtle}`,
          ...((paperSx ?? {}) as object),
        },
      }}
      {...props}
    />
  );
}
