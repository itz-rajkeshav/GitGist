import Sidebar from "@/components/sidebar";
import React from "react";

const AI = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Sidebar />
      <div className="md:ml-64 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">AI Q&A</h1>
          <p className="text-gray-400">Ask questions about your repository</p>
        </div>
      </div>
    </div>
  );
};

export default AI;
