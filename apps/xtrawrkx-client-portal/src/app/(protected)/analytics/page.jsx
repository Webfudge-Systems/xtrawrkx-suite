"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Eye,
} from "lucide-react";
import { StatsCard } from "@/components/dashboard";

const analyticsData = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+12%",
    changeType: "increase",
    icon: DollarSign,
    color: "green",
  },
  {
    title: "Active Users",
    value: "2,834",
    change: "+8%",
    changeType: "increase",
    icon: Users,
    color: "blue",
  },
  {
    title: "Page Views",
    value: "12,456",
    change: "+23%",
    changeType: "increase",
    icon: Eye,
    color: "purple",
  },
  {
    title: "Conversion Rate",
    value: "3.2%",
    change: "-2%",
    changeType: "decrease",
    icon: TrendingUp,
    color: "orange",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Track your performance and insights</p>
          </div>
        </div>
      </motion.div>

      {/* Analytics Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {analyticsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              change={stat.change}
              changeType={stat.changeType}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics Content Placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Analytics Dashboard
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Comprehensive analytics and reporting features will be available
            here. Track performance, user engagement, and business metrics.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Real-time data</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>Growth tracking</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <BarChart3 className="h-4 w-4" />
              <span>Custom reports</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


