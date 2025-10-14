'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Check, Loader2 } from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  tags: string[];
  vendorId: string;
}

const ProductDetailsForm: React.FC = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    tags: [],
    vendorId: '',
  });

  const [newTag, setNewTag] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchHopUserById = async (userId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hop-user/${userId}`);
      if (!res.ok) {
        throw new Error(`Error fetching user: ${res.statusText}`);
      }
      const user = await res.json();
      console.log('HopUser details:', user);
      return user;
    } catch (error) {
      console.error('Failed to fetch HopUser:', error);
      return null;
    }
  };

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        console.log('User data found in localStorage:', userData);

        if (userData?._id) {
        console.log('User is logged in with vendorId:', userData._id);
      } else {
        console.warn('User is logged in, but vendorId (_id) is missing!');
      }
        setCurrentUser(userData);
        setFormData(prev => ({
          ...prev,
          vendorId: userData?._id || '', // Set vendorId from logged-in user
        }));
        const userId = userData?._id;
        if (userId) {
            
          fetchHopUserById(userId);
        } else {
          console.warn('User ID not found in userData');
        }
      } catch (error) {
        console.error('Failed to parse userData from localStorage:', error);
      }
    } else {
      console.warn('userData not found in localStorage');
      setMessage({ type: 'error', text: 'Please log in to create a product' });
    }
  }, []);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagAdd = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.price || !formData.category || !formData.stock|| !formData.vendorId) {
        throw new Error('Please fill in all required fields');
      }

      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('category', formData.category);
      submitData.append('stock', formData.stock);
      submitData.append('vendor', formData.vendorId);
      
      // Add tags as a JSON string or comma-separated values
      if (formData.tags.length > 0) {
        submitData.append('tags', JSON.stringify(formData.tags));
      }

      // Add image if selected
      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      // Add a dummy createdBy for now (you'll need to get this from your auth context)
      submitData.append('createdBy',currentUser?._id || formData.vendorId);
          console.log('Submitting data:', Object.fromEntries(submitData)); // Debug log


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/`, {
        method: 'POST',
        body: submitData,
        // Don't set Content-Type header - let the browser set it with boundary for FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      const result = await response.json();
         console.log('Product created:', result);
      
      setMessage({ type: 'success', text: 'Product created successfully!' });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        tags: [],
        vendorId: currentUser?._id || '',
      });
      setSelectedImage(null);
      setImagePreview('');
      setNewTag('');

    } catch (error) {
      console.error('Error creating product:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create product' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      tags: [],
      vendorId: currentUser?._id || '',
    });
    setSelectedImage(null);
    setImagePreview('');
    setNewTag('');
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto">

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Main Form Container */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border-2 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6 text-black">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter product description..."
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Price and Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 min-h-[100px]">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-800 text-white"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag)}
                            className="ml-2 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                        placeholder="Add new tag"
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleTagAdd}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div className="space-y-6">
                {/* Main Product Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="w-full h-64 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Product Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-gray-500">Product Image Preview</div>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Product Image</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-sm text-gray-600 mb-2">
                        Drop your image here, or browse
                      </div>
                      <div className="text-xs text-gray-500 mb-4">
                        jpeg, png are allowed
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Browse Files
                      </label>
                    </div>
                  </div>

                  {/* Selected File Display */}
                  {selectedImage && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded mr-3 flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                          <span className="text-sm text-gray-700">{selectedImage.name}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div className="bg-green-500 h-2 rounded-full w-full"></div>
                          </div>
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="animate-spin" size={16} />}
                {isLoading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductDetailsForm;