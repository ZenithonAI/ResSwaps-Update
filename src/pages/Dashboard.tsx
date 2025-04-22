import { useState, useEffect } from 'react';
import { useReservations, Reservation } from '../context/ReservationContext';
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import { Plus, Edit2, X, ChevronUp, ChevronDown, TrendingUp, BarChart, LineChart, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

type DashboardTab = 'listings' | 'analytics';
type TimeFrame = 'day' | 'week' | 'month' | 'year';

const Dashboard = () => {
  const { userReservations, addReservation, updateReservation, deleteReservation, isLoading } = useReservations();
  const { user, isAuthenticated } = useUser();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('listings');
  const [timeframe, setTimeframe] = useState<TimeFrame>('month');
  
  const defaultForm = {
    restaurantName: '',
    location: '',
    cuisine: '',
    date: '',
    time: '',
    partySize: 2,
    price: 0,
    originalPrice: 0,
    description: '',
    imageUrl: '',
    allowBidding: false,
    minimumBid: 0,
  };
  
  const [formData, setFormData] = useState(defaultForm);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const input = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: input.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'partySize' || name === 'price' || name === 'originalPrice' || name === 'minimumBid'
          ? Number(value)
          : value,
      });
    }
  };

  const handleOpenForm = (reservation?: Reservation) => {
    if (reservation && reservation.id) {
      setIsEditMode(true);
      setCurrentId(reservation.id);
      setFormData({
        restaurantName: reservation.restaurantName,
        location: reservation.location,
        cuisine: reservation.cuisine,
        date: reservation.date.toISOString().split('T')[0], // Format date for input
        time: reservation.time,
        partySize: reservation.partySize,
        price: reservation.price,
        originalPrice: reservation.originalPrice,
        description: reservation.description || '',
        imageUrl: reservation.imageUrl || '',
        allowBidding: reservation.allowBidding ?? false,
        minimumBid: reservation.minimumBid || 0,
      });
    } else {
      setIsEditMode(false);
      setCurrentId('');
      setFormData(defaultForm);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');
    
    try {
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }

      // Validate required fields
      if (!formData.restaurantName || !formData.location || !formData.date || !formData.time || formData.partySize <= 0 || formData.price <= 0) {
        throw new Error('Please fill in all required fields');
      }
      
      const submissionData = {
        ...formData,
        date: new Date(formData.date), // Convert date string to Date object
      };

      if (isEditMode) {
        await updateReservation(currentId, submissionData);
        setFormSuccess('Listing updated successfully!');
      } else {
        await addReservation(submissionData);
        setFormSuccess('Listing created successfully!');
      }
      handleCloseForm();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    setIsSubmitting(true); // Use submitting state for delete as well
    setFormError(''); // Clear errors
    try {
      await deleteReservation(id);
      // Optional: Show success message or just let the list re-render
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Analytics Data Generation (Mock) ---
  const generateMockData = () => {
    const cuisineData = [
      { name: 'French', avgPrice: 220, count: 24 },
      { name: 'Italian', avgPrice: 180, count: 18 },
      { name: 'Japanese', avgPrice: 250, count: 12 },
      { name: 'Spanish', avgPrice: 160, count: 15 },
      { name: 'British', avgPrice: 140, count: 9 },
      { name: 'Nordic', avgPrice: 290, count: 7 },
    ];
    const trendData = [
      { name: 'Jan', avgPrice: 150 }, { name: 'Feb', avgPrice: 170 }, { name: 'Mar', avgPrice: 180 },
      { name: 'Apr', avgPrice: 190 }, { name: 'May', avgPrice: 210 }, { name: 'Jun', avgPrice: 230 },
      { name: 'Jul', avgPrice: 250 }, { name: 'Aug', avgPrice: 270 }, { name: 'Sep', avgPrice: 240 },
      { name: 'Oct', avgPrice: 220 }, { name: 'Nov', avgPrice: 200 }, { name: 'Dec', avgPrice: 190 },
    ];
    const demandData = [
      { name: 'Mon', demand: 30 }, { name: 'Tue', demand: 40 }, { name: 'Wed', demand: 45 },
      { name: 'Thu', demand: 60 }, { name: 'Fri', demand: 90 }, { name: 'Sat', demand: 100 },
      { name: 'Sun', demand: 70 },
    ];
    const statusData = [
      { name: 'Available', value: userReservations.filter(r => r.status === 'available').length || 65 },
      { name: 'Sold', value: userReservations.filter(r => r.status === 'sold').length || 25 },
      { name: 'Pending', value: userReservations.filter(r => r.status === 'pending').length || 10 },
    ];
    return { cuisineData, trendData, demandData, statusData };
  };
  const { cuisineData, trendData, demandData, statusData } = generateMockData();
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  // --- End Analytics Data ---

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ivory-50 mb-1 font-display">Your Dashboard</h1>
            <p className="text-ivory-400">Manage your restaurant reservations and view analytics</p>
          </div>
        </div>
        
        <motion.div 
          className="bg-onyx-900 border border-onyx-800 p-8 rounded-lg shadow-glass text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-medium text-ivory-100 mb-4 font-display">Sign in to access your dashboard</h2>
          <p className="text-ivory-400 max-w-md mx-auto mb-6">
            You need to sign in to manage your restaurant reservations and track your sales.
          </p>
          <Link to="/auth">
            <Button variant="gold">
              Sign in
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ivory-50 mb-1 font-display">Your Dashboard</h1>
          <p className="text-ivory-400">Manage your restaurant reservations and view analytics</p>
        </div>
        {activeTab === 'listings' && (
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            className="mt-4 md:mt-0"
            onClick={() => handleOpenForm()}
          >
            Create Listing
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-onyx-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('listings')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'listings'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-ivory-500 hover:text-ivory-300 hover:border-ivory-700'
            }`}
          >
            My Listings ({userReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'analytics'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-ivory-500 hover:text-ivory-300 hover:border-ivory-700'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Active Listings</h3>
              <p className="text-3xl font-bold text-ivory-50">
                {isLoading ? (
                  <span className="inline-block w-12 h-8 bg-onyx-800/50 rounded animate-pulse"></span>
                ) : (
                  userReservations.filter(r => r.status === 'available').length
                )}
              </p>
            </div>
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Sold Reservations</h3>
              <p className="text-3xl font-bold text-ivory-50">
                {isLoading ? (
                  <span className="inline-block w-12 h-8 bg-onyx-800/50 rounded animate-pulse"></span>
                ) : (
                  userReservations.filter(r => r.status === 'sold').length
                )}
              </p>
            </div>
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-ivory-50">
                {isLoading ? (
                  <span className="inline-block w-24 h-8 bg-onyx-800/50 rounded animate-pulse"></span>
                ) : (
                  `€${userReservations
                    .filter(r => r.status === 'sold')
                    .reduce((sum, r) => sum + r.price, 0)}`
                )}
              </p>
            </div>
          </div>

          {/* Listings Table */}
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg shadow-glass overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-ivory-400 text-sm">
                  <th className="px-6 py-3 border-b border-onyx-800">Restaurant</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Date & Time</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Party Size</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Price</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Status</th>
                  <th className="px-6 py-3 border-b border-onyx-800">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-onyx-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-ivory-400">
                      Loading listings...
                    </td>
                  </tr>
                ) : userReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-ivory-400">
                      You haven't created any listings yet.
                    </td>
                  </tr>
                ) : (
                  userReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-onyx-800/30 transition-colors duration-150">
                      <td className="px-6 py-4 text-ivory-200 font-medium">{res.restaurantName}</td>
                      <td className="px-6 py-4 text-ivory-300">{new Date(res.date).toLocaleDateString()} at {res.time}</td>
                      <td className="px-6 py-4 text-ivory-300">{res.partySize}</td>
                      <td className="px-6 py-4 text-ivory-300">€{res.price}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          res.status === 'available' ? 'bg-green-900/20 text-green-500' : 
                          res.status === 'sold' ? 'bg-red-900/20 text-red-500' : 
                          'bg-yellow-900/20 text-yellow-500'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenForm(res)}
                            leftIcon={<Edit2 className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteListing(res.id)}
                            disabled={isSubmitting}
                            leftIcon={<X className="h-4 w-4" />}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Timeframe selector for analytics */}
          <div className="mb-4 flex justify-end space-x-2">
            <Button
              variant={timeframe === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('day')}
            >
              Day
            </Button>
            <Button
              variant={timeframe === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('week')}
            >
              Week
            </Button>
            <Button
              variant={timeframe === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('month')}
            >
              Month
            </Button>
            <Button
              variant={timeframe === 'year' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('year')}
            >
              Year
            </Button>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Average Sale Price</h3>
              <p className="text-3xl font-bold text-ivory-50">€210</p>
              <p className="text-sm text-green-500 mt-1 flex items-center"><TrendingUp className="h-4 w-4 mr-1"/> 12% from last month</p>
            </div>
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Total Listings</h3>
              <p className="text-3xl font-bold text-ivory-50">{userReservations.length}</p>
              <p className="text-sm text-green-500 mt-1 flex items-center"><TrendingUp className="h-4 w-4 mr-1"/> 8% from last month</p>
            </div>
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Sales Conversion Rate</h3>
              <p className="text-3xl font-bold text-ivory-50">68%</p>
              <p className="text-sm text-green-500 mt-1 flex items-center"><TrendingUp className="h-4 w-4 mr-1"/> 5% from last month</p>
            </div>
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-ivory-400 text-sm font-medium mb-1">Avg. Time to Sell</h3>
              <p className="text-3xl font-bold text-ivory-50">2.4 days</p>
              <p className="text-sm text-green-500 mt-1 flex items-center"><TrendingUp className="h-4 w-4 mr-1"/> -0.2 days</p> { /* Example */ }
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-lg font-medium text-ivory-100 mb-4 font-display">Reservation Demand by Day</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={demandData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} itemStyle={{ color: '#D1D5DB' }} labelStyle={{ color: '#F9FAFB' }} />
                    <Legend wrapperStyle={{ color: '#D1D5DB' }}/>
                    <Bar dataKey="demand" fill="#FBBF24" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-lg font-medium text-ivory-100 mb-4 font-display">Average Price Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} itemStyle={{ color: '#D1D5DB' }} labelStyle={{ color: '#F9FAFB' }} />
                    <Legend wrapperStyle={{ color: '#D1D5DB' }}/>
                    <Line type="monotone" dataKey="avgPrice" stroke="#FBBF24" activeDot={{ r: 8, fill: '#FBBF24' }} dot={{ fill: '#FBBF24' }}/>
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-lg font-medium text-ivory-100 mb-4 font-display">Average Price by Cuisine</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={cuisineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9CA3AF" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#9CA3AF"/>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} itemStyle={{ color: '#D1D5DB' }} labelStyle={{ color: '#F9FAFB' }} />
                    <Legend wrapperStyle={{ color: '#D1D5DB' }}/>
                    <Bar dataKey="avgPrice" fill="#3B82F6" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-onyx-900 border border-onyx-800 p-6 rounded-lg shadow-glass">
              <h3 className="text-lg font-medium text-ivory-100 mb-4 font-display">Listing Status Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} itemStyle={{ color: '#D1D5DB' }} labelStyle={{ color: '#F9FAFB' }} />
                    <Legend wrapperStyle={{ color: '#D1D5DB' }}/>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create/Edit Listing Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-onyx-950/80 transition-opacity" onClick={handleCloseForm}></div>
            
            <motion.div 
              className="relative transform overflow-hidden rounded-lg bg-onyx-900 border border-onyx-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <form onSubmit={handleSubmitForm}>
                <h3 className="text-xl font-semibold mb-6 text-ivory-100 font-display">
                  {isEditMode ? 'Edit Reservation Listing' : 'Create New Listing'}
                </h3>
                
                {formError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-700/30 rounded-md text-red-400">
                    {formError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Restaurant Info */}
                  <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} placeholder="Restaurant Name" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" required />
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Location (e.g., Paris)" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" required />
                  <input type="text" name="cuisine" value={formData.cuisine} onChange={handleInputChange} placeholder="Cuisine (e.g., French)" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" />
                  <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="Image URL (optional)" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" />
                  {/* Reservation Details */}
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" required />
                  <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" required />
                  <input type="number" name="partySize" value={formData.partySize} onChange={handleInputChange} placeholder="Party Size" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" min="1" required />
                  {/* Pricing */}
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="Listing Price (£)" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" min="1" required />
                  <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} placeholder="Original Price (£, optional)" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent" min="0" />
                  {/* Bidding */}
                  <div className="flex items-center col-span-1 md:col-span-2">
                    <input type="checkbox" name="allowBidding" id="allowBidding" checked={formData.allowBidding} onChange={handleInputChange} className="h-4 w-4 text-gold-600 border-onyx-700 rounded focus:ring-gold-500 bg-onyx-800" />
                    <label htmlFor="allowBidding" className="ml-2 block text-sm text-ivory-300">Allow Bidding</label>
                  </div>
                  {formData.allowBidding && (
                    <input type="number" name="minimumBid" value={formData.minimumBid} onChange={handleInputChange} placeholder="Minimum Bid (£, optional)" className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent col-span-1 md:col-span-2" min="1" />
                  )}
                  {/* Description */}
                  <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description (optional)" rows={3} className="w-full bg-onyx-800 border border-onyx-700 rounded-md px-4 py-2 text-ivory-100 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:border-transparent col-span-1 md:col-span-2" />
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isEditMode ? 'Update Listing' : 'Create Listing'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;