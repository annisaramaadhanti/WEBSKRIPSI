"use client";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex overflow-hidden h-screen w-screen bg-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <Navbar />
        <main className="flex-1 min-w-0 px-9 pt-8 pb-12 w-full">{children}</main>
      </div>
    </div>
  );
}
