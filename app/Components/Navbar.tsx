// components/Navbar.tsx
'use client';

import { FC, useState, useEffect, useRef } from "react";
import { ShoppingCart, Building2, LogOut, Menu, Bell, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface Customer {
  _id: string;
  name: string;
  status: string;
  createdAt: string;
  service?: {
    name: string;
  };
  branchId?: {
    name: string;
  };
  centreId?: {
    name: string;
  };
}

interface NotificationResponse {
  message: string;
  customers: Customer[];
}

const Navbar: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Customer[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const router = useRouter();

  const isOrders = pathname === "/authenticated/orders";
  const isOrdersByCenter = pathname === "/authenticated/ordersby-center";

  // Fetch notifications for selected date
  const fetchNotifications = async (date: string = selectedDate) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customer/customers/offline-or-nocamera?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        setNotifications(data.customers);
        console.log(data.message);
        setNotificationCount(data.customers.length);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications when date changes
  useEffect(() => {
    fetchNotifications(selectedDate);
  }, [selectedDate]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchNotifications();
    
    // Optional: Set up interval to refresh notifications periodically
    const interval = setInterval(() => fetchNotifications(), 300000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
  };

  const handleQuickDateSelect = (dateType: 'today' | 'yesterday') => {
    const date = new Date();
    if (dateType === 'yesterday') {
      date.setDate(date.getDate() - 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const baseLinkClass =
    "flex items-center space-x-1 px-3 py-1 rounded-md text-sm";
  const activeClass =
    "border border-teal-100 bg-teal-50 text-teal-700";
  const inactiveClass = "text-gray-500";

  return (
    <nav className="shadow-sm bg-white w-full relative">
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
          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              className="relative flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-hidden">
                {/* Header with Date Filter */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Offline/No Camera Customers
                    </h3>
                    <button
                      onClick={() => fetchNotifications()}
                      className="text-xs text-teal-600 hover:text-teal-700"
                      disabled={loading}
                    >
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  
                  {/* Date Filter Section */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <label className="text-xs font-medium text-gray-700">Filter by Date:</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleQuickDateSelect('today')}
                          className="px-2 py-1 text-xs bg-teal-50 text-teal-700 rounded hover:bg-teal-100 transition-colors"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('yesterday')}
                          className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                        >
                          Yesterday
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Showing alerts for {formatSelectedDate(selectedDate)} ({notificationCount})
                    </p>
                  </div>
                </div>
                
                {/* Notifications List */}
                <div className="max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-3 text-center text-sm text-gray-500">
                      No offline/no camera customers for {formatSelectedDate(selectedDate)}
                    </div>
                  ) : (
                    notifications.map((customer) => (
                      <div key={customer._id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </p>
                            <div className="mt-1 space-y-1">
                              <p className="text-xs text-gray-600">
                                Status: <span className="font-medium text-red-600">{customer.status}</span>
                              </p>
                              {customer.service && (
                                <p className="text-xs text-gray-600">
                                  Service: {customer.service.name}
                                </p>
                              )}
                              {customer.centreId && (
                                <p className="text-xs text-gray-600">
                                  Centre: {customer.centreId.name}
                                </p>
                              )}
                              {customer.branchId && (
                                <p className="text-xs text-gray-600">
                                  Branch: {customer.branchId.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatTime(customer.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <button className="text-xs text-teal-600 hover:text-teal-700 w-full text-center">
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
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
            {/* Mobile Notifications */}
            <button
              onClick={handleNotificationClick}
              className="relative flex items-center space-x-2 text-gray-500"
            >
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
              {notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
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
