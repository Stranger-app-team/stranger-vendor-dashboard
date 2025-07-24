"use client";

import React, { useEffect, useState } from "react";

export default function OrderDetailsPage() {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Extract order ID from URL
    const url = window.location.pathname;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1];
    setOrderId(id);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`);
        if (!orderRes.ok) throw new Error("Failed to fetch order");
        const orderData = await orderRes.json();
        console.log("Order Data:", orderData);
        setOrderData(orderData.order);
      } catch (err) {
        console.error(err);
        setError("Error loading order data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleBack = () => {
    window.history.back();
  };

  const handleEdit = () => {
    // Redirect to edit page with order ID
    window.location.href = `/authenticated/edit-orders/${orderId}`;
  };

  const handleStatusChange = (newStatus) => {
    // Handle status change logic here
    console.log(`Changing status to: ${newStatus}`);
  };

  const getOrderTotal = () => {
    if (!orderData?.products) return 0;
    return orderData.products.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

const generateReceiptHTML = () => {
    // Fixed total calculation
    const orderTotal = orderData.products?.reduce((sum, item) => {
        const price = item.product?.price || 0;
        const quantity = item.quantity || 0;
        return sum + (price * quantity);
    }, 0) || 0;
    
    const totalItems = orderData.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Receipt - ${orderData._id?.slice(-8) || orderId}</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: white; 
            }
            .receipt { 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 30px; 
                border-radius: 8px; 
            
            }
            .header { 
                text-align: center; 
                border-bottom: 2px solid #059669; 
                padding-bottom: 20px; 
                margin-bottom: 20px; 
            }
            .company-name { 
                font-size: 28px; 
                font-weight: bold; 
                color: #059669; 
                margin-bottom: 5px; 
            }
            .receipt-title { 
                font-size: 20px; 
                color: #374151; 
                margin-bottom: 10px; 
            }
            .order-info { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px; 
            }
            .info-section { 
                flex: 1; 
            }
            .info-title { 
                font-weight: bold; 
                color: #374151; 
                margin-bottom: 10px; 
                font-size: 14px; 
                text-transform: uppercase; 
            }
            .info-value { 
                color: #6B7280; 
                margin-bottom: 5px; 
            }
            .products-section { 
                margin-bottom: 30px; 
            }
            .section-title { 
                font-size: 18px; 
                font-weight: bold; 
                color: #374151; 
                margin-bottom: 15px; 
                border-bottom: 1px solid #E5E7EB; 
                padding-bottom: 5px; 
            }
            .products-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px; 
            }
            .products-table th { 
                background: #F3F4F6; 
                padding: 12px; 
                text-align: left; 
                font-weight: bold; 
                color: #374151; 
                border: 1px solid #E5E7EB; 
            }
            .products-table td { 
                padding: 12px; 
                border: 1px solid #E5E7EB; 
            }
            .products-table tr:nth-child(even) { 
                background: #F9FAFB; 
            }
            .text-right { 
                text-align: right; 
            }
            .total-section { 
                background: #F0FDF4; 
                padding: 20px; 
                border-radius: 8px; 
                border: 2px solid #16A34A; 
            }
            .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 10px; 
            }
            .total-label { 
                font-weight: bold; 
                color: #374151; 
            }
            .total-value { 
                font-weight: bold; 
                color: #16A34A; 
            }
            .grand-total { 
                font-size: 20px; 
                padding-top: 10px; 
               
            }
            .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #E5E7EB; 
                color: #6B7280; 
                font-size: 12px; 
            }
            .status-badge { 
                display: inline-block; 
                padding: 6px 12px; 
                border-radius: 20px; 
                font-size: 12px; 
                font-weight: bold; 
            }
            .status-${orderData.status?.toLowerCase().replace(' ', '-')} { 
                ${orderData.status === 'Draft' ? 'background: #FEF3C7; color: #92400E;' :
                  orderData.status === 'Pending' ? 'background: #FEF3C7; color: #92400E;' :
                  orderData.status === 'Processing' ? 'background: #DBEAFE; color: #1E40AF;' :
                  orderData.status === 'Completed' ? 'background: #D1FAE5; color: #065F46;' :
                  orderData.status === 'Accepted' ? 'background: #D1FAE5; color: #065F46;' :
                  'background: #F3F4F6; color: #374151;'}
            }
        </style>
    </head>
    <body>
        <div class="receipt">
            <div class="header">
                <div class="company-name">Hop Shop</div>
            </div>

            <div class="order-info">
                <div class="info-section">
                    <div class="info-title">Order Details</div>
                    <div class="info-value">Order ID: ${orderData._id || orderId}</div>
                    <div class="info-value">Date: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString() : 'N/A'}</div>
                    <div class="info-value">Time: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleTimeString() : 'N/A'}</div>
                    <div class="info-value">Status: <span class="status-badge status-${orderData.status?.toLowerCase().replace(' ', '-')}">${orderData.status}</span></div>
                    <div class="info-value">Total Items: ${totalItems}</div>
                </div>
                <div class="info-section">
                    <div class="info-title">Centre Information</div>
                    <div class="info-value">Centre: ${orderData.centreId?.name || 'N/A'}</div>
                    <div class="info-value">Centre ID: ${orderData.centreId?.centreId || 'N/A'}</div>
                    ${orderData.centreId?.regionId ? `<div class="info-value">Region: ${orderData.centreId.regionId.name}</div>` : ''}
                    ${orderData.centreId?.branchId ? `<div class="info-value">Area: ${orderData.centreId.branchId.name}</div>` : ''}
                </div>
            </div>

            <div class="products-section">
                <div class="section-title">Order Items</div>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th style="width: 50%">Product Name</th>
                            <th style="width: 15%" class="text-right">Price</th>
                            <th style="width: 15%" class="text-right">Quantity</th>
                            <th style="width: 20%" class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderData.products?.map(item => `
                            <tr>
                                <td>${item.product?.name || 'Unknown Product'}</td>
                                <td class="text-right">₹${(item.product?.price || 0).toFixed(2)}</td>
                                <td class="text-right">${item.quantity || 0}</td>
                                <td class="text-right">₹${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="4" style="text-align: center;">No products found</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div class="total-section">
                <div class="total-row grand-total">
                    <span class="total-label">Grand Total:</span>
                    <span class="total-value">₹${orderTotal.toFixed(2)}</span>
                </div>
            </div>

            <div class="footer">
                <p>Thank you for your order!</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>`;
};

  const downloadReceipt = async () => {
    if (!orderData) return;
    
    setDownloading(true);
    try {
      const receiptHTML = generateReceiptHTML();
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for the content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        // Close the window after printing
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Error generating receipt. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const canEdit = orderData?.status === 'Draft' || orderData?.status === 'Accepted';

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-gray-600">Loading order details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-red-500 text-center p-10">{error}</div>
    </div>
  );

  if (!orderData) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-10">Order not found</div>
    </div>
  );

  return (
    <div className="min-h-screen py-6 bg-gray-50 text-black">
      <div className="max-w-7xl mx-auto px-3">
        {/* Compact Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all duration-200"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Order #{orderData._id?.slice(-8) || orderId}
                </h1>
                <p className="text-xs text-gray-600">
                  {orderData.createdAt && (
                    <>
                      {new Date(orderData.createdAt).toLocaleDateString()} • {new Date(orderData.createdAt).toLocaleTimeString()}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
                  orderData.status === 'Draft' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  orderData.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  orderData.status === 'Processing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  orderData.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                  orderData.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                  orderData.status === 'Failed' ? 'bg-red-100 text-red-800 border-red-200' :
                  orderData.status === 'Returned' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                  orderData.status === 'On Hold' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                  orderData.status === 'Declined' ? 'bg-red-100 text-red-800 border-red-200' :
                  orderData.status === 'Accepted' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}
                style={{ minWidth: 120, textAlign: 'center' }}
              >
                Current Status: {orderData.status}
              </span>

              {/* Download Receipt Button */}
              <button
                onClick={downloadReceipt}
                disabled={downloading}
                className="px-3 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-xs font-semibold shadow-sm border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Receipt
                  </>
                )}
              </button>

              {/* Edit Button for Accepted Orders */}
              {orderData.status === 'Accepted' && (
                <button
                  onClick={handleEdit}
                  className="px-3 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-xs font-semibold shadow-sm border border-teal-200"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
          {/* Order Information & Summary - Left Column */}
          <div className="xl:col-span-1 space-y-3">
            {/* Order Info Card */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Order Information</h2>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Order Number</label>
                  <p className="text-xs text-gray-900 font-mono truncate">{orderData._id || orderId}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Status</label>
                  <p className="text-xs text-gray-900">{orderData.status}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Created</label>
                  <p className="text-xs text-gray-900">
                    {orderData.createdAt && new Date(orderData.createdAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {orderData.updatedAt && orderData.updatedAt !== orderData.createdAt && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Updated</label>
                    <p className="text-xs text-gray-900">
                      {new Date(orderData.updatedAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Centre Information */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Centre Details</h2>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Centre Name</label>
                  <p className="text-xs text-gray-900 truncate">{orderData.centreId?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Centre ID</label>
                  <p className="text-xs text-gray-900 font-mono">{orderData.centreId?.centreId || 'N/A'}</p>
                </div>
                {orderData.centreId?.regionId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Region</label>
                    <p className="text-xs text-gray-900 truncate">{orderData.centreId.regionId.name}</p>
                  </div>
                )}
                {orderData.centreId?.branchId && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Area</label>
                    <p className="text-xs text-gray-900 truncate">{orderData.centreId.branchId.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-lg p-3">
              <h2 className="text-sm font-semibold text-teal-800 mb-3">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-teal-700">Items:</span>
                  <span className="text-xs font-medium text-teal-900">
                    {orderData.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                  </span>
                </div>
                <div className="border-t border-teal-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-teal-800 font-semibold">Total:</span>
                    <span className="text-sm font-bold text-teal-900">
                      ₹{getOrderTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Products ({orderData.products?.length || 0})
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-2 py-1 rounded text-xs font-medium border ${
                      viewMode === 'card' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-500 border-gray-300'
                    } transition-colors`}
                    onClick={() => setViewMode('card')}
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="4" width="7" height="7" rx="2"/>
                      <rect x="13" y="4" width="7" height="7" rx="2"/>
                      <rect x="4" y="13" width="7" height="7" rx="2"/>
                      <rect x="13" y="13" width="7" height="7" rx="2"/>
                    </svg>
                    Cards
                  </button>
                  <button
                    className={`px-2 py-1 rounded text-xs font-medium border ${
                      viewMode === 'list' ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-white text-gray-500 border-gray-300'
                    } transition-colors`}
                    onClick={() => setViewMode('list')}
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="6" width="16" height="2" rx="1"/>
                      <rect x="4" y="11" width="16" height="2" rx="1"/>
                      <rect x="4" y="16" width="16" height="2" rx="1"/>
                    </svg>
                    List
                  </button>
                </div>
              </div>

              <div className="p-3">
                {orderData.products?.length > 0 ? (
                  <div className="space-y-3">
                    {/* Products Grid or List */}
                    {viewMode === 'card' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-140 overflow-y-auto">
                        {orderData.products.map((item, idx) => (
                          <div key={idx} className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
                            {/* Product Icon */}
                            <div className="w-6 h-6 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            {/* Product Name */}
                            <h3 className="font-semibold text-gray-900 text-xs text-center mb-2 truncate" title={item.product?.name}>
                              {item.product?.name || 'Unknown Product'}
                            </h3>
                            {/* Price and Quantity */}
                            <div className="text-center space-y-1">
                              <p className="text-xs text-green-600 font-medium">₹{(item.product?.price || 0).toFixed(2)} each</p>
                              <p className="text-xs text-gray-600">Qty: {item.quantity || 0}</p>
                              {/* Calculation */}
                              <div className="border-t border-green-200 pt-1 mt-2">
                                <p className="text-xs text-gray-500">
                                  {item.quantity || 0} × ₹{(item.product?.price || 0).toFixed(2)}
                                </p>
                                <p className="text-sm font-bold text-green-700">
                                  ₹{((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-140">
                        <table className="min-w-full text-xs border border-gray-200 rounded-lg">
                          <thead className="bg-teal-50">
                            <tr>
                              <th className="px-2 py-2 text-left uppercase tracking-wide text-gray-700">Product</th>
                              <th className="px-2 py-2 text-right uppercase tracking-wide text-gray-700">Price</th>
                              <th className="px-2 py-2 text-right uppercase tracking-wide text-gray-700">Qty</th>
                              <th className="px-2 py-2 text-right uppercase tracking-wide text-gray-700">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderData.products.map((item, idx) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-green-50">
                                <td className="px-2 py-2 truncate text-sm max-w-[160px]">{item.product?.name || 'Unknown Product'}</td>
                                <td className="px-2 py-2 text-xs text-right">₹{(item.product?.price || 0).toFixed(2)}</td>
                                <td className="px-2 py-2 text-xs text-right">{item.quantity || 0}</td>
                                <td className="px-2 py-2 text-xs text-right font-bold text-green-700">₹{((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* Total Summary */}
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-3 mt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Order Total</p>
                          <p className="text-xs text-gray-600">
                            {orderData.products?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-700">
                            ₹{getOrderTotal().toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600">Total Amount</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No products in this order</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}