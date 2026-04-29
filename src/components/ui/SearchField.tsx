"use client";
import { InputAdornment, type TextFieldProps } from "@mui/material";
import { Search } from "lucide-react";
import AppTextField from "./AppTextField";

type SearchFieldProps = Omit<TextFieldProps, "variant">;

export default function SearchField({
  placeholder = "Search...",
  size = "small",
  ...props
}: SearchFieldProps) {
  return (
    <AppTextField
      placeholder={placeholder}
      size={size}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} color="#9e9892" />
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
}
