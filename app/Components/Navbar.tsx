// components/Navbar.tsx
'use client';

import { FC, useState } from "react";
import { ShoppingCart, Building2, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Navbar: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isOrders = pathname === "/authenticated/orders";
  const isOrdersByCenter = pathname === "/authenticated/ordersby-center";

  const handleLogout = () => {
    localStorage.removeItem("token"); // or use cookies/session if applicable
    router.push("/auth/login");
  };

  const baseLinkClass =
    "flex items-center space-x-1 px-3 py-1 rounded-md text-sm";
  const activeClass =
    "border border-teal-100 bg-teal-50 text-teal-700";
  const inactiveClass = "text-gray-500";

  return (
    <nav className="shadow-sm bg-white w-full">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <div className="bg-teal-500 text-white rounded-lg p-2">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-teal-700 font-semibold text-lg">HOP SHOP</div>
            <div className="text-xs text-gray-500">Vendor Dashboard</div>
          </div>
        </div>

        {/* Hamburger Icon */}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/authenticated/orders"
            className={`${baseLinkClass} ${isOrders ? activeClass : inactiveClass}`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Orders</span>
          </Link>
          <Link
            href="/authenticated/ordersby-center"
            className={`${baseLinkClass} ${isOrdersByCenter ? activeClass : inactiveClass}`}
          >
            <Building2 className="w-4 h-4" />
            <span>Orders By Center</span>
          </Link>
        </div>

        {/* User Info - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-gray-500"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="w-full max-w-7xl mx-auto md:hidden px-4 pb-4 space-y-4">
          <div className="flex flex-col space-y-2">
            <Link
              href="/authenticated/orders"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                isOrders
                  ? "text-teal-700 border border-teal-100 bg-teal-50"
                  : "text-gray-600"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Orders</span>
            </Link>
            <Link
              href="/authenticated/ordersby-center"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                isOrdersByCenter
                  ? "text-teal-700 border border-teal-100 bg-teal-50"
                  : "text-gray-600"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Orders By Center</span>
            </Link>
          </div>
          <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
