"use client";
import { useEffect, useState } from 'react';
import { HiBuildingOffice, HiMagnifyingGlass } from 'react-icons/hi2';

const OrdersByCenterPage = () => {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [centerSearch, setCenterSearch] = useState('');
  const [filteredCentres, setFilteredCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt')
      );
    }
    return null;
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchCentres = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centres`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (res.status === 401) throw new Error('Unauthorized');
      const response = await res.json();
      console.log('Centres fetched:', response);
      setCentres(response.data || response || []);
    } catch (error) {
      setError('Failed to fetch centres.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersForCentre = async (centreObjectId) => {
    try {
      setOrdersLoading(true);
      setOrders([]);
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/centre/${centreObjectId}`, {
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      console.log('Orders fetched for centre >>>>>>>>>>>:', data);
      setOrders(data?.orders || []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    if (!centerSearch) {
      setFilteredCentres(centres);
    } else {
      const searchLower = centerSearch.toLowerCase();
      setFilteredCentres(
        centres.filter((centre) =>
          centre.name?.toLowerCase().includes(searchLower) ||
          centre.centreId?.toLowerCase().includes(searchLower) ||
          centre.regionId?.name?.toLowerCase().includes(searchLower) ||
          centre.branchId?.name?.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [centerSearch, centres]);

  const handleCentreClick = (centre) => {
    setSelectedCentre(centre);
    fetchOrdersForCentre(centre._id); 
  };

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.toString().split(regex).map((part, index) =>
      regex.test(part)
        ? (
          <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
            {part}
          </mark>
        )
        : part
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sidebar: Centers List */}
<div className="col-span-1 max-w-sm bg-white border border-slate-200 rounded-lg p-4">
  <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
    <HiBuildingOffice className="w-4 h-4 mr-2 text-slate-600" />
    Centers ({centres.length})
  </h2>
  <div className="mb-4">
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
        <HiMagnifyingGlass className="h-4 w-4 text-slate-400" />
      </span>
      <input
        type="text"
        placeholder="Search centers..."
        value={centerSearch}
        onChange={(e) => setCenterSearch(e.target.value)}
        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500"
      />
    </div>
  </div>

  {loading ? (
    <p className="text-sm text-slate-500">Loading centers...</p>
  ) : (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      {filteredCentres.map((centre) => (
        <div
          key={centre._id}
          onClick={() => handleCentreClick(centre)}
          className={`cursor-pointer p-3 rounded-lg border ${
            selectedCentre?._id === centre._id
              ? 'border-teal-500 bg-teal-50'
              : 'border-slate-200'
          } hover:border-teal-400`}
        >
          <p className="text-sm font-medium text-slate-900">
            {highlightSearchTerm(centre.name, centerSearch)}
          </p>
          <p className="text-xs text-slate-500">
            ID: {highlightSearchTerm(centre.centreId, centerSearch)}
          </p>
          <p className="text-xs text-slate-500">
            {centre.regionId?.name}
            {centre.branchId?.name && ` • ${centre.branchId.name}`}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
        {/* Right Panel: Orders */}
        <div className="col-span-2 bg-white border text-black border-slate-200 rounded-lg p-6">
          {selectedCentre ? (
            <>
              <h3 className="text-lg font-semibold mb-2">
                Orders for: {selectedCentre.name}
              </h3>
          {ordersLoading ? (
  <p className="text-sm text-slate-500">Loading orders...</p>
) : orders.length > 0 ? (
<div className="overflow-x-auto">
  <table className="min-w-[700px] w-full text-xs text-left text-gray-700">
    <thead className="bg-gray-100 h-10 text-[11px] text-gray-500 uppercase">
      <tr>
        <th className="px-3 py-2 whitespace-nowrap">Order</th>
        <th className="px-3 py-2 whitespace-nowrap">Items</th>
        <th className="px-3 py-2 whitespace-nowrap">Amount</th>
        <th className="px-3 py-2 whitespace-nowrap">Status</th>
        <th className="px-3 py-2 whitespace-nowrap">Date</th>
      </tr>
    </thead>
    <tbody>
      {orders.map((order) => {
        const dateObj = new Date(order.createdAt);
        const date = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const statusTextColors = {
          Processing: 'text-blue-600',
          'On Hold': 'text-orange-600',
          Declined: 'text-red-600',
          Accepted: 'text-green-600',
          'Out for Delivery': 'text-purple-600',
          Delivered: 'text-emerald-600',
        };

        const statusBgColors = {
          Processing: 'bg-blue-100',
          'On Hold': 'bg-orange-100',
          Declined: 'bg-red-100',
          Accepted: 'bg-green-100',
          'Out for Delivery': 'bg-purple-100',
          Delivered: 'bg-emerald-100',
        };

        return (
          <tr key={order._id} className="border-b border-b-gray-200 bg-white hover:bg-gray-50">
            <td className="px-3 py-2 font-medium text-teal-700 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {order.orderNo?.slice(-3)}
                </div>
                <span className="truncate max-w-[80px]">{order.orderNo}</span>
              </div>
            </td>
            <td className="px-3 py-2">
              {order.products?.length} items
              <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                {order.products?.map((p) => p.product?.name).join(', ')}
              </div>
            </td>
            <td className="px-3 py-2 whitespace-nowrap">₹{order.totalAmount?.toFixed(2)}</td>
            <td className="px-3 py-2 whitespace-nowrap">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  statusBgColors[order.status] || 'bg-gray-100'
                } ${statusTextColors[order.status] || 'text-gray-600'}`}
              >
                {order.status === 'Accepted' ? 'Received' : order.status}
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
</div>

) : (
  <p className="text-sm text-slate-500">No orders found for this center.</p>
)}

            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <HiBuildingOffice className="w-12 h-12 mb-2" />
              <p className="text-sm">Select a center to view its orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersByCenterPage;
