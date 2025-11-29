'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'field_worker';
  phone?: string;
  status?: string;
  createdAt: string;
}

export default function TeamPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  // Form state for adding new member
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'field_worker',
    phone: ''
  });

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }
    
    // Only admins and managers can access this page
    if (user.role === 'field_worker') {
      router.push('/dashboard');
      return;
    }
    
    fetchTeamMembers();
  }, [user, token]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('https://dispatchhub-backend.onrender.com/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      alert('Name, email, and password are required');
      return;
    }

    try {
      const response = await fetch('https://dispatchhub-backend.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Team member added successfully!');
        setShowAddModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'field_worker',
          phone: ''
        });
        fetchTeamMembers();
      } else {
        alert(`Error: ${data.message || 'Failed to add team member'}`);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member. Check console for details.');
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`https://dispatchhub-backend.onrender.com/api/users/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert(`${memberName} has been removed from the team.`);
        fetchTeamMembers(); // Refresh the list
      } else {
        alert(`Error: ${data.message || 'Failed to remove team member'}`);
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Failed to remove team member. Check console for details.');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'field_worker': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👨‍💼';
      case 'manager': return '👔';
      case 'field_worker': return '🔧';
      default: return '👤';
    }
  };

  const filteredMembers = filterRole === 'all' 
    ? teamMembers 
    : teamMembers.filter(member => member.role === filterRole);

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
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-1">Manage your team members and roles</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Team Member
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{teamMembers.length}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {teamMembers.filter(m => m.role === 'admin').length}
                </p>
              </div>
              <div className="text-4xl">👨‍💼</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Managers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {teamMembers.filter(m => m.role === 'manager').length}
                </p>
              </div>
              <div className="text-4xl">👔</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Field Workers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {teamMembers.filter(m => m.role === 'field_worker').length}
                </p>
              </div>
              <div className="text-4xl">🔧</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-lg ${filterRole === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All ({teamMembers.length})
            </button>
            <button
              onClick={() => setFilterRole('admin')}
              className={`px-4 py-2 rounded-lg ${filterRole === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Admins ({teamMembers.filter(m => m.role === 'admin').length})
            </button>
            <button
              onClick={() => setFilterRole('manager')}
              className={`px-4 py-2 rounded-lg ${filterRole === 'manager' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Managers ({teamMembers.filter(m => m.role === 'manager').length})
            </button>
            <button
              onClick={() => setFilterRole('field_worker')}
              className={`px-4 py-2 rounded-lg ${filterRole === 'field_worker' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Field Workers ({teamMembers.filter(m => m.role === 'field_worker').length})
            </button>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div key={member._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{getRoleIcon(member.role)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                      {member.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📧</span>
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📱</span>
                    <span>{member.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📅</span>
                  <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => setSelectedMember(member)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  View Details
                </button>
                {user?.role === 'admin' && member._id !== user._id && (
                  <button
                    onClick={() => handleDeleteMember(member._id, member.name)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">No team members found</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="john@fleetsync.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="555-123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  >
                    <option value="field_worker">Field Worker</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-6xl">{getRoleIcon(selectedMember.role)}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name}</h2>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(selectedMember.role)}`}>
                  {selectedMember.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="text-gray-900 mt-1">{selectedMember.email}</p>
                </div>
                {selectedMember.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="text-gray-900 mt-1">{selectedMember.phone}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                <p className="text-gray-900 mt-1">{new Date(selectedMember.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {/* Performance Stats Placeholder */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">24</p>
                    <p className="text-sm text-gray-600">Completed Jobs</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">4.8</p>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">95%</p>
                    <p className="text-sm text-gray-600">On-Time Rate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedMember(null)}
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