import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const Heropage = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleExplore = async () => {
    const response = await fetch("http://localhost:3001/api/repo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ repoUrl }),
    });
    const data = await response.json();
    console.log(data);

    if (status === "authenticated") {
      router.push(`/dashboard`);
    } else {
      signIn();
    }
  };

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
                    .charAt(0)}
                </span>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        <main className="flex flex-col items-center justify-center px-8 py-16 max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-white">
            Simplify GitHub
            <br />
            <span className="text-blue-400">Repository Exploration</span>
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl leading-relaxed">
            Get the best details about any repo, just from its link.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mb-16">
            <input
              type="text"
              placeholder="Enter a GitHub repository URL"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExplore()}
              className="flex-1 px-6 py-4 bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-all duration-300 hover:border-purple-400/50"
            />
            <button
              onClick={handleExplore}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Explore
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 w-full max-w-4xl">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-purple-200">
                Easy to use
              </h3>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-cyan-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-cyan-200">
                In-depth summaries
              </h3>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-pink-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/25 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-pink-200">
                Quick insights
              </h3>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-xl">4</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-emerald-200">
                Q&A regarding the repository
              </h3>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-xl text-gray-300 leading-relaxed font-medium">
              New developers often struggle to quickly understand what a GitHub
              repository contains and its significance.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Heropage;
