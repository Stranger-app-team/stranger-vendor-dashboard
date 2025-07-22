"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, Plus, Minus, X } from "lucide-react";

export default function OrderEditPage() {
  const [orderData, setOrderData] = useState(null);
  const [originalQuantities, setOriginalQuantities] = useState({}); // Store original quantities
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [orderId, setOrderId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    // Extract order ID from URL
    const url = window.location.pathname;
    const pathParts = url.split('/');
    const id = pathParts[pathParts.length - 1];
    setOrderId(id);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderAndProducts = async () => {
      try {
        setProductsLoading(true);
        
        // Fetch order details
        const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`);
        if (!orderRes.ok) throw new Error("Failed to fetch order");
        const orderData = await orderRes.json();
        console.log("Order Data:", orderData);
        setOrderData(orderData.order);

        // Store original quantities
        const originalQtys = {};
        if (orderData.order?.products) {
          orderData.order.products.forEach(item => {
            const productId = item.product?._id || item.product?.id;
            if (productId) {
              originalQtys[productId] = item.quantity || 0;
            }
          });
        }
        setOriginalQuantities(originalQtys);

        // Fetch products for catalog
        const productsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
        if (!productsRes.ok) throw new Error("Failed to fetch products");
        const productsData = await productsRes.json();
        setProducts(productsData);
      } catch (err) {
        console.error(err);
        setError("Error loading data");
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    };

    fetchOrderAndProducts();
  }, [orderId]);

  const handleBack = () => {
    window.history.back();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order');
      }
      
      const result = await response.json();
      console.log('Order updated successfully:', result);
      
      // Optionally show success message or redirect
      // alert('Order updated successfully!');
      
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (!orderData) return;
    
    setOrderData(prev => ({
      ...prev,
      products: prev.products?.map(item => 
        (item.product?._id || item.product?.id) === itemId 
          ? { ...item, quantity: Math.max(0, newQuantity) }
          : item
      ).filter(item => item.quantity > 0) || []
    }));
  };

  const removeItem = (productId) => {
    if (!orderData) return;
    
    setOrderData(prev => ({
      ...prev,
      products: prev.products?.filter(item => (item.product?._id || item.product?.id) !== productId) || []
    }));
  };

  const handleProductQuantityChange = (productId, quantity) => {
    const qty = parseInt(quantity) || 0;
    const originalQty = originalQuantities[productId] || 0;
    const maxAllowed = Math.max(0, originalQty);
    const finalQty = Math.min(qty, maxAllowed); // Cap at original quantity
    
    const existingItem = orderData.products?.find(item => (item.product?._id || item.product?.id) === productId);
    
    if (existingItem) {
      if (finalQty === 0) {
        removeItem(productId);
      } else {
        updateItemQuantity(productId, finalQty);
      }
    } else if (finalQty > 0) {
      // Re-add the product if it was originally in the order
      if (originalQty > 0) {
        const product = products.find(p => (p._id || p.id) === productId);
        if (product) {
          setOrderData(prev => ({
            ...prev,
            products: [...(prev.products || []), { product, quantity: finalQty }]
          }));
        }
      }
    }
  };

  const getCurrentProductQuantity = (productId) => {
    const item = orderData?.products?.find(item => (item.product?._id || item.product?.id) === productId);
    return item?.quantity || 0;
  };

  const getOriginalQuantity = (productId) => {
    return originalQuantities[productId] || 0;
  };

  const getOrderTotal = () => {
    if (!orderData?.products) return 0;
    return orderData.products.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  const filteredProducts = products.filter(product => {
    const productId = product._id || product.id;
    const wasOriginallyInOrder = originalQuantities[productId] > 0;
    
    if (!wasOriginallyInOrder) return false; // Only show products that were originally in the order
    
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

  const canEdit = orderData?.status === 'Draft' || orderData?.status === 'Accepted';

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
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
    <div className="min-h-screen py-6 bg-gray-50 text-gray-600">
      <div className="max-w-7xl mx-auto px-3">
        {/* Compact Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Edit Order #{orderData._id?.slice(-8) || orderId}
                </h1>
                <div className="flex items-center space-x-3 mt-0.5">
                  <span className="text-xs text-gray-600">
                    {orderData.centreId?.name || 'N/A'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    orderData.status === 'Draft' ? 'bg-amber-100 text-amber-800' :
                    orderData.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                    orderData.status === 'On Hold' ? 'bg-orange-100 text-orange-800' :
                    orderData.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {orderData.status}
                  </span>
                </div>
              </div>
            </div>

            {canEdit ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all duration-200 text-sm"
              >
                {saving && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
                Cannot edit in {orderData.status} status
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Left Column - Current Order Items */}
          <div className="xl:col-span-1 space-y-3">
            {/* Order Items Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900">Order Items</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {orderData.products?.length || 0}
                </span>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {orderData.products?.length > 0 ? (
                  orderData.products.map((item, idx) => {
                    const productId = item.product?._id || item.product?.id;
                    const originalQty = getOriginalQuantity(productId);
                    return (
                      <div key={productId || idx} className="bg-green-50 border border-green-200 rounded-lg p-2 hover:bg-green-100 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-xs mb-0.5 truncate">
                              {item.product?.name || 'Unknown Product'}
                            </h4>
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              <span>₹{(item.product?.price || 0).toFixed(2)}</span>
                              <span>×</span>
                              <span>{item.quantity}</span>
                              {originalQty > item.quantity && (
                                <span className="text-orange-600">
                                  (orig: {originalQty})
                                </span>
                              )}
                            </div>
                          </div>
                  
                        </div>
                        <div className="text-center pt-1 border-t border-green-200">
                          <span className="font-semibold text-green-700 text-xs">
                            ₹{((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-900 mb-0.5">No items in order</p>
                    <p className="text-xs text-gray-500">Add products</p>
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
                    <span className="text-sm font-bold text-teal-900">₹{getOrderTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Product Catalog */}
          <div className="xl:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Product Catalog</h2>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <div className="relative md:col-span-2">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category === "All" ? "All Categories" : category}</option>
                  ))}
                </select>
              </div>

              {/* Products Count */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600">
                  {filteredProducts.length} products
                </span>
              </div>
            </div>

            {productsLoading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600 mb-2"></div>
                <p className="text-gray-600 text-xs">Loading products...</p>
              </div>
            ) : (
              <div>
                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[500px] overflow-y-auto mb-3">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const productId = product._id || product.id;
                      const currentQuantity = getCurrentProductQuantity(productId);
                      const originalQuantity = getOriginalQuantity(productId);
                      const canIncrease = currentQuantity < originalQuantity;
                      
                      return (
                        <div key={productId} className="bg-white border border-green-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 relative">
                          {/* Status badges */}
                          {currentQuantity > 0 && (
                            <div className="absolute top-2 right-2 z-10 flex flex-col items-end space-y-1">
                              <span className="text-[10px] text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                                In Order
                              </span>
                              {originalQuantity > 0 && currentQuantity < originalQuantity && (
                                <span className="text-[10px] text-orange-600 font-medium bg-orange-100 px-1.5 py-0.5 rounded-full">
                                  -{originalQuantity - currentQuantity}
                                </span>
                              )}
                            </div>
                          )}
                          {currentQuantity === 0 && (
                            <div className="absolute top-2 right-2 z-10">
                              <span className="text-[10px] text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded-full">
                                Removed
                              </span>
                            </div>
                          )}
                          
                          <div className="flex flex-col items-center mb-2">
                            {/* Product Icon */}
                            <div className="w-8 h-8 mb-2 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <h4
                              className="font-semibold text-gray-900 text-sm text-center mb-1 truncate max-w-[100px]"
                              title={product.name}
                            >
                              {product.name}
                            </h4>
                            <p className="text-xs font-medium text-green-600 mb-1">₹{(product.price || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Max: {originalQuantity}</p>
                          </div>

                          <div className="flex items-center justify-center gap-2 mb-2">
                            <button
                              onClick={() => handleProductQuantityChange(productId, Math.max(0, currentQuantity - 1))}
                              disabled={!canEdit || currentQuantity === 0}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold min-w-[50px] text-center">
                              {currentQuantity}
                            </span>

                            <button
                              onClick={() => handleProductQuantityChange(productId, currentQuantity + 1)}
                              disabled={!canEdit || !canIncrease}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">No products found</p>
                      <p className="text-xs text-gray-500">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}