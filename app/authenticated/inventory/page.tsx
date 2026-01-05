"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Search, Package } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  createdBy: {
    _id: string;
    name: string;
    loginId: string;
  };
  vendor?: {
    _id: string;
    name: string;
    mobileNumber: string;
    userId: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VendorData {
  _id: string;
  name: string;
  userId: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Stock ledger state
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockLedger, setStockLedger] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setVendor(userData);
      } catch (error) {
        console.error("Error parsing vendor data:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (vendor?._id) {
      fetchProducts();
    }
  }, [vendor]);

  // GET /api/products/vendor/:vendorId - Fetch products by vendor
  const fetchProducts = async () => {
    if (!vendor?._id) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/vendor/${vendor._id}`
      );
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // GET /api/products/:productId/stock-ledger - Fetch stock ledger
  const fetchStockLedger = async (productId: string, page: number = 1) => {
    setLedgerLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}/stock-ledger?page=${page}&limit=20`
      );
      const data = await res.json();
      console.log("Stock ledger data:", data);
      setStockLedger(data.ledger || []);
      setLedgerPage(data.pagination?.page || 1);
      setLedgerTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch stock ledger:", err);
      setStockLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setShowLedgerModal(true);
    fetchStockLedger(product._id);
  };

  const closeLedgerModal = () => {
    setShowLedgerModal(false);
    setSelectedProduct(null);
    setStockLedger([]);
    setLedgerPage(1);
  };

  const handleLedgerPageChange = (newPage: number) => {
    if (selectedProduct && newPage >= 1 && newPage <= ledgerTotalPages) {
      fetchStockLedger(selectedProduct._id, newPage);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      stock: product.stock.toString(),
    });
    setImagePreview(product.image || null);
    setImageFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // PUT /api/products/:id - Edit/update product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("stock", formData.stock);

      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${editingProduct._id}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      if (res.ok) {
        await fetchProducts();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to update product");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  // DELETE /api/products/:id - Delete product
  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setDeleting(productId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        await fetchProducts();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage your products ({products.length} items)
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-64"
          />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">
            {searchQuery ? "Try a different search term" : "No products in your inventory"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product._id} 
                    onClick={() => handleRowClick(product)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {/* Product Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">
                            {product.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {product.category || "Uncategorized"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-teal-600">₹{product.price}</span>
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          product.stock > 10
                            ? "text-green-600"
                            : product.stock > 0
                            ? "text-yellow-500"
                            : "text-red-600"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(product);
                          }}
                          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product._id);
                          }}
                          disabled={deleting === product._id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === product._id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Edit Product</h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="Enter product description"
                />
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter category"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    "Update Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Ledger Modal */}
      {showLedgerModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Stock Ledger</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedProduct.name} - Current Stock: <span className="font-semibold text-teal-600">{selectedProduct.stock}</span>
                </p>
              </div>
              <button
                onClick={closeLedgerModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {ledgerLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : stockLedger.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Package className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No stock history found</p>
                  <p className="text-sm">This product has no stock transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stockLedger.map((entry: any, index: number) => (
                    <div
                      key={entry._id || index}
                      className="bg-white rounded-lg p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        borderLeftColor: entry.direction === 'IN' ? '#10b981' : '#ef4444'
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Section - Main Info */}
                        <div className="flex-1 space-y-3">
                          {/* Direction & Reason Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              entry.direction === 'IN' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {entry.direction === 'IN' ? '↗ STOCK IN' : '↘ STOCK OUT'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {entry.reason?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                          </div>

                          {/* Quantity Change */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm text-gray-600">Quantity:</span>
                            <span className={`text-2xl font-bold ${
                              entry.direction === 'IN' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {entry.direction === 'IN' ? '+' : '-'}{entry.quantity || 0}
                            </span>
                          </div>

                          {/* Balance Info */}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Balance After:</span>
                              <span className="font-semibold text-gray-900 text-base">
                                {entry.balanceAfter || 0}
                              </span>
                            </div>
                            {entry.balanceAfter !== undefined && entry.quantity && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Balance Before:</span>
                                <span className="font-medium text-gray-700">
                                  {entry.direction === 'IN' 
                                    ? (entry.balanceAfter - entry.quantity) 
                                    : (entry.balanceAfter + entry.quantity)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Remarks */}
                          {entry.remarks && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-gray-700">Note:</span> {entry.remarks}
                              </p>
                            </div>
                          )}

                          {/* Reference Info */}
                          {entry.referenceType && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium">Type:</span>
                              <span className="px-2 py-0.5 bg-gray-50 rounded border border-gray-200">
                                {entry.referenceType}
                              </span>
                              {entry.referenceId && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{entry.referenceId.slice(-8)}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Section - Timestamp */}
                        <div className="text-right space-y-1 flex-shrink-0">
                          <div className="text-xs font-medium text-gray-700">
                            {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!ledgerLoading && stockLedger.length > 0 && (
              <div className="border-t bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Page <span className="font-semibold text-gray-800">{ledgerPage}</span> of <span className="font-semibold text-gray-800">{ledgerTotalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLedgerPageChange(ledgerPage - 1)}
                      disabled={ledgerPage === 1}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => handleLedgerPageChange(ledgerPage + 1)}
                      disabled={ledgerPage === ledgerTotalPages}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
