import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import { Edit, Trash2, Shield, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type UserRole = 'user' | 'admin';

interface DbUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole | null;
  created_at: string | null;
}

const AdminPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const PAGE_SIZE = 10;

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get count first to calculate pagination
        const countQuery = supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        // Apply role filter if selected
        if (selectedRole) {
          countQuery.eq('role', selectedRole);
        }
        
        // Apply search filter if present
        if (searchTerm) {
          countQuery.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
        }
        
        const { count, error: countError } = await countQuery;
        
        if (countError) throw countError;
        
        // Calculate total pages
        setTotalPages(Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)));
        
        // Build the actual query for this page
        let query = supabase
          .from('users')
          .select('*')
          .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)
          .order('created_at', { ascending: false });
        
        // Apply role filter if selected
        if (selectedRole) {
          query = query.eq('role', selectedRole);
        }
        
        // Apply search filter if present
        if (searchTerm) {
          query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setUsers(data as DbUser[]);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, searchTerm, selectedRole]);

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setError(null);
      // Don't allow changing your own role
      if (userId === user?.id) {
        setError("You cannot change your own role");
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      setEditingUser(null);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role');
    }
  };

  const filteredUsers = users;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivory-50 mb-1 font-display">Admin Dashboard</h1>
        <p className="text-ivory-400">Manage users and system settings</p>
      </div>

      {user?.role !== 'admin' && (
        <div className="bg-gold-900/20 border border-gold-700/50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-gold-500" />
            <div>
              <h3 className="text-gold-500 font-medium text-lg">Admin Access Required</h3>
              <p className="text-gold-400">You need admin privileges to view this page.</p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="bg-onyx-900 border border-onyx-800 rounded-lg shadow-glass mb-6">
          <div className="px-6 py-4 border-b border-onyx-800 flex justify-between items-center">
            <h2 className="text-lg font-medium text-ivory-50 font-display">User Management</h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ivory-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 bg-onyx-800 border border-onyx-700 rounded-md text-ivory-200 text-sm focus:ring-1 focus:ring-gold-500 focus:border-gold-500 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-ivory-400 hover:text-ivory-200" />
                  </button>
                )}
              </div>
              <div>
                <select
                  className="bg-onyx-800 border border-onyx-700 rounded-md text-ivory-200 text-sm p-2 focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(e.target.value ? e.target.value as UserRole : null)}
                >
                  <option value="">All Roles</option>
                  <option value="user">Users</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="m-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-500">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-ivory-400 text-sm">
                  <th className="px-6 py-3 border-b border-onyx-800">Name</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Email</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Role</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Created</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-ivory-400">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-ivory-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userItem) => (
                    <tr key={userItem.id} className="border-b border-onyx-800">
                      <td className="px-6 py-4 text-ivory-200">{userItem.name || 'No name'}</td>
                      <td className="px-6 py-4 text-ivory-200">{userItem.email}</td>
                      <td className="px-6 py-4">
                        {editingUser?.id === userItem.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              className="bg-onyx-800 border border-onyx-700 rounded-md text-ivory-200 text-sm p-1 focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                              value={editingUser.role || ''}
                              onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleUpdateUserRole(userItem.id, editingUser.role || 'user')}
                            >
                              Save
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingUser(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            userItem.role === 'admin' 
                              ? 'bg-red-900/20 text-red-500' 
                              : 'bg-green-900/20 text-green-500'
                          }`}>
                            {userItem.role || 'user'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-ivory-400 text-sm">
                        {userItem.created_at 
                          ? new Date(userItem.created_at).toLocaleDateString() 
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {userItem.id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(userItem)}
                              leftIcon={<Edit className="h-4 w-4" />}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-onyx-800 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              <span className="text-ivory-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                leftIcon={<ChevronRight className="h-4 w-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage; 