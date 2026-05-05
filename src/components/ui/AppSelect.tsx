"use client";
import {
  FormControl,
  InputLabel,
  Select,
  type SelectProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useId } from "react";

export interface AppSelectProps extends Omit<SelectProps, "labelId" | "id"> {
  label: string;
  formControlSx?: SxProps<Theme>;
}

export default function AppSelect({
  label,
  children,
  fullWidth = true,
  size,
  formControlSx,
  ...props
}: AppSelectProps) {
  const id = useId();
  const labelId = `${id}-label`;

  return (
    <FormControl fullWidth={fullWidth} size={size} sx={formControlSx}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        id={id}
        label={label}
        size={size}
        MenuProps={{ sx: { zIndex: (theme) => theme.zIndex.modal + 2 } }}
        {...props}
      >
        {children}
      </Select>
    </FormControl>
  );
}
