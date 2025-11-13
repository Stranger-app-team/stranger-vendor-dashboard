'use client';

import React, { useState, useEffect } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface ProductSales {
  productName: string;
  totalRevenue: number;
}

interface MonthSales {
  month: string;
  totalRevenue: number;
  orderCount: number;
}

interface Overview {
  totalRevenue: number;
  totalOrders: number;
}

interface Filter {
  from: string;
  to: string;
}

interface AnalyticsData {
  overview: Overview;
  productWiseSales: Array<{
    _id: string;
    productName?: string;
    totalRevenue: number;
  }>;
  monthWiseSales: Array<{
    month: string;
    totalRevenue: number;
    orderCount: number;
  }>;
  filter: Filter;
  success: boolean;
  message?: string;
}

const SalesAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<dayjs.Dayjs | null>(null);
  const [toDate, setToDate] = useState<dayjs.Dayjs | null>(null);

  const [data, setData] = useState<AnalyticsData>({
    overview: { totalRevenue: 0, totalOrders: 0 },
    productWiseSales: [],
    monthWiseSales: [],
    filter: { from: "N/A", to: "N/A" },
    success: false,
  });

  const fetchAnalytics = async (from = "", to = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.append("fromDate", from);
      if (to) params.append("toDate", to);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/sales-analytics?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch analytics");

      const result: AnalyticsData = await res.json();
      console.log("Fetched Analytics:", result);
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleApplyFilter = () => {
    const from = fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : "";
    const to = toDate ? dayjs(toDate).format("YYYY-MM-DD") : "";
    fetchAnalytics(from, to);
  };

  //Prepare Chart Data
  const productChartData = data.productWiseSales.map((p) => ({
    x: p.productName || `Product ${p._id}`,
    y: p.totalRevenue,
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-black">
          Sales Analytics Dashboard
        </h1>

        {/* Loading & Error */}
        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">Total Revenue</p>
            <h2 className="text-3xl text-black font-bold mb-2">
              ₹{data.overview.totalRevenue.toLocaleString()}
            </h2>
            <p className="text-sm text-gray-500">
              From {data.filter.from} to {data.filter.to}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 mb-2">Total Orders</p>
            <h2 className="text-3xl text-black font-bold mb-2">
              {data.overview.totalOrders}
            </h2>
            <p className="text-sm text-gray-500">
              Delivered Orders Only
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1">
          {/* Product-wise Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 text-black">
              Product-wise Sales (Revenue)
            </h3>
            {productChartData.length > 0 ? (
              <BarChart
                dataset={productChartData}
                xAxis={[{ scaleType: "band", dataKey: "x" }]}
                series={[
                  { dataKey: "y", label: "Revenue", color: "#1976d2" },
                ]}
                height={350}
                margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">
                No product sales data available
              </p>
            )}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default SalesAnalyticsDashboard;