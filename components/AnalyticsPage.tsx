'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Stats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  totalWorkers: number;
  activeWorkers: number;
  completionRate: string;
  totalRevenue: number;
}

interface TopWorker {
  _id: string;
  name: string;
  email: string;
  completedJobs: number;
}

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topWorkers, setTopWorkers] = useState<TopWorker[]>([]);
  const [revenueTimeline, setRevenueTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (user.role === 'field_worker') {
      router.push('/dashboard');
      return;
    }

    fetchAnalytics();
  }, [user, token]);

  const fetchAnalytics = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, timelineRes, priorityRes, statusRes, workersRes, revenueRes] = await Promise.all([
        fetch('http://localhost:5001/api/analytics/stats', { headers }),
        fetch('http://localhost:5001/api/analytics/orders-timeline', { headers }),
        fetch('http://localhost:5001/api/analytics/orders-by-priority', { headers }),
        fetch('http://localhost:5001/api/analytics/orders-by-status', { headers }),
        fetch('http://localhost:5001/api/analytics/top-workers', { headers }),
        fetch('http://localhost:5001/api/analytics/revenue-timeline', { headers })
      ]);

      setStats(await statsRes.json());
      
      const timelineData = await timelineRes.json();
      setTimeline(timelineData.map((d: any) => ({
        date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: d.completed,
        pending: d.pending,
        inProgress: d.inProgress,
        total: d.total
      })));

      const priority = await priorityRes.json();
      setPriorityData(priority.map((d: any) => ({
        name: d._id.charAt(0).toUpperCase() + d._id.slice(1),
        value: d.count
      })));

      const status = await statusRes.json();
      setStatusData(status.map((d: any) => ({
        name: d._id.replace('_', ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: d.count
      })));

      setTopWorkers(await workersRes.json());

      const revenue = await revenueRes.json();
      setRevenueTimeline(revenue.map((d: any) => ({
        date: new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: d.revenue,
        jobs: d.jobs
      })));

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    status: ['#10b981', '#3b82f6', '#f59e0b', '#6b7280', '#ef4444']
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-xl text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Performance metrics and insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Total Orders</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
              <div className="text-sm text-blue-600 mt-2">All time</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Completed</div>
              <div className="text-3xl font-bold text-gray-900">{stats.completedOrders}</div>
              <div className="text-sm text-green-600 mt-2">{stats.completionRate}% completion rate</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600 mb-1">Active Workers</div>
              <div className="text-3xl font-bold text-gray-900">{stats.activeWorkers}/{stats.totalWorkers}</div>
              <div className="text-sm text-purple-600 mt-2">Currently active</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
              <div className="text-sm text-gray-600 mb-1">Revenue</div>
              <div className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-yellow-600 mt-2">Total earnings</div>
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Orders Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Orders Timeline (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                <Line type="monotone" dataKey="inProgress" stroke="#3b82f6" strokeWidth={2} name="In Progress" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by Priority */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const percent = entry.percent || 0;
                    return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Orders by Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Timeline (30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performing Workers</h3>
          {topWorkers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No completed work orders yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topWorkers.map((worker, index) => (
                <div key={worker._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{worker.name}</div>
                      <div className="text-sm text-gray-500">{worker.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Completed Jobs</span>
                    <span className="text-lg font-bold text-blue-600">{worker.completedJobs}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}