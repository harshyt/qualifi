import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import QueryProvider from "@/components/Providers/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Resume Screener",
  description: "AI-powered resume screening tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
