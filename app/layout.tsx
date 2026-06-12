import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { RoleProvider } from "@/components/providers/RoleProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIMPROTIK",
  description: "Sistem Informasi Manajemen Proyek UPA TIK",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body className={plusJakarta.variable}>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}