"use client";

import Sidebar from "@/components/sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/auth/signin");
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Sidebar />
      <div className="md:ml-64 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-gray-400">Welcome to GitGist Dashboard</p>
        </div>
      </div>
    </div>
  );
}
