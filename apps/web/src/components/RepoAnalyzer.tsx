"use client";

import { useState } from "react";

interface RepoData {
  name: string;
  description: string;
  language: Record<string, number>;
  commits: any[];
  contributors: any[];
  content: any[];
  stars: number;
  forks: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export default function RepoAnalyzer() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeRepo = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    setLoading(true);
    setError("");
    setRepoData(null);

    try {
      const response = await fetch("http://localhost:3001/api/repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze repository");
      }

      const data = await response.json();

      // Log the data in a readable format for debugging
      console.log("✅ Repository data received:");
      console.log("📊 Basic Info:", {
        name: data.name,
        description: data.description,
        stars: data.stars,
        forks: data.forks,
        url: data.url,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      console.log("💻 Languages:", data.language);
      console.log("📝 Commits count:", data.commits?.length || 0);
      console.log("👥 Contributors count:", data.contributors?.length || 0);
      console.log("📁 Content items:", data.content?.length || 0);
      console.log("🔍 Full data object:", data);

      setRepoData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">GitHub Repository Analyzer</h1>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Enter GitHub repository URL (e.g., https://github.com/vercel/next.js)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && analyzeRepo()}
          />
          <button
            onClick={analyzeRepo}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {error && (
          <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      {repoData && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">{repoData.name}</h2>
            <p className="text-gray-600 mb-4">{repoData.description}</p>
            <div className="flex gap-4 text-sm">
              <span className="bg-yellow-100 px-2 py-1 rounded">
                ⭐ {repoData.stars.toLocaleString()} stars
              </span>
              <span className="bg-blue-100 px-2 py-1 rounded">
                🍴 {repoData.forks.toLocaleString()} forks
              </span>
              <span className="bg-green-100 px-2 py-1 rounded">
                📅 Created: {new Date(repoData.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Languages</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(repoData.language).map(([lang, bytes]) => (
                <div key={lang} className="bg-gray-100 px-3 py-2 rounded">
                  <div className="font-medium">{lang}</div>
                  <div className="text-sm text-gray-600">
                    {(bytes / 1000).toFixed(1)}KB
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Commits */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">
              Recent Commits ({repoData.commits.length})
            </h3>
            <div className="space-y-3">
              {repoData.commits.slice(0, 5).map((commit) => (
                <div
                  key={commit.sha}
                  className="border-l-4 border-blue-500 pl-4"
                >
                  <div className="font-medium">
                    {commit.commit.message.split("\n")[0]}
                  </div>
                  <div className="text-sm text-gray-600">
                    by {commit.commit.author.name} •{" "}
                    {new Date(commit.commit.author.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contributors */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">
              Top Contributors ({repoData.contributors.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repoData.contributors.slice(0, 6).map((contributor) => (
                <div
                  key={contributor.login}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded"
                >
                  <img
                    src={contributor.avatar_url}
                    alt={contributor.login}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{contributor.login}</div>
                    <div className="text-sm text-gray-600">
                      {contributor.contributions} contributions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw JSON Data */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Raw JSON Data</h3>
            <details className="cursor-pointer">
              <summary className="text-blue-600 hover:text-blue-800 mb-2">
                Click to view raw JSON response
              </summary>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(repoData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
