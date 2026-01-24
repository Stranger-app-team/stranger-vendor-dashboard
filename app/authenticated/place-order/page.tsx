'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  stock: number;
  image?: string;
  vendor?: {
    _id: string;
    name: string;
    mobileNumber?: string;
    userId?: string;
    role?: string;
  };
  createdBy?: {
    _id: string;
    name: string;
    loginId?: string;
  };
}

interface Centre {
  _id: string;
  name: string;
  shortCode?: string;
  branchName?: string;
}

interface CartItem {
  _id: string;
  product: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface ProductQuantity {
  [key: string]: number;
}

export default function PlaceOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string>('');
  const [centreSearch, setCentreSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productQuantities, setProductQuantities] = useState<ProductQuantity>({});
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [productSearch, setProductSearch] = useState<string>('');

    // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Get token from cookie or localStorage
  const getToken = () => {
    try {
      // Try localStorage first
      const localToken = localStorage.getItem('token');
      if (localToken) return localToken;

      // Try from cookies
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token' || name === 'authToken') {
          return decodeURIComponent(value);
        }
      }
      return '';
    } catch (err) {
      console.error('Error getting token:', err);
      return '';
    }
  };

  // Fetch all products on component mount
  useEffect(() => {
    const authToken = getToken();
    setToken(authToken);
    fetchProducts(authToken);
    fetchCentres();
  }, []);

  const fetchProducts = async (authToken?: string) => {
    try {
      setLoading(true);
      setError('');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch products: ${res.status}`);
      }

      const data = await res.json();
      console.log('Products fetched:', data);
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCentres = async () => {
    try {
      setError('');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/centres`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch centres: ${res.status}`);
      }

      const data = await res.json();
      console.log('Centres fetched:', data);
      setCentres(Array.isArray(data) ? data : data.centres || []);
    } catch (err: any) {
      console.error('Error fetching centres:', err);
      setError(err.message || 'Failed to load centres');
    }
  };

  const handleToggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      const newQuantities = { ...productQuantities };
      delete newQuantities[productId];
      setProductQuantities(newQuantities);
    } else {
      newSelected.add(productId);
      setProductQuantities({ ...productQuantities, [productId]: 1 });
    }
    setSelectedProducts(newSelected);
  };

  const handleQuantityChangeForSelected = (productId: string, quantity: number) => {
    const product = products.find(p => p._id === productId);
    if (product && quantity > product.stock) {
      setError(`Only ${product.stock} items available`);
      return;
    }
    setProductQuantities({ ...productQuantities, [productId]: Math.max(0, quantity) });
    setError('');
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
      setProductQuantities({});
    } else {
      const newSelected = new Set<string>();
      const newQuantities: ProductQuantity = {};
      products.forEach(product => {
        newSelected.add(product._id);
        newQuantities[product._id] = 1;
      });
      setSelectedProducts(newSelected);
      setProductQuantities(newQuantities);
    }
  };

  const handleAddBulkToCart = async () => {
    if (selectedProducts.size === 0) {
      setError('Please select at least one product');
      return;
    }

    if (!selectedCentre) {
      setError('Please select a centre');
      return;
    }

    // Validate quantities
    let hasError = false;
    const newCartItems: CartItem[] = [];

    selectedProducts.forEach(productId => {
      const product = products.find(p => p._id === productId);
      const quantity = productQuantities[productId] || 1;

      if (quantity <= 0) {
        setError('All quantities must be at least 1');
        hasError = true;
        return;
      }

      if (quantity > (product?.stock || 0)) {
        setError(`${product?.name} only has ${product?.stock} items in stock`);
        hasError = true;
        return;
      }

      if (product) {
        const existingItem = cart.find(item => item._id === product._id);
        if (existingItem) {
          newCartItems.push({
            ...existingItem,
            quantity: existingItem.quantity + quantity,
            total: product.price * (existingItem.quantity + quantity),
          });
        } else {
          newCartItems.push({
            _id: product._id,
            product: product._id,
            name: product.name,
            price: product.price,
            quantity,
            total: product.price * quantity,
          });
        }
      }
    });

    if (hasError) return;

    // Merge with existing cart
    const updatedCart = [...cart];
    newCartItems.forEach(newItem => {
      const existingIndex = updatedCart.findIndex(item => item._id === newItem._id);
      if (existingIndex >= 0) {
        updatedCart[existingIndex] = newItem;
      } else {
        updatedCart.push(newItem);
      }
    });

    setCart(updatedCart);
    setSelectedProducts(new Set());
    setProductQuantities({});
    setShowBulkForm(false);
    setError('');
    alert(`${selectedProducts.size} product(s) added to cart!`);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      const product = products.find(p => p._id === productId);
      if (product && quantity > product.stock) {
        setError(`Only ${product.stock} items available`);
        return;
      }

      setCart(
        cart.map(item =>
          item._id === productId
            ? {
                ...item,
                quantity,
                total: item.price * quantity,
              }
            : item
        )
      );
      setError('');
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const handlePlaceOrder = async () => {
    if (!selectedCentre) {
      setError('Please select a centre');
      return;
    }

    if (cart.length === 0) {
      setError('Please add products to cart');
      return;
    }

    try {
      setPlacing(true);
      setError('');

      const orderPayload = {
        centreId: selectedCentre,
        products: cart.map(item => ({
          product: item.product,
          quantity: item.quantity,
        })),
        status: 'Pending',
      };

      console.log('Placing order with payload:', orderPayload);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/placeOrder1`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Order placement failed: ${res.status}`);
      }

      const result = await res.json();
      console.log('Order placed:', result);

      alert('✓ Order placed successfully!');

      // Reset form
      setCart([]);
      setSelectedCentre('');
      setExpandedProduct(null);

      // Navigate to orders page
      setTimeout(() => {
        router.push('/authenticated/orders');
      }, 500);
    } catch (err: any) {
      console.error('Order placement error:', err);
      setError(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  const selectedCentreName = centres.find(c => c._id === selectedCentre)?.name;

  // Filter centres based on search
  const filteredCentres = centres.filter(centre =>
    centre.name.toLowerCase().includes(centreSearch.toLowerCase()) ||
    centre.shortCode?.toLowerCase().includes(centreSearch.toLowerCase()) ||
    centre.branchName?.toLowerCase().includes(centreSearch.toLowerCase())
  );

  return (
    <div className="max-h-screen bg-white p-4">
      <div className="w-full max-w-8xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Place Order</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between bg-green-500 text-white p-3 rounded">
              <div>
                <h2 className="text-lg font-semibold">Products ({selectedProducts.size} selected)</h2>
              </div>
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-white text-green-500 font-semibold rounded text-sm hover:bg-gray-100"
              >
                {selectedProducts.size === products.length && products.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <input
                type='text'
                placeholder='search products...'
                value={productSearch}
                onChange={(e) => {setProductSearch(e.target.value)}}
                className='w-[25%] p-2 border border-gray-300 rounded text-sm placeholder-black text-black'
            />
            </div>
            
            {/* Products Grid */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No products available</p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded p-3 bg-white" style={{ height: '650px', overflowY: 'auto' }}>
                <div className="grid grid-cols-3 gap-3">
                  {filteredProducts.map(product => (
                    <div
                      key={product._id}
                      className={`border p-3 rounded ${
                        selectedProducts.has(product._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {/* Checkbox and Category */}
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product._id)}
                          onChange={() => handleToggleProductSelection(product._id)}
                          className="w-4 h-4"
                        />
                        {product.category && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {product.category}
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>

                      {/* Description */}
                      {product.description && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-1">{product.description}</p>
                      )}

                      {/* Price and Stock */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-blue-600">₹{product.price}</span>
                        <span className="text-xs text-gray-600">Stock: {product.stock}</span>
                      </div>

                      {/* Vendor */}
                      {product.vendor && (
                        <p className="text-xs text-gray-600 mb-2">By: {product.vendor.name}</p>
                      )}

                      {/* Quantity Input for Selected Products */}
                      {selectedProducts.has(product._id) && (
                        <div className="mt-2 pt-2 border-t">
                          <input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={productQuantities[product._id] || 1}
                            onChange={(e) =>
                              handleQuantityChangeForSelected(
                                product._id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full p-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white border border-gray-300 rounded sticky top-4">
              <div className="p-3 bg-green-500 text-white font-semibold rounded-t">
                Order Summary
              </div>

              <div className="p-3">
                {/* Centre Selection */}
                <div className="mb-3 pb-3 border-b">
                  <label className="text-xs font-semibold text-gray-600 block mb-2">
                    Select Centre
                  </label>
                  <input
                    type="text"
                    placeholder="Search centre..."
                    value={centreSearch}
                    onChange={(e) => setCentreSearch(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm mb-2 placeholder-black text-black"
                  />
                  <div className="border border-gray-300 rounded h-32 overflow-y-auto bg-white">
                    {centres.filter(centre =>
                      centre.name.toLowerCase().includes(centreSearch.toLowerCase()) ||
                      centre.shortCode?.toLowerCase().includes(centreSearch.toLowerCase())
                    ).length === 0 ? (
                      <div className="p-2 text-xs text-black text-center">No centres found</div>
                    ) : (
                      centres
                        .filter(centre =>
                          centre.name.toLowerCase().includes(centreSearch.toLowerCase()) ||
                          centre.shortCode?.toLowerCase().includes(centreSearch.toLowerCase())
                        )
                        .map(centre => (
                          <div
                            key={centre._id}
                            onClick={() => {
                              setSelectedCentre(centre._id);
                              setError('');
                            }}
                            className={`p-2 text-xs cursor-pointer border-b ${
                              selectedCentre === centre._id
                                ? 'bg-blue-100 text-blue-700 font-semibold'
                                : 'bg-white text-black hover:bg-gray-50'
                            }`}
                          >
                            {centre.name} {centre.shortCode && `(${centre.shortCode})`}
                          </div>
                        ))
                    )}
                  </div>
                  {selectedCentre && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ {centres.find(c => c._id === selectedCentre)?.name}
                    </p>
                  )}
                </div>

                {/* Add to Cart Button */}
                {selectedProducts.size > 0 && (
                  <button
                    onClick={handleAddBulkToCart}
                    disabled={!selectedCentre}
                    className="w-full py-2 bg-orange-500 text-white font-semibold rounded text-sm mb-2 hover:bg-orange-600 disabled:opacity-50"
                  >
                    Add {selectedProducts.size} to Cart
                  </button>
                )}

                {/* Cart Items */}
                <div className="mb-3 pb-3 border-b">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Cart ({cart.length})</p>
                  {cart.length === 0 ? (
                    <p className="text-xs text-black">Empty</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded">
                      {cart.map(item => (
                        <div key={item._id} className="bg-white-100 p-2 rounded text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-black">{item.name}</span>
                            <span className="font-bold text-black">₹{item.total.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(item._id, parseInt(e.target.value) || 1)
                              }
                              className="w-10 p-1 border border-gray-300 rounded text-black"
                            />
                            <button
                              onClick={() => handleRemoveFromCart(item._id)}
                              className="text-red-500 hover:text-red-700 ml-auto"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="mb-3 pb-3 border-b">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing || cart.length === 0 || !selectedCentre}
                  className="w-full py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                >
                  {placing ? 'Placing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function setExpandedProduct(arg0: null) {
    throw new Error('Function not implemented.');
}

