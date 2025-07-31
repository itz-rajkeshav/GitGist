"use client";

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white font-['Comic_Neue']">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <header className="flex justify-between items-center px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              GitGust
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-gray-300">
                {session.user?.name || session.user?.email}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 px-4 py-2 rounded-lg hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex flex-col items-center justify-center px-8 py-16 max-w-4xl mx-auto text-center">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 mb-8 max-w-2xl w-full">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome to your Dashboard!
            </h1>

            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <span className="text-purple-400 font-semibold">Name:</span>
                <span className="text-gray-300">
                  {session.user?.name || "Not provided"}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-purple-400 font-semibold">Email:</span>
                <span className="text-gray-300">
                  {session.user?.email || "Not provided"}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-purple-400 font-semibold">User ID:</span>
                <span className="text-gray-300 text-sm">
                  {session.user?.id || "Not available"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 text-center group hover:border-purple-400/50 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-purple-200">
                Repository Analysis
              </h3>
              <p className="text-gray-400 text-sm">
                Analyze GitHub repositories with AI-powered insights
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 text-center group hover:border-cyan-400/50 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-cyan-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-cyan-200">
                Q&A Assistant
              </h3>
              <p className="text-gray-400 text-sm">
                Ask questions about any repository and get instant answers
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push("/")}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              Back to Home
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
