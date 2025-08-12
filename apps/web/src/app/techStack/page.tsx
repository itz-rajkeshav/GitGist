import Sidebar from "@/components/sidebar";
import TechStackGraph from "@/components/TechStackGraph";
import React from "react";

const TechStack = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Sidebar />
      <div className="md:ml-64">
        <TechStackGraph />
      </div>
    </div>
  );
};

export default TechStack;
