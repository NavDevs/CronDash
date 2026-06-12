import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ToastContainer } from "@/components/Toast";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CronDash - Visual Cron Job Manager",
  description: "Manage your cron jobs with a terminal-style interface",
  icons: {
    icon: "/favicon.png?v=3",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
        <body suppressHydrationWarning className="min-h-full flex flex-col">
          {children}
          <ToastContainer />
          <div className="crt-overlay" />
        </body>
      </html>
    </ClerkProvider>
  );
}
