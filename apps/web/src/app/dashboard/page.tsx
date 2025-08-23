"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Define TypeScript interfaces for the AST data structure
interface ImportItem {
  source: string;
  imports: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

interface FunctionItem {
  name: string;
  params: string[];
  calls: string[];
  isAsync: boolean;
  isExported: boolean;
}

interface ExportItem {
  name: string;
  type: string;
  isDefault?: boolean;
}

interface ASTSummary {
  functions: FunctionItem[];
  imports: ImportItem[];
  exports: ExportItem[];
  classes: string[];
  variables: string[];
}

interface FileAnalysis {
  file: string;
  ast_summary: ASTSummary;
}

interface ASTData {
  repository: string;
  totalFiles: number;
  processedFiles: number;
  analyses: FileAnalysis[];
  summary: {
    totalFiles: number;
    totalFunctions: number;
    totalImports: number;
    totalExports: number;
    totalClasses: number;
    totalVariables: number;
    filesByExtension: Record<string, number>;
    mostUsedImports: Record<string, number>;
    functionsByFile: Record<string, number>;
    files: {
      file: string;
      functions: number;
      imports: number;
      exports: number;
      classes: number;
      variables: number;
    }[];
  };
  storagePath: string;
  errors: string[];
  duration: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [astData, setAstData] = useState<ASTData | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "functions" | "imports" | "exports" | "variables"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/auth/signin");
  }, [session, status, router]);

  useEffect(() => {
    // Retrieve data from localStorage
    const storedData = localStorage.getItem("astAnalysisResult");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as ASTData;
        setAstData(parsedData);
        if (parsedData.analyses.length > 0) {
          setSelectedFile(parsedData.analyses[0].file);
        }
      } catch (error) {
        console.error("Error parsing AST data:", error);
      }
    }
  }, []);

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

  if (!astData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-blue-400 text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-2">No AST Data Available</h2>
            <p className="text-slate-400">
              Please analyze a repository first to view the AST dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Helper functions
  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop() || "";
  };

  const getSelectedFileAnalysis = () => {
    return astData.analyses.find((analysis) => analysis.file === selectedFile);
  };

  const filteredFiles = astData.analyses.filter((analysis) =>
    analysis.file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAnalysis = getSelectedFileAnalysis();

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600"
        onClick={() => setSidebarOpen(true)}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <Sidebar />
      </div>

      <main
        className={`flex-1 overflow-y-auto h-screen transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "ml-0 md:ml-64"
        }`}
      >
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            <div className="xl:col-span-1 bg-slate-800 rounded-xl p-4 order-2 xl:order-1">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-3 text-blue-300">
                  Files Analyzed
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search files..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg
                    className="absolute right-3 top-2.5 h-5 w-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-320px)]">
                {filteredFiles.map((analysis, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                      selectedFile === analysis.file
                        ? "bg-blue-900/30 border-l-4 border-blue-400"
                        : "bg-slate-700 hover:bg-slate-600"
                    }`}
                    onClick={() => {
                      setSelectedFile(analysis.file);
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-mono truncate flex-1">
                        {analysis.file}
                      </p>
                      <span className="bg-slate-600 text-xs px-2 py-1 rounded-full ml-2">
                        {getFileExtension(analysis.file)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-400">
                      <span className="bg-slate-800 px-2 py-0.5 rounded">
                        {analysis.ast_summary.functions.length} func
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded">
                        {analysis.ast_summary.imports.length} imp
                      </span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded">
                        {analysis.ast_summary.variables.length} var
                      </span>
                    </div>
                  </div>
                ))}

                {filteredFiles.length === 0 && (
                  <div className="text-center py-4 text-slate-400">
                    No files match your search
                  </div>
                )}
              </div>
            </div>

            {/* File Details Panel */}
            <div className="xl:col-span-2 bg-slate-800 rounded-xl p-4 order-1 xl:order-2">
              {selectedAnalysis ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                      <h2 className="text-xl w-48 lg:w-full font-semibold text-blue-300 break-words">
                        {selectedAnalysis.file}
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Last analyzed: {new Date().toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 bg-slate-700 p-1 rounded-lg overflow-y-auto">
                      {(
                        [
                          "overview",
                          "functions",
                          "imports",
                          "exports",
                          "variables",
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab}
                          className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                            activeTab === tab
                              ? "bg-blue-500 text-white"
                              : "text-slate-300 hover:text-white"
                          }`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {selectedAnalysis.ast_summary.functions.length}
                          </div>
                          <div className="text-sm text-slate-300 mt-1">
                            Functions
                          </div>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {selectedAnalysis.ast_summary.imports.length}
                          </div>
                          <div className="text-sm text-slate-300 mt-1">
                            Imports
                          </div>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {selectedAnalysis.ast_summary.exports.length}
                          </div>
                          <div className="text-sm text-slate-300 mt-1">
                            Exports
                          </div>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {selectedAnalysis.ast_summary.variables.length}
                          </div>
                          <div className="text-sm text-slate-300 mt-1">
                            Variables
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-700 rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-3 text-blue-300">
                          Quick Stats
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-300">
                              Async Functions:
                            </span>
                            <span className="font-medium">
                              {
                                selectedAnalysis.ast_summary.functions.filter(
                                  (f) => f.isAsync
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">
                              Exported Functions:
                            </span>
                            <span className="font-medium">
                              {
                                selectedAnalysis.ast_summary.functions.filter(
                                  (f) => f.isExported
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">
                              Default Imports:
                            </span>
                            <span className="font-medium">
                              {
                                selectedAnalysis.ast_summary.imports.filter(
                                  (i) => i.isDefault
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-300">
                              Namespace Imports:
                            </span>
                            <span className="font-medium">
                              {
                                selectedAnalysis.ast_summary.imports.filter(
                                  (i) => i.isNamespace
                                ).length
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Functions Tab */}
                  {activeTab === "functions" && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-300">
                        Functions
                      </h3>
                      {selectedAnalysis.ast_summary.functions.length > 0 ? (
                        <div className="space-y-4">
                          {selectedAnalysis.ast_summary.functions.map(
                            (func, index) => (
                              <div
                                key={index}
                                className="bg-slate-700 p-4 rounded-lg"
                              >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                  <div className="flex-1">
                                    <h4 className="font-mono text-green-300 text-lg break-words">
                                      {func.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center mt-1 gap-2">
                                      {func.isAsync && (
                                        <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                                          Async
                                        </span>
                                      )}
                                      {func.isExported && (
                                        <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full">
                                          Exported
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-300 mt-2">
                                      Parameters:{" "}
                                      {func.params.length > 0
                                        ? func.params.join(", ")
                                        : "None"}
                                    </p>
                                  </div>
                                  <span className="bg-slate-600 text-xs px-2 py-1 rounded-full self-start sm:self-auto">
                                    {func.calls.length} calls
                                  </span>
                                </div>

                                {func.calls.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm text-slate-400 mb-2">
                                      Function calls:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {func.calls.map((call, callIndex) => (
                                        <span
                                          key={callIndex}
                                          className="bg-slate-600 text-xs px-2 py-1 rounded"
                                        >
                                          {call}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-700 rounded-lg">
                          <div className="text-5xl mb-4">🔍</div>
                          <p className="text-slate-400">
                            No functions found in this file.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Imports Tab */}
                  {activeTab === "imports" && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-300">
                        Imports
                      </h3>
                      {selectedAnalysis.ast_summary.imports.length > 0 ? (
                        <div className="space-y-4">
                          {selectedAnalysis.ast_summary.imports.map(
                            (importItem, index) => (
                              <div
                                key={index}
                                className="bg-slate-700 p-4 rounded-lg"
                              >
                                <h4 className="font-mono text-yellow-300 text-lg break-words">
                                  {importItem.source}
                                </h4>
                                <div className="flex flex-wrap items-center mt-1 gap-2">
                                  {importItem.isDefault && (
                                    <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                                      Default Import
                                    </span>
                                  )}
                                  {importItem.isNamespace && (
                                    <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full">
                                      Namespace Import
                                    </span>
                                  )}
                                </div>

                                {importItem.imports.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-sm text-slate-400 mb-2">
                                      Imported items:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {importItem.imports.map(
                                        (item, itemIndex) => (
                                          <span
                                            key={itemIndex}
                                            className="bg-slate-600 text-xs px-2 py-1 rounded"
                                          >
                                            {item}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-700 rounded-lg">
                          <div className="text-5xl mb-4">📦</div>
                          <p className="text-slate-400">
                            No imports found in this file.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exports Tab */}
                  {activeTab === "exports" && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-300">
                        Exports
                      </h3>
                      {selectedAnalysis.ast_summary.exports.length > 0 ? (
                        <div className="space-y-3">
                          {selectedAnalysis.ast_summary.exports.map(
                            (exportItem, index) => (
                              <div
                                key={index}
                                className="bg-slate-700 p-4 rounded-lg"
                              >
                                <h4 className="font-mono text-purple-300 text-lg break-words">
                                  {exportItem.name}
                                </h4>
                                <p className="text-sm text-slate-300 mt-1">
                                  Type:{" "}
                                  <span className="font-medium">
                                    {exportItem.type}
                                  </span>
                                </p>
                                {exportItem.isDefault && (
                                  <span className="inline-block mt-2 bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
                                    Default Export
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-700 rounded-lg">
                          <div className="text-5xl mb-4">📤</div>
                          <p className="text-slate-400">
                            No exports found in this file.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Variables Tab */}
                  {activeTab === "variables" && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-300">
                        Variables
                      </h3>
                      {selectedAnalysis.ast_summary.variables.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedAnalysis.ast_summary.variables.map(
                            (variable, index) => (
                              <div
                                key={index}
                                className="bg-slate-700 p-3 rounded-lg"
                              >
                                <span className="font-mono text-blue-300 break-words">
                                  {variable}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-slate-700 rounded-lg">
                          <div className="text-5xl mb-4">📝</div>
                          <p className="text-slate-400">
                            No variables found in this file.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-blue-400 text-5xl mb-4">📊</div>
                  <h2 className="text-xl font-semibold mb-2">
                    AST Analysis Dashboard
                  </h2>
                  <p className="text-slate-400">
                    Select a file from the list to view its AST analysis
                    details.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Repository Summary Section */}
          <div className="mt-8 bg-slate-800 rounded-xl p-4 md:p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-300">
              Repository Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">
                  {astData.summary.totalFunctions}
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  Total Functions
                </div>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {astData.summary.totalImports}
                </div>
                <div className="text-sm text-slate-300 mt-1">Total Imports</div>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {astData.summary.totalExports}
                </div>
                <div className="text-sm text-slate-300 mt-1">Total Exports</div>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {astData.summary.totalVariables}
                </div>
                <div className="text-sm text-slate-300 mt-1">
                  Total Variables
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3 text-blue-300">
                  Files by Extension
                </h3>
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(astData.summary.filesByExtension).map(
                      ([ext, count]) => (
                        <div
                          key={ext}
                          className="bg-slate-600 px-3 py-2 rounded-lg flex items-center"
                        >
                          <span className="text-blue-300 font-medium">
                            .{ext}
                          </span>
                          <span className="ml-2 bg-slate-500 text-xs px-2 py-1 rounded-full">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 text-blue-300">
                  Most Used Imports
                </h3>
                <div className="bg-slate-700 rounded-lg p-4 overflow-x-auto">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(astData.summary.mostUsedImports)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([importName, count]) => (
                        <div
                          key={importName}
                          className="bg-slate-600 px-3 py-2 rounded-lg flex items-center"
                        >
                          <span className="text-yellow-300 font-mono text-sm break-words">
                            {importName}
                          </span>
                          <span className="ml-2 bg-slate-500 text-xs px-2 py-1 rounded-full">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
