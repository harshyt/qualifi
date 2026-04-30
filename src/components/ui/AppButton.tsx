"use client";
import { Button, type ButtonProps } from "@mui/material";

export type AppButtonProps = ButtonProps;

export default function AppButton({ sx, ...props }: AppButtonProps) {
  return <Button sx={{ fontWeight: 600, borderRadius: 2, ...sx }} {...props} />;
}
