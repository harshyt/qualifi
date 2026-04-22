"use client";
import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { DotPattern } from "@/components/ui/dot-pattern";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = () => {
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (error) {
        console.error("Login failed unexpectedly:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during login.",
        );
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      <DotPattern className="[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]" />
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          p: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mb: 2,
            }}
          >
            <Image
              src="/logos/gemini_logo.png"
              alt="Gemini Logo"
              width={32}
              height={32}
              priority
            />
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                color: "primary.main",
              }}
            >
              Qualifi
            </Typography>
          </Box>
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
