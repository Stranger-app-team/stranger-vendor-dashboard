'use client';

import { useEffect, useState } from 'react';
import { HiMagnifyingGlass } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';

interface Product {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  orderId: {
    _id: string;
    products: { product: Product; quantity: number }[];
  };
  totalAmount: number;
  createdAt: string;
}

interface VendorData {
  _id: string;
  userId: string;
  name: string;
  mobileNumber: string;
  role: string;
  status: string;
}

export default function AcceptedOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [vendor, setVendor] = useState<VendorData | null>(null);

  const router = useRouter();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userDataString = localStorage.getItem('userData');

      if (!userDataString) {
        setError('User data not found. Please login again.');
        return;
      }

      const userData: VendorData = JSON.parse(userDataString);
      setVendor(userData);

      const vendorId = userData._id; // backend uses _id from your data
      if (!vendorId) {
        setError('Vendor ID not found. Please login again.');
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Failed to load orders: ${errorData.message || 'Unknown error'}`
        );
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = orders.filter(
        (order) =>
          order.orderId?._id?.toLowerCase().includes(lower) ||
          order.orderId?.products?.some((p) =>
            p.product?.name?.toLowerCase().includes(lower)
          )
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  // ✅ NEW: set browser tab title dynamically based on vendor
  useEffect(() => {
    if (vendor?.name) {
      document.title = `Accepted Orders | ${vendor.name}`;
    } else {
      document.title = 'Accepted Orders';
    }
  }, [vendor]);

  return (
    <div className="max-h-screen bg-slate-50">
      <div className="max-w-9xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {/* Header with Search */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              {vendor?.name
                ? `${vendor.name} - Accepted Orders (${filteredOrders.length})`
                : `Accepted Orders (${filteredOrders.length})`}
            </h2>
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <HiMagnifyingGlass className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading orders...</p>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-xs text-left text-gray-700">
                <thead className="bg-gray-100 h-10 text-[11px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 whitespace-nowrap">Order ID</th>
                    <th className="px-3 py-2 whitespace-nowrap">Items</th>
                    {/* <th className="px-3 py-2 whitespace-nowrap">Amount</th> */}
                    <th className="px-3 py-2 whitespace-nowrap">Vendor</th>
                    <th className="px-3 py-2 whitespace-nowrap">Status</th>
                    <th className="px-3 py-2 whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const dateObj = new Date(order.createdAt);
                    const date = dateObj.toLocaleDateString();
                    const time = dateObj.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={order._id}
                        className="border-b border-b-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/authenticated/view-orders/${order.orderId?._id}`
                          )
                        }
                      >
                        <td className="px-3 py-2 font-medium text-teal-700 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold">
                              {order.orderId?._id?.slice(-3)}
                            </div>
                            <span className="truncate max-w-[80px]">
                              {order.orderId?._id}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          {order.orderId?.products?.length || 0} items
                          <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                            {order.orderId?.products
                              ?.map((p) => p.product?.name)
                              .join(', ')}
                          </div>
                        </td>

                        {/* <td className="px-3 py-2 whitespace-nowrap">
                          ₹{order.totalAmount?.toFixed(2)}
                        </td> */}

                        <td className="px-3 py-2 whitespace-nowrap text-gray-800">
                          {vendor?.name || 'N/A'}
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-600">
                            Accepted
                          </span>
                        </td>

                        <td className="px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap">
                          {date} <br />
                          {time}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No accepted orders found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
