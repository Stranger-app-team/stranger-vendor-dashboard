'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


const statusTextColors: Record<string, string> = {
  Processing: 'text-blue-600',
  'On Hold': 'text-orange-600',
  Declined: 'text-red-600',
  Accepted: 'text-green-600',
  'Out for Delivery': 'text-purple-600',
  Delivered: 'text-emerald-600',
};

const statusBgColors: Record<string, string> = {
  Processing: 'bg-blue-100',
  'On Hold': 'bg-orange-100',
  Declined: 'bg-red-100',
  Accepted: 'bg-green-100',
  'Out for Delivery': 'bg-purple-100',
  Delivered: 'bg-emerald-100',
};

const FILTER_STATUSES = ['On Hold', 'Declined', 'Processing', 'Accepted', 'Out for Delivery', 'Delivered'];

interface Centre {
  name: string;
  centreId: string;
}

interface Product {
  quantity: number;
  product: {
    name: string;
  };
}

interface Order {
  _id: string;
  orderNo: string;
  centreId: Centre;
  products: Product[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface StatusCounts {
  [key: string]: number;
}

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Accepted');
  const [activeStatusCard, setActiveStatusCard] = useState('Accepted');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});

  const fetchOrders = async (status: string) => {
    setLoading(true);
    try {
      const endpoint =
        status === 'All'
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/orders/all`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/orders/status/${status}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      const result = Array.isArray(data) ? data : data.orders || [];
      setOrders(result);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/grouped-by-status`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const counts: StatusCounts = {};
        data.forEach((item) => {
          counts[item.status] = item.count;
        });
        setStatusCounts(counts);
      }
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  };

  useEffect(() => {
    fetchOrders(selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    fetchStatusCounts();
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'Out for Delivery' }),
      });

      if (res.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? { ...order, status: 'Out for Delivery' } : order
          )
        );
        fetchStatusCounts(); // Refresh count
        console.log('Order accepted successfully');
      } else {
        console.error('Failed to accept order');
      }
    } catch (err) {
      console.error('Error accepting order:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };


  const router = useRouter();

const handleEdit = (orderId: string) => {
  router.push(`/authenticated/edit-orders/${orderId}`);
};

  return (
    <div className="flex flex-col gap-4 justify-center py-10 px-2 sm:px-6">
      <div className="w-full max-w-7xl mx-auto">

<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 mb-6">
  {FILTER_STATUSES.map((status) => (
    <div
      key={status}
      onClick={() => {
        setSelectedStatus(status);
        setActiveStatusCard(status);
      }}
      className={`cursor-pointer rounded-lg border border-gray-600/20 p-2 text-sm text-center shadow-sm transition bg-transparent w-full sm:w-[200px]`}
    >
      <div className={`font-semibold ${statusTextColors[status] || ''}`}>{status}</div>
      <div className="text-xs text-gray-500">
        {`${statusCounts[status] ?? 0} Orders`}
      </div>
    </div>
  ))}
</div>

        {/* Order Table Box */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {/* Table Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <p className="text-sm text-gray-600">
              Showing 1–{orders.length} of {orders.length} orders
            </p>
            <select className="border rounded px-2 py-1 text-sm w-full sm:w-auto">
              <option>20 per page</option>
              <option>50 per page</option>
            </select>
          </div>

          {/* Order Table */}
          <div className="overflow-x-auto w-full">
            <table className="min-w-[800px] w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 h-12 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 whitespace-nowrap">Order</th>
                  <th className="px-4 py-2 whitespace-nowrap">Centre</th>
                  <th className="px-4 py-2 whitespace-nowrap">Items</th>
                  <th className="px-4 py-2 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-2 whitespace-nowrap">Status</th>
                  <th className="px-4 py-2 whitespace-nowrap">Date</th>
                  <th className="px-4 py-2 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => {
                    const dateObj = new Date(order.createdAt);
                    const date = dateObj.toLocaleDateString();
                    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr key={order._id} className="border-b border-b-gray-300 bg-white hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-teal-700 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                              {order.orderNo?.slice(-3)}
                            </div>
                            <span className="truncate max-w-[100px]">{order.orderNo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium truncate max-w-[120px]">{order.centreId?.name}</div>
                          <div className="text-xs text-gray-400">ID: {order.centreId?.centreId}</div>
                        </td>
                        <td className="px-4 py-3">
                          {order.products?.length} items
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">
                            {order.products?.map((p) => p.product?.name).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">₹{order.totalAmount?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              statusBgColors[order.status] || 'bg-gray-100'
                            } ${statusTextColors[order.status] || 'text-gray-600'}`}
                          >
                            {order.status === 'Accepted' ? 'Received' : order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {date} <br />
                          {time}
                        </td>
                        <td className="px-4 py-3 space-x-2 text-sm whitespace-nowrap">
                          <button
                          className="text-amber-950 hover:underline"
                          onClick={() => router.push(`/authenticated/view-orders/${order._id}`)}
                          >
                          View
                          </button>
                          <button
                          onClick={() => handleEdit(order._id)}
                          className="text-blue-400 hover:underline"
                          >
                          Edit
                          </button>
                          {order.status !== 'Processing' && (
                          <button
                            onClick={() => handleAcceptOrder(order._id)}
                            disabled={updatingOrderId === order._id}
                            className="text-green-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingOrderId === order._id ? 'Accepting...' : 'Accept'}
                          </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
