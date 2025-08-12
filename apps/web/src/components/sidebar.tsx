"use client";
import React, { useState, useEffect } from "react";
import {
  Folder,
  Cpu,
  MessageCircle,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const Sidebar = () => {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const user = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "guest@example.com",
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const getUserInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Folder, label: "Folder Structure", href: "/folderStr" },
    { icon: Cpu, label: "Tech Stack", href: "/techStack" },
    { icon: MessageCircle, label: "AI Q&A", href: "/ai" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <>
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg border border-slate-600"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}

      <div
        className={`
        w-64 h-screen bg-slate-800 text-white flex font-sans flex-col border-r border-slate-600 shadow-2xl
        ${isMobile ? "fixed z-50" : "absolute"}
        ${isMobile && !isMobileMenuOpen ? "-translate-x-full" : "translate-x-0"}
        transition-transform duration-300 ease-in-out
      `}
      >
        <header className="flex items-center px-6 py-6 border-b border-slate-600">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-xl font-semibold text-white">GitGist</span>
          </div>
        </header>

        <nav className="flex-1 px-4 py-6 ">
          <ul className="space-y-2 ">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.href}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-all duration-200 group w-full h-12"
                >
                  <item.icon className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
                  <span className=" font-medium">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-4 py-4 border-t border-slate-600">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all duration-200 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {getUserInitial(user.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <button className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:text-red-400 hover:bg-slate-700 transition-all duration-200 w-full h-12">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium" onClick={() => signOut()}>
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
