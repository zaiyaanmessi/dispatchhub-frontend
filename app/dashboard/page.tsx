'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'field_worker': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigationItems = [
    { 
      name: 'Work Orders', 
      href: '/work-orders', 
      icon: '📋',
      description: 'View and manage work orders',
      roles: ['admin', 'manager', 'field_worker']
    },
    { 
      name: 'Team Members', 
      href: '/team', 
      icon: '👥',
      description: 'Manage team members and assignments',
      roles: ['admin', 'manager']
    },
    { 
      name: 'Live Tracking', 
      href: '/tracking', 
      icon: '📍',
      description: 'Real-time location tracking',
      roles: ['admin', 'manager']
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: '💬',
      description: 'Team communication',
      roles: ['admin', 'manager', 'field_worker']
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: '📊',
      description: 'Performance metrics and reports',
      roles: ['admin', 'manager']
    },
    { 
      name: 'My Performance', 
      href: '/performance', 
      icon: '⭐',
      description: 'View your ratings and feedback',
      roles: ['field_worker']
    },
  ];

  const visibleNavItems = navigationItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DispatchHub</h1>
              <p className="text-sm text-gray-500">Field Service Management</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name}! 👋
              </h2>
              <p className="text-gray-600 mb-4">
                Here's what's happening with your fleet today
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900 font-medium">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Role:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-6xl">
              {user.role === 'admin' ? '👨‍💼' : user.role === 'manager' ? '👔' : '🔧'}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Work Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
            <p className="text-green-600 text-sm mt-2">↑ 12% from last week</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Team Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">18</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <p className="text-blue-600 text-sm mt-2">3 online now</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">94%</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
            <p className="text-green-600 text-sm mt-2">↑ 3% from last month</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">2.4h</p>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
            <p className="text-orange-600 text-sm mt-2">↓ 0.3h improvement</p>
          </div>
        </div>

        {/* Navigation Grid */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.name}
                </h4>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
              <div className="text-2xl">✅</div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">Work Order Completed</p>
                <p className="text-gray-600 text-sm">Emergency repair at Downtown Office - Completed by John Smith</p>
                <p className="text-gray-500 text-xs mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
              <div className="text-2xl">📋</div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">New Work Order Created</p>
                <p className="text-gray-600 text-sm">HVAC maintenance scheduled for Warehouse B</p>
                <p className="text-gray-500 text-xs mt-1">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl">⭐</div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium">High Rating Received</p>
                <p className="text-gray-600 text-sm">Sarah Johnson received 5-star rating from client</p>
                <p className="text-gray-500 text-xs mt-1">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}