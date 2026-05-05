"use client";
import { useMemo, useTransition } from "react";
import { Box } from "@mui/material";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { LayoutDashboard, Users, Briefcase } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/Providers/AuthContext";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Navigation, Session } from "@toolpad/core/AppProvider";
import theme from "@/theme/theme";

const NAVIGATION: Navigation = [
  {
    segment: "dashboard",
    title: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  { segment: "candidates", title: "Candidates", icon: <Users size={18} /> },
  { segment: "jobs", title: "Job Library", icon: <Briefcase size={18} /> },
];

const BRANDING = {
  title: "Qualifi",
  logo: (
    <Image
      src="/logos/gemini_logo.png"
      alt="Qualifi"
      width={28}
      height={28}
      style={{ flexShrink: 0 }}
    />
  ),
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [, startTransition] = useTransition();

  const session: Session | null = useMemo(
    () =>
      user
        ? {
            user: {
              id: user.id,
              email: user.email ?? undefined,
              name: user.email ?? undefined,
            },
          }
        : null,
    [user],
  );

  const authentication = useMemo(
    () => ({
      signIn: () => router.push("/login"),
      signOut: () => {
        startTransition(async () => {
          try {
            const supabase = createSupabaseBrowserClient();
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
          } catch {
            toast.error("Logout failed. Please try again.");
          }
        });
      },
    }),
    [router],
  );

  return (
    <NextAppProvider
      theme={theme}
      navigation={NAVIGATION}
      branding={BRANDING}
      session={session}
      authentication={authentication}
    >
      <DashboardLayout
        sidebarExpandedWidth={220}
        sx={{
          "& main": { overflow: "hidden" },
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {children}
        </Box>
      </DashboardLayout>
    </NextAppProvider>
  );
}
