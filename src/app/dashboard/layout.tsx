import { Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";

export default function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AppLayout>{children}</AppLayout>
    </Suspense>
  );
}
