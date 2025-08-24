"use client";
import Sidebar from "@/components/sidebar";
import React, { useState } from "react";

const AI = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex">
      {/* Mobile hamburger menu button */}
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-y-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main
        className={`flex-1 overflow-y-auto h-screen transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "ml-0 md:ml-64"
        }`}
      >
        <div className="p-4 md:p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">AI Q&A</h1>
            <p className="text-gray-400">Ask questions about your repository</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AI;
