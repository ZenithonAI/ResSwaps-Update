import { useState, useEffect } from 'react';
import { useAlerts } from '../context/AlertContext';
import Button from '../components/Button';
import { Bell, Plus, Save, Trash2, Check, X, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

type FrequencyOption = 'immediate' | 'daily' | 'weekly';
type ChannelOption = 'email' | 'sms' | 'push';

const AlertsPage = () => {
  const {
    alertPreferences,
    alerts,
    isLoading,
    addAlertPreference,
    updateAlertPreference,
    removeAlertPreference,
    markAlertAsRead,
    unreadAlertsCount,
  } = useAlerts();
  
  const { isAuthenticated } = useUser();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultForm = {
    type: 'restaurant',
    location: '',
    cuisine: '',
    priceMin: '',
    priceMax: '',
    frequency: 'immediate' as FrequencyOption,
    channels: ['email'] as ChannelOption[],
    enabled: true,
  };
  
  const [formData, setFormData] = useState(defaultForm);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const input = e.target as HTMLInputElement;
      if (name === 'channels') {
        const channel = value as ChannelOption;
        const channels = [...formData.channels];
        
        if (input.checked) {
          channels.push(channel);
        } else {
          const index = channels.indexOf(channel);
          if (index > -1) {
            channels.splice(index, 1);
          }
        }
        
        setFormData({
          ...formData,
          channels,
        });
      } else if (name === 'enabled') {
        setFormData({
          ...formData,
          enabled: input.checked,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);
    
    try {
      const newPreference = {
        ...formData,
        priceRange: formData.priceMin && formData.priceMax 
          ? [parseInt(formData.priceMin), parseInt(formData.priceMax)] as [number, number]
          : undefined,
      };
      
      if (isEditMode && currentId) {
        await updateAlertPreference(currentId, newPreference);
        setFormSuccess('Alert preference updated successfully!');
      } else {
        await addAlertPreference(newPreference);
        setFormSuccess('Alert preference created successfully!');
      }
      
      // Reset form after a delay to show success message
      setTimeout(() => {
        setFormData(defaultForm);
        setIsFormOpen(false);
        setIsEditMode(false);
        setCurrentId('');
        setFormSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting alert preference:', error);
      setFormError('Failed to save alert preference. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (id: string) => {
    const preference = alertPreferences.find(p => p.id === id);
    if (preference) {
      setFormData({
        type: preference.type,
        location: preference.location || '',
        cuisine: preference.cuisine || '',
        priceMin: preference.priceRange ? preference.priceRange[0].toString() : '',
        priceMax: preference.priceRange ? preference.priceRange[1].toString() : '',
        frequency: preference.frequency,
        channels: preference.channels,
        enabled: preference.enabled,
      });
      setIsEditMode(true);
      setCurrentId(id);
      setIsFormOpen(true);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert preference?')) {
      try {
        await removeAlertPreference(id);
        setFormSuccess('Alert preference deleted successfully!');
        
        // Clear the message after a delay
        setTimeout(() => {
          setFormSuccess('');
        }, 2000);
      } catch (error) {
        console.error('Error deleting alert preference:', error);
        setFormError('Failed to delete alert preference. Please try again.');
        
        // Clear the error message after a delay
        setTimeout(() => {
          setFormError('');
        }, 2000);
      }
    }
  };
  
  const handleCancel = () => {
    setFormData(defaultForm);
    setIsFormOpen(false);
    setIsEditMode(false);
    setCurrentId('');
    setFormError('');
    setFormSuccess('');
  };
  
  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'restaurant':
        return 'Specific Restaurant';
      case 'cuisine':
        return 'Cuisine Type';
      case 'location':
        return 'Location';
      default:
        return type;
    }
  };
  
  const getFrequencyLabel = (frequency: FrequencyOption) => {
    switch (frequency) {
      case 'immediate':
        return 'Real-time';
      case 'daily':
        return 'Daily Digest';
      case 'weekly':
        return 'Weekly Summary';
      default:
        return frequency;
    }
  };

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ivory-50 mb-1 font-display">Alerts & Notifications</h1>
            <p className="text-ivory-400">Stay updated on new reservations that match your preferences</p>
          </div>
        </div>
        
        <motion.div 
          className="bg-onyx-900 border border-onyx-800 p-8 rounded-lg shadow-glass text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-medium text-ivory-100 mb-4 font-display">Sign in to manage alerts</h2>
          <p className="text-ivory-400 max-w-md mx-auto mb-6">
            You need to sign in to set up alerts for the restaurant reservations you're interested in.
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ivory-50 mb-1 font-display">Alerts & Notifications</h1>
          <p className="text-ivory-400">Stay updated on new reservations that match your preferences</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="gold"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsFormOpen(true);
              setIsEditMode(false);
              setFormData(defaultForm);
            }}
          >
            Add New Alert
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(formSuccess || formError) && (
        <motion.div 
          className={`mb-6 p-4 rounded-md ${formSuccess ? 'bg-green-900/30 border border-green-700/30 text-green-400' : 'bg-red-900/30 border border-red-700/30 text-red-400'}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {formSuccess || formError}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Preferences Panel */}
        <div className="lg:col-span-2">
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="px-6 py-4 border-b border-onyx-800">
              <h2 className="text-lg font-medium text-ivory-50 font-display">Your Alert Preferences</h2>
            </div>
            
            {/* Form */}
            {isFormOpen && (
              <div className="p-6 border-b border-onyx-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-medium text-ivory-100 font-display">
                    {isEditMode ? 'Edit Alert' : 'New Alert'}
                  </h3>
                  <button
                    className="text-ivory-400 hover:text-ivory-200"
                    onClick={handleCancel}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ivory-400 mb-1">
                        Alert Type*
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                      >
                        <option value="restaurant">Specific Restaurant</option>
                        <option value="cuisine">Cuisine Type</option>
                        <option value="location">Location</option>
                      </select>
                    </div>
                    
                    {(formData.type === 'restaurant' || formData.type === 'location') && (
                      <div>
                        <label className="block text-sm font-medium text-ivory-400 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                          placeholder="e.g. Paris, France"
                          value={formData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                    
                    {(formData.type === 'cuisine' || formData.type === 'restaurant') && (
                      <div>
                        <label className="block text-sm font-medium text-ivory-400 mb-1">
                          Cuisine
                        </label>
                        <select
                          name="cuisine"
                          value={formData.cuisine}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                        >
                          <option value="">Any cuisine</option>
                          <option value="French">French</option>
                          <option value="Italian">Italian</option>
                          <option value="Spanish">Spanish</option>
                          <option value="Japanese">Japanese</option>
                          <option value="American">American</option>
                          <option value="British">British</option>
                          <option value="Nordic">Nordic</option>
                          <option value="Asian">Asian</option>
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-ivory-400 mb-1">
                        Price Range
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          name="priceMin"
                          placeholder="Min"
                          className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                          value={formData.priceMin}
                          onChange={handleInputChange}
                        />
                        <input
                          type="number"
                          name="priceMax"
                          placeholder="Max"
                          className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                          value={formData.priceMax}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ivory-400 mb-1">
                        Frequency*
                      </label>
                      <select
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleInputChange}
                        required
                        className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                      >
                        <option value="immediate">Real-time</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Summary</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-ivory-400 mb-2">
                        Notification Channels*
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            id="channel-email"
                            name="channels"
                            type="checkbox"
                            value="email"
                            checked={formData.channels.includes('email')}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-onyx-600 bg-onyx-800 rounded"
                          />
                          <label htmlFor="channel-email" className="ml-2 block text-sm text-ivory-200">
                            Email
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="channel-sms"
                            name="channels"
                            type="checkbox"
                            value="sms"
                            checked={formData.channels.includes('sms')}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-onyx-600 bg-onyx-800 rounded"
                          />
                          <label htmlFor="channel-sms" className="ml-2 block text-sm text-ivory-200">
                            SMS
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="channel-push"
                            name="channels"
                            type="checkbox"
                            value="push"
                            checked={formData.channels.includes('push')}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-onyx-600 bg-onyx-800 rounded"
                          />
                          <label htmlFor="channel-push" className="ml-2 block text-sm text-ivory-200">
                            Push Notification
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="enabled"
                        name="enabled"
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-onyx-600 bg-onyx-800 rounded"
                      />
                      <label htmlFor="enabled" className="ml-2 block text-sm text-ivory-200">
                        Enable this alert
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="gold"
                      leftIcon={<Save className="h-4 w-4" />}
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      {isEditMode ? 'Update Alert' : 'Save Alert'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Loading state */}
            {isLoading && !isFormOpen && (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-600 mb-4"></div>
                  <p className="text-ivory-300">Loading your alert preferences...</p>
                </div>
              </div>
            )}
            
            {/* Alert Preferences List */}
            {!isLoading && !isFormOpen && alertPreferences.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="rounded-full bg-onyx-800 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-gold-500" />
                </div>
                <h3 className="text-lg font-medium text-ivory-100 mb-1 font-display">No alerts set up yet</h3>
                <p className="text-ivory-400 mb-4">Create your first alert to get notified about reservations</p>
                <Button
                  variant="gold"
                  onClick={() => {
                    setIsFormOpen(true);
                    setIsEditMode(false);
                  }}
                >
                  Create Alert
                </Button>
              </div>
            )}
            
            {!isLoading && !isFormOpen && alertPreferences.length > 0 && (
              <div className="divide-y divide-onyx-800">
                {alertPreferences.map((pref) => (
                  <div
                    key={pref.id}
                    className={`p-6 hover:bg-onyx-800/30 transition-colors duration-150 ${!pref.enabled ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${pref.enabled ? 'bg-green-400' : 'bg-onyx-600'}`}></div>
                        <h3 className="text-base font-medium text-ivory-100">
                          {getAlertTypeLabel(pref.type)}
                        </h3>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => handleEdit(pref.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(pref.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-ivory-400 mb-3">
                      {pref.location && <p>Location: {pref.location}</p>}
                      {pref.cuisine && <p>Cuisine: {pref.cuisine}</p>}
                      {pref.priceRange && (
                        <p>Price Range: €{pref.priceRange[0]} - €{pref.priceRange[1]}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-800/30">
                        {getFrequencyLabel(pref.frequency)}
                      </span>
                      {pref.channels.map((channel) => (
                        <span
                          key={channel}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-onyx-800 text-ivory-300 border border-onyx-700/30"
                        >
                          {channel.charAt(0).toUpperCase() + channel.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications Panel */}
        <div>
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="px-6 py-4 border-b border-onyx-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-ivory-50 font-display">Recent Notifications</h2>
                {unreadAlertsCount > 0 && (
                  <span className="bg-gold-900/40 text-gold-500 text-xs font-bold px-3 py-1 rounded-full border border-gold-800/30">
                    {unreadAlertsCount} unread
                  </span>
                )}
              </div>
            </div>
            
            {isLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold-600 mb-3"></div>
                  <p className="text-ivory-300">Loading notifications...</p>
                </div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-ivory-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-onyx-800 max-h-[600px] overflow-y-auto">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`px-6 py-4 hover:bg-onyx-800/30 ${!alert.read ? 'bg-gold-900/10' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            alert.type === 'info'
                              ? 'bg-blue-500'
                              : alert.type === 'success'
                              ? 'bg-green-500'
                              : alert.type === 'warning'
                              ? 'bg-gold-500'
                              : 'bg-red-500'
                          }`}
                        ></div>
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-ivory-100">{alert.message}</p>
                        <p className="mt-1 text-xs text-ivory-500">
                          {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                          {new Date(alert.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      {!alert.read && (
                        <button
                          className="ml-2 flex-shrink-0 bg-gold-900/20 text-gold-500 p-1 rounded-full hover:bg-gold-900/40"
                          onClick={() => markAlertAsRead(alert.id)}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Notification Settings */}
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass mt-6">
            <div className="px-6 py-4 border-b border-onyx-800">
              <h2 className="text-lg font-medium text-ivory-50 font-display">Notification Settings</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-ivory-300">Email Notifications</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        name="email-toggle"
                        id="email-toggle"
                        className="sr-only"
                        defaultChecked
                      />
                      <label
                        htmlFor="email-toggle"
                        className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                      >
                        <span
                          className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                        ></span>
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-ivory-500">
                    Receive updates via email for your alert preferences
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-ivory-300">SMS Notifications</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        name="sms-toggle"
                        id="sms-toggle"
                        className="sr-only"
                        defaultChecked
                      />
                      <label
                        htmlFor="sms-toggle"
                        className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                      >
                        <span
                          className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                        ></span>
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-ivory-500">
                    Receive text message alerts for important updates
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-ivory-300">Push Notifications</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        name="push-toggle"
                        id="push-toggle"
                        className="sr-only"
                        defaultChecked
                      />
                      <label
                        htmlFor="push-toggle"
                        className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                      >
                        <span
                          className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                        ></span>
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-ivory-500">
                    Receive browser push notifications
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  variant="glass"
                  fullWidth
                >
                  Update Notification Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;