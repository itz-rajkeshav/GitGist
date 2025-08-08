"use client";

import Sidebar from "@/components/sidebar";
import { useSession, signOut } from "next-auth/react";
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

      {/* Main Content Area */}
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-300">
              Welcome back, {session?.user?.name || "User"}
            </p>
          </header>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6 hover:bg-slate-750 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-white mb-2">
                Repository Analysis
              </h3>
              <p className="text-slate-300">
                Analyze GitHub repositories with AI-powered insights.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6 hover:bg-slate-750 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-white mb-2">
                Tech Stack Detection
              </h3>
              <p className="text-slate-300">
                Automatically detect technologies used in projects.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 p-6 hover:bg-slate-750 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-white mb-2">AI Q&A</h3>
              <p className="text-slate-300">
                Ask questions about your repositories and get instant answers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
