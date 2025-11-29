'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface WorkOrder {
  _id: string;
  title: string;
  description: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  location: {
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    coordinates: number[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  scheduledDate?: string;
  estimatedDuration: number;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function WorkOrdersPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [fieldWorkers, setFieldWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state for creating work order
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    priority: 'medium',
    assignedTo: '',
    scheduledDate: '',
    estimatedDuration: '60'
  });

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    fetchWorkOrders();
    if (user.role !== 'field_worker') {
      fetchFieldWorkers();
    }
  }, [user, token]);

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch('https://dispatchhub-backend.onrender.com/api/workorders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setWorkOrders(data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldWorkers = async () => {
    try {
      const response = await fetch('https://dispatchhub-backend.onrender.com/api/users?role=field_worker', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setFieldWorkers(data);
    } catch (error) {
      console.error('Error fetching field workers:', error);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customerName || !formData.customerPhone) {
      alert('Customer name and phone are required');
      return;
    }
    
    if (!formData.latitude || !formData.longitude) {
      alert('Latitude and longitude are required');
      return;
    }
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        customer: {
          name: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail || undefined
        },
        location: {
          type: 'Point',
          address: formData.address,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zipCode: formData.zipCode || undefined,
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        },
        priority: formData.priority,
        assignedTo: formData.assignedTo || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        estimatedDuration: parseInt(formData.estimatedDuration) || 60
      };

      console.log('Sending payload:', payload); // Debug log

      const response = await fetch('https://dispatchhub-backend.onrender.com/api/workorders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Work order created successfully!');
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          latitude: '',
          longitude: '',
          priority: 'medium',
          assignedTo: '',
          scheduledDate: '',
          estimatedDuration: '60'
        });
        fetchWorkOrders();
      } else {
        alert(`Error: ${data.message || 'Failed to create work order'}`);
        console.error('Server error:', data);
      }
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Failed to create work order. Check console for details.');
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`https://dispatchhub-backend.onrender.com/api/workorders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchWorkOrders();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? workOrders 
    : workOrders.filter(order => order.status === filterStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-gray-600 mt-1">Manage and track all work orders</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            {user?.role !== 'field_worker' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Create Work Order
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All ({workOrders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('assigned')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Assigned
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg ${filterStatus === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Work Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.title}</div>
                    <div className="text-sm text-gray-500">{order.description.substring(0, 40)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customer.name}</div>
                    <div className="text-sm text-gray-500">{order.customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.location.city}, {order.location.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : 'Not scheduled'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900 whitespace-nowrap"
                      >
                        View
                      </button>
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-700"
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No work orders found
            </div>
          )}
        </div>
      </div>

      {/* Create Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Work Order</h2>
            <form onSubmit={handleCreateWorkOrder}>
              <div className="space-y-6">
                {/* Job Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority *
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.estimatedDuration}
                          onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zip Code
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={formData.latitude}
                          onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          placeholder="42.3601"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude *
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={formData.longitude}
                          onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                          placeholder="-71.0589"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment & Schedule */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment & Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign To
                      </label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      >
                        <option value="">Unassigned</option>
                        {fieldWorkers.map((worker) => (
                          <option key={worker._id} value={worker._id}>
                            {worker.name} ({worker.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheduled Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Work Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedOrder.title}</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="text-gray-900 mt-1">{selectedOrder.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getPriorityColor(selectedOrder.priority)}`}>
                    {selectedOrder.priority}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer</h3>
                <p className="text-gray-900">{selectedOrder.customer.name}</p>
                <p className="text-gray-600">{selectedOrder.customer.phone}</p>
                {selectedOrder.customer.email && (
                  <p className="text-gray-600">{selectedOrder.customer.email}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-900">{selectedOrder.location.address}</p>
                <p className="text-gray-600">
                  {selectedOrder.location.city}, {selectedOrder.location.state} {selectedOrder.location.zipCode}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Coordinates: {selectedOrder.location.coordinates[1]}, {selectedOrder.location.coordinates[0]}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                  <p className="text-gray-900 mt-1">{selectedOrder.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                  <p className="text-gray-900 mt-1">{selectedOrder.createdBy.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Scheduled Date</h3>
                  <p className="text-gray-900 mt-1">
                    {selectedOrder.scheduledDate 
                      ? new Date(selectedOrder.scheduledDate).toLocaleString()
                      : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Estimated Duration</h3>
                  <p className="text-gray-900 mt-1">{selectedOrder.estimatedDuration} minutes</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="text-gray-900 mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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