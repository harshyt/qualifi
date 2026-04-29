import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import QueryProvider from "@/components/Providers/QueryProvider";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qualifi - AI Resume Screening Tool",
  description: "AI-powered resume screening tool",
  icons: {
    icon: [],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className={dmSans.className}>
        <SpeedInsights />
        <Analytics />
        <QueryProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
          <Toaster position="top-center" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
