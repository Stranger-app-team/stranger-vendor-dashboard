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
  vendorOrderId: string;
  orderId: {
    _id: string;
    orderNo: string;
    status: string;
    products: { product: Product; quantity: number; name: string; price: number; total: number }[];
    centreId: {
      _id: string;
      centreId: string;
      name: string;
    };
  };
  centreId: {
    _id: string;
    centreId: string;
    name: string;
  };
  centre?: {
    centreId: string;
    centreName: string;
  };
  products: { product: string; name: string; price: number; quantity: number; total: number }[];
  subTotal: number;
  totalAmount: number;
  status: string;
  vendorOrderStatus: string;
  masterOrderNo: string;
  paymentStatus: string;
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

      const vendorId = userData._id;
      if (!vendorId) {
        setError('Vendor ID not found. Please login again.');
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/orders/accepted/${vendorId}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Failed to load orders: ${errorData.message || 'Unknown error'}`
        );
      }

      const data = await res.json();
      console.log('Fetched accepted orders:', data);
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
    const interval = setInterval(() => {
      fetchOrders();
    }, 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = orders.filter(
        (order) =>
          order.centre?.centreId?.toLowerCase().includes(lower) ||
          order.centre?.centreName?.toLowerCase().includes(lower) ||
          order.centreId?.centreId?.toLowerCase().includes(lower) ||
          order.centreId?.name?.toLowerCase().includes(lower) ||
          order.products?.some((p) =>
            p.name?.toLowerCase().includes(lower)
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
                className="w-full pl-9 pr-3 py-2 border text-black border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500"
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
                    <th className="px-3 py-2 whitespace-nowrap">Centre ID</th>
                    <th className="px-3 py-2 whitespace-nowrap">Items</th>
                    <th className="px-3 py-2 whitespace-nowrap">Amount</th>
                    <th className="px-3 py-2 whitespace-nowrap">Centre</th>
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

                    // Get centre info from either centre object or centreId
                    const centreId = order.centre?.centreId || order.centreId?.centreId || 'N/A';
                    const centreName = order.centre?.centreName || order.centreId?.name || 'N/A';

                    return (
                      <tr
                        key={order._id}
                        className="border-b border-b-gray-200 bg-white hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          router.push(
                            `/authenticated/accepted-order-detail/${order._id}`
                          );
                        }}
                      >
                        <td className="px-3 py-2 font-medium text-teal-700 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold">
                              {centreId.slice(-3) || 'N/A'}
                            </div>
                            <span>{centreId}</span>
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          {order.products?.length || 0} items
                          <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                            {order.products
                              ?.map((p) => p.name)
                              .join(', ')}
                          </div>
                        </td>

                        <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                          ₹ {order.totalAmount.toFixed(2)}
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap text-gray-800">
                          {centreName}
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-600">
                            {order.vendorOrderStatus || 'Accepted'}
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
