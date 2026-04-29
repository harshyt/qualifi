"use client";
import { TextField, type TextFieldProps } from "@mui/material";
import { forwardRef } from "react";

export type AppTextFieldProps = Omit<TextFieldProps, "variant">;

const AppTextField = forwardRef<HTMLDivElement, AppTextFieldProps>(
  function AppTextField({ fullWidth = true, ...props }, ref) {
    return (
      <TextField
        ref={ref}
        variant="outlined"
        fullWidth={fullWidth}
        {...props}
      />
    );
  },
);

export default AppTextField;
