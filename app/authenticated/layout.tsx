"use client";

import Sidebar from "../Components/SideBar";
import { useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Hamburger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded shadow"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <svg width="24" height="24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto px-2 sm:px-4 md:ml-64 py-4 transition-all">
        {children}
      </main>
    </div>
  );
};

export default Layout;