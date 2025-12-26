'use client';

import { FC, useState, useEffect, useRef } from "react";
import { ShoppingCart, Building2, LogOut, Bell, Calendar,Upload,CheckCircle, BarChart3, Package,} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

interface SidebarProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

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

interface VendorData {
  _id: string;
  name: string;
  userId: string;
  status: string;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Customer[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
   const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  const notificationRef = useRef<HTMLDivElement>(null);

  const [acceptedCount, setAcceptedCount] = useState(0);
  const [acceptedLoading, setAcceptedLoading] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const isOrders = pathname === "/authenticated/orders";
  const isOrdersByCenter = pathname === "/authenticated/ordersby-center";
  const isAcceptedOrders = pathname === "/authenticated/accepted-order";
  const isAnalysis = pathname === "/authenticated/Analysis" || pathname === "/authenticated/analysis";
  const isInventory = pathname === "/authenticated/inventory";

    const fetchVendorData = () => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setVendor(userData);
      } catch (error) {
        console.error('Error parsing vendor data:', error);
      }
    }
  };
    useEffect(() => {
    fetchVendorData();
  }, []);
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

  const safeParse = (str: string | null) => {
    try {
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  };

const fetchAcceptedCount = async () => {
  try {
    setAcceptedLoading(true);
    const token = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');
    
    if (!userDataString) {
      console.error('User data not found');
      return;
    }

    const userData = JSON.parse(userDataString);
    const vendorId = userData._id; // Using _id from the stored userData

    if (!vendorId) {
      console.error('Vendor ID not found in user data');
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/orders/accepted/${vendorId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      setAcceptedCount(data.count ?? 0);
    }
  } catch (err) {
    console.error('Error fetching accepted count:', err);
  } finally {
    setAcceptedLoading(false);
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
    fetchAcceptedCount();
    
    const interval = setInterval(() => fetchNotifications(), 300000); // Refresh every 5 minutes
    const acceptedInterval = setInterval(() => fetchAcceptedCount(), 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(acceptedInterval);
    };
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

  const baseLinkClass = "flex items-center space-x-3 px-4 py-2 rounded-lg text-sm w-full";
  const activeClass = "bg-teal-50 text-teal-700";
  const inactiveClass = "text-gray-600 hover:bg-gray-100";

  // Sidebar content for reuse
  const sidebarContent = (
    <>
      {/* Logo and Brand */}
      <div className="flex items-center space-x-2 p-4 border-b border-gray-100">
        <div className="bg-teal-500 text-white rounded-lg p-2">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <div>
          <div className="text-teal-700 font-semibold text-lg">HOP SHOP</div>
          <div className="text-xs text-gray-500">
            {vendor?.name || 'Vendor Dashboard'}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col p-4 space-y-2">
        <Link
          href="/authenticated/orders"
          className={`${baseLinkClass} ${isOrders ? activeClass : inactiveClass}`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Orders</span>
        </Link>
        <Link
          href="/authenticated/ordersby-center"
          className={`${baseLinkClass} ${isOrdersByCenter ? activeClass : inactiveClass}`}
        >
          <Building2 className="w-5 h-5" />
          <span>Orders By Center</span>
        </Link>

<Link
          href="/authenticated/accepted-order"
          className={`${baseLinkClass} ${isAcceptedOrders ? activeClass : inactiveClass} relative`}
        >
          <CheckCircle className="w-5 h-5" />
          <span>{vendor?.name}</span>

          {/* Badge */}
          {acceptedCount > 0 && (
            <span className="absolute right-4 bg-green-600 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {acceptedCount > 99 ? '99+' : acceptedCount}
            </span>
          )}
        </Link>

        <Link
  href="/authenticated/add-product-form"
  className={`${baseLinkClass} ${pathname === "/authenticated/add-product-form" ? activeClass : inactiveClass}`}
>
  <Upload className="w-5 h-5" />
  <span>Add Product</span>
</Link>

        <Link
          href="/authenticated/inventory"
          className={`${baseLinkClass} ${isInventory ? activeClass : inactiveClass}`}
        >
          <Package className="w-5 h-5" />
          <span>Inventory</span>
        </Link>

        {/* Analysis */}
        <Link
          href="/authenticated/Analysis"
          className={`${baseLinkClass} ${isAnalysis ? activeClass : inactiveClass}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Analysis</span>
        </Link>

        {/* Notification Section */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={handleNotificationClick}
            className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-sm w-full relative ${
              notificationOpen ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
            {notificationCount > 0 && (
              <span className="absolute right-4 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationOpen && (
            <div className="absolute left-0 top-full mt-2 w-full max-w-xs md:max-w-md bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-auto">
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
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <label className="text-xs font-medium text-gray-700">Filter by Date:</label>
                  </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 mb-2"
                    />
                    <div className="flex space-x-">
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
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-2 rounded-lg text-sm w-full text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="bg-white w-64 h-screen fixed shadow-md flex-col hidden md:flex z-30 overflow-hidden">
        {sidebarContent}
      </aside>
      {/* Mobile Sidebar Drawer */}
      <aside
        className={`bg-white w-64 h-screen fixed shadow-md flex-col z-50 transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-64"
        }`}
        style={{ top: 0, left: 0 }}
      >
        {/* Close button for mobile */}
        <button
          className="absolute top-4 right-4 bg-gray-100 p-2 rounded"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        >
          <svg width="24" height="24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;