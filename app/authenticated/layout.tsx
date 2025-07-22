"use client";

import Navbar from "../Components/Navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
