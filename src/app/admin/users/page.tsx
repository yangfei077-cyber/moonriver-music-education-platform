'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Phone, Calendar, Award, Shield, Edit, Trash2 } from 'lucide-react';

interface Auth0User {
  id: string;
  email: string;
  name: string;
  picture: string;
  createdAt: string;
  lastLogin: string;
  loginsCount: number;
  roles: string[];
}

export default function UserManagementPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<Auth0User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    // Check for mock authentication
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const email = urlParams.get('email');
    
    if (auth === 'success' && email) {
      setUser({ email, name: email.split('@')[0] });
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assignRole',
          userId,
          role,
        }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        setEditingUser(null);
      } else {
        console.error('Failed to assign role');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to access user management</div>;
  }

  // Mock role assignment based on email for demo
  let roles = [];
  if (user?.email === 'admin@moonriver.com') {
    roles = ['admin'];
  } else if (user?.email === 'educator@moonriver.com') {
    roles = ['educator'];
  } else if (user?.email === 'student@moonriver.com') {
    roles = ['student'];
  } else {
    roles = ['student']; // default role
  }
  const isAdmin = roles.includes('admin');

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 text-purple-600 mr-2" />
              User Management
            </h1>
            <button
              onClick={fetchUsers}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Refresh Users
            </button>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Logins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((authUser) => (
                    <tr key={authUser.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={authUser.picture || '/default-avatar.png'}
                            alt={authUser.name}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {authUser.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {authUser.id.split('|')[1]?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{authUser.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === authUser.id ? (
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="educator">Educator</option>
                            <option value="student">Student</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs ${
                            authUser.roles.includes('admin') ? 'bg-red-100 text-red-800' :
                            authUser.roles.includes('educator') ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {authUser.roles[0] || 'student'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {authUser.lastLogin ? new Date(authUser.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {authUser.loginsCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingUser === authUser.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => assignRole(authUser.id, selectedRole)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUser(authUser.id);
                              setSelectedRole(authUser.roles[0] || 'student');
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Users will appear here once they sign up.</p>
            </div>
          )}

          {/* Summary Stats */}
          {users.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{users.length}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {users.filter(u => u.roles.includes('admin')).length}
                  </div>
                  <div className="text-sm text-gray-600">Admins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {users.filter(u => u.roles.includes('educator')).length}
                  </div>
                  <div className="text-sm text-gray-600">Educators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.roles.includes('student')).length}
                  </div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
