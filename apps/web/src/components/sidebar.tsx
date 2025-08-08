import React from "react";
import { Folder, Cpu, MessageCircle, Settings, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

const Sidebar = () => {
  const { data: session } = useSession();
  const user = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "guest@example.com",
  };

  const getUserInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const menuItems = [
    { icon: Folder, label: "Folder Structure", href: "#" },
    { icon: Cpu, label: "Tech Stack", href: "#" },
    { icon: MessageCircle, label: "AI Q&A", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <div className="w-64 h-screen bg-slate-800 text-white flex font-sans flex-col absolute border-r border-slate-600 shadow-2xl">
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
  );
};

export default Sidebar;
