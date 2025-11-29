'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

interface Location {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  };
  coordinates: [number, number];
  status: 'available' | 'on_job' | 'offline' | 'break';
  accuracy?: number;
  speed?: number;
  battery?: number;
  lastUpdated: string;
}

interface WorkOrder {
  _id: string;
  title: string;
  description: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  status: string;
  priority: string;
  assignedTo?: {
    _id: string;
    name: string;
  };
}

export default function TrackingPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (user.role === 'field_worker') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [user, token]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [locationsResponse, workOrdersResponse] = await Promise.all([
        fetch('http://localhost:5001/api/locations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5001/api/workorders?status=assigned&status=in_progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const locationsData = await locationsResponse.json();
      const workOrdersData = await workOrdersResponse.json();

      setLocations(locationsData);
      setWorkOrders(workOrdersData);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'on_job': return 'bg-blue-100 text-blue-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'break': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '✅';
      case 'on_job': return '🚀';
      case 'offline': return '⚫';
      case 'break': return '☕';
      default: return '❓';
    }
  };

  const filteredLocations = filterStatus === 'all'
    ? locations
    : locations.filter(loc => loc.status === filterStatus);

  const stats = {
    total: locations.length,
    available: locations.filter(l => l.status === 'available').length,
    onJob: locations.filter(l => l.status === 'on_job').length,
    offline: locations.filter(l => l.status === 'offline').length,
    break: locations.filter(l => l.status === 'break').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📍</div>
          <div className="text-xl text-gray-600">Loading tracking data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header - Fixed at top */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
            <p className="text-sm text-gray-600 mt-1">Real-time field worker locations</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Refresh Now
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Back
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-6 gap-3 mt-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600">Total</div>
            <div className="text-xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-gray-600">Available</div>
            <div className="text-xl font-bold text-green-600">{stats.available}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-gray-600">On Job</div>
            <div className="text-xl font-bold text-blue-600">{stats.onJob}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <div className="text-xs text-gray-600">Break</div>
            <div className="text-xl font-bold text-orange-600">{stats.break}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600">Offline</div>
            <div className="text-xl font-bold text-gray-600">{stats.offline}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-gray-600">Active Jobs</div>
            <div className="text-xl font-bold text-purple-600">{workOrders.length}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter by Status</h3>
            <div className="space-y-2">
              {[
                { key: 'all', label: 'All Workers', count: stats.total, color: 'gray' },
                { key: 'available', label: 'Available', count: stats.available, color: 'green' },
                { key: 'on_job', label: 'On Job', count: stats.onJob, color: 'blue' },
                { key: 'break', label: 'Break', count: stats.break, color: 'orange' },
                { key: 'offline', label: 'Offline', count: stats.offline, color: 'gray' }
              ].map(({ key, label, count, color }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    filterStatus === key
                      ? `bg-${color}-50 text-${color}-700 border border-${color}-200`
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  <span className="float-right text-gray-500">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Worker List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Field Workers</h3>
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No workers found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLocations.map(location => (
                  <button
                    key={location._id}
                    onClick={() => setSelectedLocation(location)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedLocation?._id === location._id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getStatusIcon(location.status)}</span>
                      <span className="font-medium text-gray-900 text-sm truncate">{location.user.name}</span>
                    </div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(location.status)}`}>
                      {location.status.replace('_', ' ').toUpperCase()}
                    </div>
                    {location.battery !== undefined && (
                      <div className="text-xs text-gray-500 mt-2">
                        🔋 {location.battery}%
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(location.lastUpdated).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 p-4">
            <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-full relative">
                {/* Map Legend */}
                <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Legend</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-gray-700">On Job</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-gray-700">Break</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                      <span className="text-gray-700">Work Orders</span>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <MapComponent
                  locations={filteredLocations}
                  workOrders={workOrders}
                  onMarkerClick={(loc) => setSelectedLocation(loc)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Details Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{getStatusIcon(selectedLocation.status)}</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedLocation.user.name}</h2>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLocation.status)} mt-1`}>
                    {selectedLocation.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase">Email</h3>
                <p className="text-sm text-gray-900 mt-1">{selectedLocation.user.email}</p>
              </div>

              {selectedLocation.user.phone && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase">Phone</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedLocation.user.phone}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {selectedLocation.battery !== undefined && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Battery</h3>
                    <p className="text-sm text-gray-900 mt-1">{selectedLocation.battery}%</p>
                  </div>
                )}
                {selectedLocation.speed !== undefined && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 uppercase">Speed</h3>
                    <p className="text-sm text-gray-900 mt-1">{Math.round(selectedLocation.speed * 3.6)} km/h</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase">Coordinates</h3>
                <p className="text-xs text-gray-900 mt-1 font-mono">
                  {selectedLocation.coordinates[1].toFixed(6)}, {selectedLocation.coordinates[0].toFixed(6)}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-medium text-gray-500 uppercase">Last Updated</h3>
                <p className="text-sm text-gray-900 mt-1">{new Date(selectedLocation.lastUpdated).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}