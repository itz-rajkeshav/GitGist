import Sidebar from "@/components/sidebar";
import FolderStructureGraph from "@/components/FolderStructureGraph";
import React from "react";

const FolderStructure = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <Sidebar />
      <div className="md:ml-64">
        <FolderStructureGraph />
      </div>
    </div>
  );
};

export default FolderStructure;
