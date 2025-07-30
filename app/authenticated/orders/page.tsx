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

const FILTER_STATUSES = ['Accepted', 'Out for Delivery', 'Delivered'];

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
  paymentStatus?: string;
  uploadReceipt?: string;
}

interface StatusCounts {
  [key: string]: number;
}

// Helper function to change display name
const getDisplayStatus = (status: string): string => {
  if (status === 'Accepted') return 'Receive Order';
  return status;
};

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Accepted');
  const [activeStatusCard, setActiveStatusCard] = useState('Accepted');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = async (status: string) => {
    setLoading(true);
    try {
      const endpoint =
        status === 'All'
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/orders/all`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/orders/status/${status}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      console.log('Fetched orders:', data);
      // For demo/mock: add 'Paid' as payment status if status is Delivered
      const result = (Array.isArray(data) ? data : data.orders || []).map((order: Order) =>
        order.status === 'Delivered'
          ? { ...order, paymentStatus: order.paymentStatus || 'Paid' }
          : order
      );
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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  paymentStatus: newStatus === 'Delivered' ? order.paymentStatus || 'Paid' : order.paymentStatus,
                }
              : order
          )
        );
        fetchStatusCounts();
      } else {
        console.error(`Failed to update order status to ${newStatus}`);
      }
    } catch (err) {
      console.error(`Error updating order status to ${newStatus}:`, err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    await handleStatusUpdate(orderId, 'Out for Delivery');
  };

  const handleDeliverOrder = async (orderId: string) => {
    await handleStatusUpdate(orderId, 'Delivered');
  };

  const router = useRouter();

  const handleEdit = (orderId: string) => {
    router.push(`/authenticated/edit-orders/${orderId}`);
  };

  // Function to handle receipt preview in modal
  const handleReceiptPreview = (receiptUrl: string) => {
    setPreviewImage(receiptUrl);
    setShowModal(true);
  };

  // Function to close modal
  const closeModal = () => {
    setShowModal(false);
    setPreviewImage(null);
  };

  // Handle modal backdrop click
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Determine if we should show the payment status column
  const showPaymentStatus = selectedStatus === 'Delivered';
  const totalColumns = showPaymentStatus ? 8 : 7;

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
              <div className={`font-semibold ${statusTextColors[status] || ''}`}>
                {getDisplayStatus(status)}
              </div>
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
            <table className={`${showPaymentStatus ? 'min-w-[900px]' : 'min-w-[800px]'} w-full text-sm text-left text-gray-700`}>
              <thead className="bg-gray-100 h-12 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 whitespace-nowrap">Order</th>
                  <th className="px-4 py-2 whitespace-nowrap">Centre</th>
                  <th className="px-4 py-2 whitespace-nowrap">Items</th>
                  <th className="px-4 py-2 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-2 whitespace-nowrap">Status</th>
                  <th className="px-4 py-2 whitespace-nowrap">Date</th>
                  {showPaymentStatus && (
                    <th className="px-4 py-2 whitespace-nowrap">Payment Status</th>
                  )}
                  <th className="px-4 py-2 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={totalColumns} className="text-center py-6 text-gray-400">
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
                            {getDisplayStatus(order.status)}
                          </span>
                        </td>
                 

                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {date} <br />
                          {time}
                        </td>
                               {/* Payment Status column with receipt text link - only shown when viewing Delivered orders */}
                        {showPaymentStatus && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                {order.paymentStatus || 'Paid'}
                              </span>
                              {order.uploadReceipt ? (
                                <button
                                  onClick={() => handleReceiptPreview(order.uploadReceipt!)}
                                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                                >
                                  View Receipt
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">No receipt</span>
                              )}
                            </div>
                          </td>
                        )}
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
                          {order.status !== 'Processing' && order.status !== 'Delivered' && (
                            <>
                              {selectedStatus === 'Out for Delivery' && order.status === 'Out for Delivery' ? (
                                <button
                                  onClick={() => handleDeliverOrder(order._id)}
                                  disabled={updatingOrderId === order._id}
                                  className="text-emerald-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updatingOrderId === order._id ? 'Delivering...' : 'Mark as Delivered'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAcceptOrder(order._id)}
                                  disabled={updatingOrderId === order._id}
                                  className="text-green-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updatingOrderId === order._id ? 'Accepting...' : 'Accept'}
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={totalColumns} className="text-center py-6 text-gray-400">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt Preview Modal */}
        {showModal && previewImage && (
          <div 
            className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleModalBackdropClick}
          >
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg text-black font-semibold">Payment Receipt</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-4">
                <img
                  src={previewImage}
                  alt="Payment Receipt"
                  className="max-w-full h-auto mx-auto"
                  onError={(e) => {
                    console.error('Failed to load receipt image:', previewImage);
                    e.currentTarget.src = '/placeholder-receipt.png'; // Add a fallback image
                  }}
                />
              </div>
              
              {/* Modal Footer */}
              <div className="flex justify-end space-x-2 p-4 border-t">
                <button
                  onClick={() => window.open(previewImage, '_blank')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded text-sm"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
