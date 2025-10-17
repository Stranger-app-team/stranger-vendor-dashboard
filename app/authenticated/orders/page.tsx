"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const statusTextColors: Record<string, string> = {
  Processing: "text-blue-600",
  "On Hold": "text-orange-600",
  Declined: "text-red-600",
  Accepted: "text-green-600",
  "Out for Delivery": "text-purple-600",
  Delivered: "text-emerald-600",
};

const statusBgColors: Record<string, string> = {
  Processing: "bg-blue-100",
  "On Hold": "bg-orange-100",
  Declined: "bg-red-100",
  Accepted: "bg-green-100",
  "Out for Delivery": "bg-purple-100",
  Delivered: "bg-emerald-100",
};

const FILTER_STATUSES = ["Accepted", "Out for Delivery", "Delivered"];

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

const getDisplayStatus = (status: string): string => {
  if (status === "Accepted") return "Receive Order";
  return status;
};

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("Accepted");
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();

  const fetchOrders = async (status: string) => {
    setLoading(true);
    try {
      const endpoint =
        status === "All"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/orders/all`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/orders/status/${status}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      const result = (Array.isArray(data) ? data : data.orders || []).map(
        (order: Order) =>
          order.status === "Delivered"
            ? { ...order, paymentStatus: order.paymentStatus || "Paid" }
            : order
      );
      setOrders(result);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/grouped-by-status`
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        const counts: StatusCounts = {};
        data.forEach((item) => {
          counts[item.status] = item.count;
        });
        setStatusCounts(counts);
      }
    } catch (err) {
      console.error("Failed to fetch status counts:", err);
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  status: newStatus,
                  paymentStatus:
                    newStatus === "Delivered"
                      ? order.paymentStatus || "Paid"
                      : order.paymentStatus,
                }
              : order
          )
        );
        fetchStatusCounts();
      } else {
        console.error(`Failed to update order status to ${newStatus}`);
      }
    } catch (err) {
      console.error(`Error updating order status:`, err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    await handleStatusUpdate(orderId, "Out for Delivery");
  };

  const handleDeliverOrder = async (orderId: string) => {
    await handleStatusUpdate(orderId, "Delivered");
  };

  const handleEdit = (orderId: string) => {
    router.push(`/authenticated/edit-orders/${orderId}`);
  };

  const handleReceiptPreview = (receiptUrl: string) => {
    setPreviewImage(receiptUrl);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPreviewImage(null);
  };

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const showPaymentStatus = selectedStatus === "Delivered";
  const totalColumns = showPaymentStatus ? 8 : 7;

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      order.orderNo?.toLowerCase().includes(q) ||
      order.centreId?.name?.toLowerCase().includes(q) ||
      order.centreId?.centreId?.toLowerCase().includes(q) ||
      (order.products &&
        order.products.some((p) => p?.product?.name?.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="flex flex-col gap-4 justify-center px-3 sm:px-6">
      <div className="w-full max-w-9xl mx-auto">
        {/* 🔹 Toolbar: Filters + Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-white shadow-sm border border-gray-100 rounded-xl p-3">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTER_STATUSES.map((status) => (
              <div
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 
                  flex-1 min-w-[100px] text-center sm:flex-initial sm:min-w-0
                  ${
                    selectedStatus === status
                      ? `${statusBgColors[status]} ${statusTextColors[status]} shadow-md`
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <div className="flex flex-col items-center sm:flex-row sm:space-x-2">
                  <span>{getDisplayStatus(status)}</span>
                  <span className="text-xs text-gray-500">{`${
                    statusCounts[status] ?? 0
                  } Orders`}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 🔍 Search Input */}
          <div className="relative w-full sm:w-[260px]">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border text-black border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
              />
            </svg>
          </div>
        </div>

        {/* 📊 Orders Display */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {/* Mobile View: Card Layout */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-6 text-gray-400">Loading...</div>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const dateObj = new Date(order.createdAt);
                const day = String(dateObj.getDate()).padStart(2, "0");
                const month = dateObj.toLocaleString("en-GB", {
                  month: "short",
                });
                const year = dateObj.getFullYear();
                const time = dateObj.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const formattedDate = `${day}-${month}-${year}`;

                return (
                  <div
                    key={order._id}
                    className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-shadow duration-150 hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-3 text-sm text-gray-700">
                      {/* Order Info */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                            {order.orderNo?.slice(-3)}
                          </div>
                          <span className="font-medium text-teal-700 truncate max-w-[120px]">
                            {order.orderNo}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            statusBgColors[order.status] || "bg-gray-100"
                          } ${
                            statusTextColors[order.status] || "text-gray-600"
                          }`}
                        >
                          {getDisplayStatus(order.status)}
                        </span>
                      </div>

                      {/* Centre Info */}
                      <div>
                        <div className="font-medium truncate max-w-[200px]">
                          {order.centreId?.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {order.centreId?.centreId}
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <div>{order.products?.length} items</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">
                          {order.products
                            ?.map((p) => p.product?.name)
                            .join(", ")}
                        </div>
                      </div>

                      {/* Amount and Date */}
                      <div className="flex justify-between">
                        <div>₹{order.totalAmount?.toFixed(2)}</div>
                        <div className="text-gray-500 text-right">
                          {formattedDate} <br /> {time}
                        </div>
                      </div>

                      {/* Payment Status (if applicable) */}
                      {showPaymentStatus && (
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {order.paymentStatus || "Paid"}
                          </span>
                          {order.uploadReceipt ? (
                            <button
                              onClick={() =>
                                handleReceiptPreview(order.uploadReceipt!)
                              }
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View Receipt
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No receipt
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/authenticated/view-orders/${order._id}`
                            )
                          }
                          className="text-amber-950 hover:underline text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(order._id)}
                          className="text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        {order.status !== "Processing" &&
                          order.status !== "Delivered" && (
                            <>
                              {selectedStatus === "Out for Delivery" &&
                              order.status === "Out for Delivery" ? (
                                <button
                                  onClick={() => handleDeliverOrder(order._id)}
                                  disabled={updatingOrderId === order._id}
                                  className="text-emerald-600 hover:underline text-sm disabled:opacity-50"
                                >
                                  {updatingOrderId === order._id
                                    ? "Delivering..."
                                    : "Mark as Delivered"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAcceptOrder(order._id)}
                                  disabled={updatingOrderId === order._id}
                                  className="text-green-600 hover:underline text-sm disabled:opacity-50"
                                >
                                  {updatingOrderId === order._id
                                    ? "Accepting..."
                                    : "Accept"}
                                </button>
                              )}
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-400">
                No orders found.
              </div>
            )}
          </div>

          {/* Desktop View: Table Layout */}
          <div className="hidden md:block overflow-x-auto w-full overflow-y-auto max-h-[740px]">
            <table
              className={`${
                showPaymentStatus ? "min-w-[900px]" : "min-w-[800px]"
              } w-full text-sm text-left text-gray-700`}
            >
              <thead className="bg-gray-100/80 backdrop-blur-md h-12 text-xs text-gray-600 uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Centre</th>
                  <th className="px-4 py-2">Items</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Date</th>
                  {showPaymentStatus && <th className="px-4 py-2">Payment</th>}
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={totalColumns} className="py-10">
                      <div className="flex flex-col items-center justify-center space-y-3 text-gray-500">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Loading Orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const dateObj = new Date(order.createdAt);
                    const day = String(dateObj.getDate()).padStart(2, "0");
                    const month = dateObj.toLocaleString("en-GB", {
                      month: "short",
                    });
                    const year = dateObj.getFullYear();
                    const time = dateObj.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const formattedDate = `${day}-${month}-${year}`;
                    return (
                      <tr
                        key={order._id}
                        className="border-b hover:bg-gray-50 transition-shadow duration-150 hover:shadow-sm"
                      >
                        <td className="px-4 py-3 font-medium text-teal-700">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                              {order.orderNo?.slice(-3)}
                            </div>
                            <span className="truncate max-w-[100px]">
                              {order.orderNo}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium truncate max-w-[120px]">
                            {order.centreId?.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {order.centreId?.centreId}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {order.products?.length} items
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">
                            {order.products
                              ?.map((p) => p.product?.name)
                              .join(", ")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          ₹{order.totalAmount?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              statusBgColors[order.status] || "bg-gray-100"
                            } ${
                              statusTextColors[order.status] || "text-gray-600"
                            }`}
                          >
                            {getDisplayStatus(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formattedDate} <br /> {time}
                        </td>
                        {showPaymentStatus && (
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                {order.paymentStatus || "Paid"}
                              </span>
                              {order.uploadReceipt ? (
                                <button
                                  onClick={() =>
                                    handleReceiptPreview(order.uploadReceipt!)
                                  }
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No receipt
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 space-x-2 text-sm">
                          <button
                            onClick={() =>
                              router.push(
                                `/authenticated/view-orders/${order._id}`
                              )
                            }
                            className="text-amber-950 hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(order._id)}
                            className="text-blue-400 hover:underline"
                          >
                            Edit
                          </button>
                          {order.status !== "Processing" &&
                            order.status !== "Delivered" && (
                              <>
                                {selectedStatus === "Out for Delivery" &&
                                order.status === "Out for Delivery" ? (
                                  <button
                                    onClick={() =>
                                      handleDeliverOrder(order._id)
                                    }
                                    disabled={updatingOrderId === order._id}
                                    className="text-emerald-600 hover:underline disabled:opacity-50"
                                  >
                                    {updatingOrderId === order._id
                                      ? "Delivering..."
                                      : "Mark as Delivered"}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAcceptOrder(order._id)}
                                    disabled={updatingOrderId === order._id}
                                    className="text-green-600 hover:underline disabled:opacity-50"
                                  >
                                    {updatingOrderId === order._id
                                      ? "Accepting..."
                                      : "Accept"}
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
                    <td
                      colSpan={totalColumns}
                      className="text-center py-6 text-gray-400"
                    >
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🧾 Receipt Preview Modal */}
        {showModal && previewImage && (
          <div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={handleModalBackdropClick}
          >
            <div className="bg-white rounded-lg w-full max-w-4xl sm:max-w-3xl max-h-[90vh] overflow-auto relative">
              <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
                <h3 className="text-lg text-black font-semibold">
                  Payment Receipt
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <img
                  src={previewImage}
                  alt="Payment Receipt"
                  className="w-full h-auto mx-auto"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 p-4 border-t">
                <button
                  onClick={() => window.open(previewImage, "_blank")}
                  className="px-4 py-2 bg-emerald-600 text-white rounded text-sm w-full sm:w-auto"
                >
                  Open in New Tab
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm w-full sm:w-auto"
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
