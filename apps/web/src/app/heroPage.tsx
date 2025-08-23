"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const Heropage = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Ensure component is mounted before using session
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExplore = async () => {
    try {
      if (status === "authenticated") {
        // For now, just redirect to dashboard without complex analysis
        router.push(`/dashboard?repo=${encodeURIComponent(repoUrl)}`);
      } else {
        signIn();
      }
    } catch (error) {
      console.error("Error handling explore:", error);
    }
  };

  // Don't render until mounted to avoid SSR issues
  if (!mounted) {
    return (
      <div className="bg-gray-900 min-h-screen w-full text-white font-['Comic_Neue'] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen w-full text-white font-['Comic_Neue'] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <header className="flex justify-between items-center px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              GitGist
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            ) : session ? (
              <div className="w-14 h-14 bg-gradient-to-r from-pink-600 to-pink-800 rounded-full flex items-center justify-center mx-auto  shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform duration-300">
                <span className="text-gray-300 text-xl font-semibold">
                  {(session.user?.name || session.user?.email)
                    ?.trim()
                    .charAt(0)
                    .toUpperCase() || "U"}
                </span>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Discover the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Hidden Gems
              </span>
              <br />
              in Your Code
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Unlock the secrets of your repositories with our advanced AST
              analysis.
              <br />
              Understand code structure, dependencies, and patterns like never
              before.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Enter GitHub repository URL..."
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  onKeyPress={(e) => e.key === "Enter" && handleExplore()}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-xl -z-10"></div>
              </div>

              <button
                onClick={handleExplore}
                disabled={!repoUrl.trim()}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
              >
                Explore Repository
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
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
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  AST Analysis
                </h3>
                <p className="text-gray-400">
                  Deep dive into your code structure with Abstract Syntax Tree
                  analysis
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Folder Structure
                </h3>
                <p className="text-gray-400">
                  Visualize and understand your project's organization
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Tech Stack
                </h3>
                <p className="text-gray-400">
                  Discover technologies and dependencies in your codebase
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Trusted by developers worldwide
              </p>
              <div className="flex justify-center items-center space-x-8 opacity-50">
                <div className="text-2xl font-bold text-gray-300">GitHub</div>
                <div className="text-2xl font-bold text-gray-300">React</div>
                <div className="text-2xl font-bold text-gray-300">Node.js</div>
                <div className="text-2xl font-bold text-gray-300">
                  TypeScript
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Heropage;
