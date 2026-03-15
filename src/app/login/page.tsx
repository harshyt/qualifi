"use client";
import React, { useState, useTransition } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { loginAction } from "@/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = () => {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(email, password);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F9FAFB",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", p: 2 }}>
        <CardContent>
          <Typography
            variant="h5"
            component="div"
            sx={{
              mb: 1,
              fontWeight: 700,
              color: "#2196F3",
              textAlign: "center",
            }}
          >
            Qualiphy
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, textAlign: "center" }}
          >
            Sign in to access your dashboard
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={isPending}
            sx={{ mt: 3 }}
          >
            {isPending ? "Signing in…" : "Sign In"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
