import { useState, useEffect } from 'react';
import { QRCodeSVG } from "qrcode.react";
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import { Save, Key, CreditCard, Download, Phone, Mail, User, Shield, Upload, CheckCircle, AlertTriangle, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Factor } from '@supabase/supabase-js';

type ProfileTab = 'personal' | 'payment' | 'security' | 'notifications' | 'data';

const ProfilePage = () => {
  const { 
    user, 
    isLoading, 
    updateProfile, 
    mfaFactors, 
    enrollMfa, 
    challengeMfa, 
    unenrollMfa,
    listFactors
  } = useUser();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  
  const [mfaEnrollmentData, setMfaEnrollmentData] = useState<{ qrCodeUrl: string | null; secret: string | null } | null>(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [isEnrollingMfa, setIsEnrollingMfa] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });
  
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        postalCode: user.postalCode || '',
      });
      
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
      listFactors();
    }
  }, [user, listFactors]);
  
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonalInfo({
      ...personalInfo,
      [name]: value,
    });
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.result) {
          setAvatarPreview(fileReader.result.toString());
        }
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  const uploadAvatar = async (): Promise<string | undefined> => {
    if (!avatar || !user) return undefined;
    
    try {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, avatar);
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess(false);
    setIsUpdating(true);
    
    try {
      let avatarUrl = undefined;
      if (avatar) {
        avatarUrl = await uploadAvatar();
      }
      
      await updateProfile({
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        address: personalInfo.address,
        city: personalInfo.city,
        country: personalInfo.country,
        postalCode: personalInfo.postalCode,
        ...(avatarUrl && { avatar: avatarUrl }),
      });
      
      setUpdateSuccess(true);
      
      setAvatar(null);
      
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const currentPassword = (form.elements.namedItem('current-password') as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem('new-password') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirm-password') as HTMLInputElement).value;
    
    if (newPassword !== confirmPassword) {
      setUpdateError('New passwords do not match.');
      return;
    }
    
    setUpdateError('');
    setUpdateSuccess(false);
    setIsUpdating(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setUpdateSuccess(true);
      form.reset();
      
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setUpdateError('Failed to update password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleEnableMfa = async () => {
    setMfaError('');
    setMfaSuccess('');
    setIsEnrollingMfa(true);
    setMfaEnrollmentData(null);
    setMfaVerificationCode('');
    
    try {
      const { qrCodeUrl, secret, error } = await enrollMfa();
      if (error) {
        throw error;
      }
      if (qrCodeUrl && secret) {
        setMfaEnrollmentData({ qrCodeUrl, secret });
      } else {
         throw new Error("Failed to get QR code and secret for MFA enrollment.");
      }
    } catch (err: any) {
      console.error("Error initiating MFA enrollment:", err);
      setMfaError(err.message || 'Failed to start MFA enrollment. Please try again.');
    } finally {
      // Keep enrolling state true until verified or cancelled
    }
  };
  
  const handleVerifyAndEnableMfa = async () => {
     setMfaError('');
     setMfaSuccess('');
     setIsUpdating(true); // Use general updating state for verification button
     
     const factor = mfaFactors.find(f => f.status === 'unverified');
     if (!factor || !mfaVerificationCode) {
        setMfaError("Could not find enrollment details or verification code is missing.");
        setIsUpdating(false);
        return;
     }
     
     try {
        const { error } = await challengeMfa(factor.id, mfaVerificationCode);
        if (error) {
           throw error;
        }
        setMfaSuccess('Two-Factor Authentication enabled successfully!');
        setMfaEnrollmentData(null); // Clear enrollment data
        setMfaVerificationCode('');
        setIsEnrollingMfa(false); // Finish enrollment process
        // listFactors is called within challengeMfa on success
     } catch (err: any) {
        console.error("Error verifying MFA code:", err);
        // Provide specific feedback for invalid codes
        if (err.message.includes('Invalid TOTP code') || err.message.includes('verification failed')) {
            setMfaError('Invalid verification code. Please try again.');
        } else {
            setMfaError(err.message || 'Failed to verify MFA code. Please try again.');
        }
     } finally {
        setIsUpdating(false);
     }
  };
  
  const handleCancelMfaEnrollment = async () => {
     setIsEnrollingMfa(false);
     setMfaEnrollmentData(null);
     setMfaVerificationCode('');
     setMfaError('');
     // Optional: Attempt to unenroll the unverified factor if it exists
     const unverifiedFactor = mfaFactors.find(f => f.status === 'unverified');
     if (unverifiedFactor) {
        try {
          await unenrollMfa(unverifiedFactor.id);
        } catch (err) {
          console.error("Error cleaning up unverified MFA factor:", err); 
        }
     }
  };
  
  const handleDisableMfa = async () => {
     const factor = mfaFactors.find(f => f.status === 'verified' && f.factor_type === 'totp');
     if (!factor) {
       setMfaError("No verified MFA factor found to disable.");
       return;
     }
     
     // Optional: Add a confirmation dialog here
     if (!window.confirm("Are you sure you want to disable Two-Factor Authentication?")) {
        return;
     }
     
     setMfaError('');
     setMfaSuccess('');
     setIsDisablingMfa(true);
     
     try {
       const { error } = await unenrollMfa(factor.id);
       if (error) {
         throw error;
       }
       setMfaSuccess('Two-Factor Authentication disabled successfully.');
       // listFactors is called within unenrollMfa on success
     } catch (err: any) {
       console.error("Error disabling MFA:", err);
       setMfaError(err.message || 'Failed to disable MFA. Please try again.');
     } finally {
       setIsDisablingMfa(false);
     }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="px-6 py-4 border-b border-onyx-800">
              <h2 className="text-lg font-medium text-ivory-100 font-display">Personal Information</h2>
            </div>
            <div className="p-6">
              {updateSuccess && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-700/30 rounded-md flex items-center text-green-400">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Profile updated successfully!
                </div>
              )}
              
              {updateError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700/30 rounded-md text-red-400">
                  {updateError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-onyx-800 border border-onyx-700">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt={personalInfo.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <User className="h-12 w-12 text-ivory-500" />
                          </div>
                        )}
                      </div>
                      <label 
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 h-8 w-8 bg-gold-600 rounded-full cursor-pointer flex items-center justify-center border border-gold-700"
                      >
                        <Upload className="h-4 w-4 text-onyx-950" />
                      </label>
                      <input 
                        id="avatar-upload" 
                        type="file" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-ivory-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={personalInfo.name}
                      onChange={handlePersonalInfoChange}
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-ivory-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={personalInfo.email}
                      onChange={handlePersonalInfoChange}
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-ivory-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-ivory-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={personalInfo.address}
                      onChange={handlePersonalInfoChange}
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-ivory-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={personalInfo.city}
                      onChange={handlePersonalInfoChange}
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-ivory-300 mb-1">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={personalInfo.country}
                      onChange={handlePersonalInfoChange}
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    >
                      <option value="">Select a country</option>
                      <option value="France">France</option>
                      <option value="Italy">Italy</option>
                      <option value="Spain">Spain</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Switzerland">Switzerland</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-ivory-300 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      id="postalCode"
                      value={personalInfo.postalCode}
                      onChange={handlePersonalInfoChange}
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <Button
                    type="submit"
                    variant="gold"
                    leftIcon={<Save className="h-4 w-4" />}
                    isLoading={isUpdating}
                    disabled={isUpdating}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
        
      case 'payment':
        return (
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="px-6 py-4 border-b border-onyx-800">
              <h2 className="text-lg font-medium text-ivory-100 font-display">Payment Methods</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-ivory-200 mb-3">Saved Payment Methods</h3>
                <div className="bg-onyx-950/40 p-4 rounded-md border border-onyx-800/60 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ivory-100">•••• •••• •••• 4242</p>
                        <p className="text-xs text-ivory-400">Expires 12/25</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-sm text-gold-500 hover:text-gold-400">Edit</button>
                      <button className="text-sm text-red-500 hover:text-red-400">Remove</button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="glass"
                  leftIcon={<CreditCard className="h-4 w-4" />}
                >
                  Add New Payment Method
                </Button>
              </div>
              <div>
                <h3 className="text-sm font-medium text-ivory-200 mb-3">Billing History</h3>
                <div className="overflow-x-auto border border-onyx-800/60 rounded-md">
                  <table className="min-w-full divide-y divide-onyx-800/60">
                    <thead className="bg-onyx-800/20">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ivory-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ivory-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ivory-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-ivory-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-onyx-800/60">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ivory-300">
                          May 15, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ivory-400">
                          Reservation at Le Cinq
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ivory-300">
                          €180.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400 border border-green-800/30">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ivory-300">
                          Apr 22, 2025
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ivory-400">
                          Reservation at Noma
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ivory-300">
                          €390.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400 border border-green-800/30">
                            Completed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'security':
        const verifiedTotpFactor = mfaFactors.find(f => f.status === 'verified' && f.factor_type === 'totp');
        
        return (
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="px-6 py-4 border-b border-onyx-800">
              <h2 className="text-lg font-medium text-ivory-100 font-display">Security Settings</h2>
            </div>
            <div className="p-6">
              {updateSuccess && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-700/30 rounded-md flex items-center text-green-400">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Password updated successfully!
                </div>
              )}
              
              {updateError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700/30 rounded-md text-red-400">
                  {updateError}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-ivory-200 mb-3">Change Password</h3>
                <form className="space-y-4" onSubmit={handlePasswordChange}>
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-ivory-300 mb-1">
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      name="current-password"
                      type="password"
                      required
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-ivory-300 mb-1">
                      New Password
                    </label>
                    <input
                      id="new-password"
                      name="new-password"
                      type="password"
                      required
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-ivory-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                      className="block w-full px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100"
                    />
                  </div>
                  <div>
                    <Button
                      type="submit"
                      variant="gold"
                      leftIcon={<Key className="h-4 w-4" />}
                      isLoading={isUpdating}
                      disabled={isUpdating}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
              
              <div className="pt-6 border-t border-onyx-800">
                <h3 className="text-sm font-medium text-ivory-200 mb-3">Two-Factor Authentication (2FA)</h3>
                
                {mfaSuccess && (
                  <div className="mb-4 p-3 bg-green-900/30 border border-green-700/30 rounded-md flex items-center text-green-400">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {mfaSuccess}
                  </div>
                )}
                {mfaError && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-700/30 rounded-md flex items-center text-red-400">
                     <AlertTriangle className="h-5 w-5 mr-2" />
                    {mfaError}
                  </div>
                )}

                {!isEnrollingMfa && !verifiedTotpFactor && (
                  <>
                    <p className="text-sm text-ivory-400 mb-4">
                      Add an extra layer of security using an authenticator app (e.g., Google Authenticator, Authy).
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleEnableMfa}
                      leftIcon={<Shield className="h-4 w-4" />}
                    >
                      Enable 2FA
                    </Button>
                  </>
                )}

                {isEnrollingMfa && mfaEnrollmentData && (
                  <div className="space-y-4">
                    <p className="text-sm text-ivory-300">
                      Scan the QR code with your authenticator app or enter the secret manually.
                    </p>
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                       <div className="p-2 bg-white rounded-md inline-block"> 
                           <QRCodeSVG
                               value={mfaEnrollmentData.qrCodeUrl || ''}
                               size={160}
                               bgColor="#FFFFFF"
                               fgColor="#000000"
                               level="Q"
                           />
                       </div>
                       <div>
                          <p className="text-sm text-ivory-400 mb-1">Secret Key:</p>
                          <p className="text-sm font-mono bg-onyx-800 p-2 rounded break-all">{mfaEnrollmentData.secret}</p>
                       </div>
                    </div>
                    
                    <div>
                      <label htmlFor="mfa-verify-code" className="block text-sm font-medium text-ivory-300 mb-1">
                        Enter Verification Code
                      </label>
                      <input
                        id="mfa-verify-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={mfaVerificationCode}
                        onChange={(e) => setMfaVerificationCode(e.target.value)}
                        required
                        className="block w-full max-w-xs px-3 py-2 bg-onyx-950 border border-onyx-700 rounded-md shadow-sm focus:ring-gold-600 focus:border-gold-600 text-ivory-100 mb-2"
                      />
                      <div className="flex gap-2">
                         <Button
                           variant="gold"
                           onClick={handleVerifyAndEnableMfa}
                           isLoading={isUpdating}
                           disabled={isUpdating || !mfaVerificationCode}
                           leftIcon={<CheckCircle className="h-4 w-4" />}
                         >
                           Verify & Enable
                         </Button>
                         <Button
                            variant="secondary"
                            onClick={handleCancelMfaEnrollment}
                            disabled={isUpdating}
                         >
                            Cancel
                         </Button>
                      </div>
                    </div>
                  </div>
                )}

                {verifiedTotpFactor && (
                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                         <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                         <p className="text-sm text-green-400">Two-Factor Authentication is enabled.</p>
                      </div>
                      <Button
                        variant="danger"
                        onClick={handleDisableMfa}
                        isLoading={isDisablingMfa}
                        disabled={isDisablingMfa}
                        leftIcon={<Shield className="h-4 w-4" />}
                      >
                        Disable 2FA
                      </Button>
                   </div>
                )}
              </div>
              
              <div className="pt-6 border-t border-onyx-800">
                <h3 className="text-sm font-medium text-ivory-200 mb-3">Connected Accounts</h3>
                <p className="text-sm text-ivory-400 mb-4">
                  Connect your account to streamline sign-in and access additional features.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-onyx-800 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.545,10.239v3.821h5.445c-0.643,2.508-2.644,4.312-5.445,4.312c-3.297,0-5.97-2.673-5.97-5.97c0-3.297,2.673-5.97,5.97-5.97c1.498,0,2.866,0.549,3.921,1.453l2.846-2.846C17.124,3.259,14.7,2,12.04,2C6.694,2,2.343,6.351,2.343,11.697c0,5.346,4.351,9.697,9.697,9.697c5.595,0,9.697-3.936,9.697-9.697c0-0.674-0.076-1.325-0.215-1.958H12.545z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-ivory-200">Google</p>
                        <p className="text-xs text-ivory-400">
                          Not connected
                        </p>
                      </div>
                    </div>
                    <button className="text-sm text-gold-500 hover:text-gold-400">
                      Connect
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-onyx-800 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-ivory-100" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.045,3.013C16.596,3.013,20.297,5.979,21,10.04C20.188,13.947,16.632,16.975,12.045,16.975C7.457,16.975,3.911,13.947,3.09,10.04C3.793,5.979,7.494,3.013,12.045,3.013Zm0,2.246C9.29,5.259,7.056,7.493,7.056,10.248C7.056,13.003,9.29,15.237,12.045,15.237C14.8,15.237,17.034,13.003,17.034,10.248C17.034,7.493,14.8,5.259,12.045,5.259Z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-ivory-200">Apple</p>
                        <p className="text-xs text-ivory-400">
                          Connected
                        </p>
                      </div>
                    </div>
                    <button className="text-sm text-red-500 hover:text-red-400">
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'notifications':
        return (
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="px-6 py-4 border-b border-onyx-800">
              <h2 className="text-lg font-medium text-ivory-100 font-display">Notification Preferences</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-ivory-200 mb-3">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ivory-200">New reservation alerts</p>
                        <p className="text-xs text-ivory-400">Be notified when reservations matching your alerts are available</p>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          name="toggle-1"
                          id="toggle-1"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="toggle-1"
                          className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                        >
                          <span
                            className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                          ></span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ivory-200">Offers and sales</p>
                        <p className="text-xs text-ivory-400">Receive updates on special offers and promotions</p>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          name="toggle-2"
                          id="toggle-2"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="toggle-2"
                          className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                        >
                          <span
                            className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                          ></span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ivory-200">Reservation updates</p>
                        <p className="text-xs text-ivory-400">Be notified about changes to your reservations</p>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          name="toggle-3"
                          id="toggle-3"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="toggle-3"
                          className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                        >
                          <span
                            className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-onyx-800">
                  <h3 className="text-sm font-medium text-ivory-200 mb-3">SMS Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ivory-200">Reservation confirmations</p>
                        <p className="text-xs text-ivory-400">Receive SMS when your reservation is confirmed</p>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          name="toggle-4"
                          id="toggle-4"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="toggle-4"
                          className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                        >
                          <span
                            className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                          ></span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ivory-200">Reservation reminders</p>
                        <p className="text-xs text-ivory-400">Receive SMS reminders before your reservation</p>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          name="toggle-5"
                          id="toggle-5"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="toggle-5"
                          className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                        >
                          <span
                            className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-onyx-800">
                  <h3 className="text-sm font-medium text-ivory-200 mb-3">Push Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ivory-200">All push notifications</p>
                        <p className="text-xs text-ivory-400">Enable or disable all push notifications</p>
                      </div>
                      <div className="relative inline-block w-10 align-middle select-none">
                        <input
                          type="checkbox"
                          name="toggle-6"
                          id="toggle-6"
                          className="sr-only"
                          defaultChecked
                        />
                        <label
                          htmlFor="toggle-6"
                          className="block overflow-hidden h-6 rounded-full bg-onyx-700 cursor-pointer"
                        >
                          <span
                            className="absolute left-0 bg-gold-500 border-2 border-onyx-700 h-6 w-6 rounded-full transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-full"
                          ></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  type="button"
                  variant="gold"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'data':
        return (
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="px-6 py-4 border-b border-onyx-800">
              <h2 className="text-lg font-medium text-ivory-100 font-display">Data Management</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-ivory-200 mb-3">Export Your Data</h3>
                  <p className="text-sm text-ivory-400 mb-4">
                    Download all your data including reservations, transactions, and profile information.
                  </p>
                  <div className="space-y-3">
                    <Button
                      variant="glass"
                      leftIcon={<Download className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                    >
                      Export as CSV
                    </Button>
                    <Button
                      variant="glass"
                      leftIcon={<Download className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                    >
                      Export as Excel
                    </Button>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-onyx-800">
                  <h3 className="text-sm font-medium text-ivory-200 mb-3">Data Privacy</h3>
                  <p className="text-sm text-ivory-400 mb-4">
                    Control how your data is used and shared on the platform.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="privacy-1"
                        name="privacy-1"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-onyx-600 bg-onyx-800 rounded"
                      />
                      <label htmlFor="privacy-1" className="ml-2 block text-sm text-ivory-200">
                        Allow ResSwaps to use my reservation data for improving recommendations
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="privacy-2"
                        name="privacy-2"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-onyx-600 bg-onyx-800 rounded"
                      />
                      <label htmlFor="privacy-2" className="ml-2 block text-sm text-ivory-200">
                        Allow my profile to be discovered by other users
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="privacy-3"
                        name="privacy-3"
                        type="checkbox"
                        className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-onyx-600 bg-onyx-800 rounded"
                      />
                      <label htmlFor="privacy-3" className="ml-2 block text-sm text-ivory-200">
                        Share my reservation activity with third-party partners
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-onyx-800">
                  <h3 className="text-sm font-medium text-red-500 mb-3">Delete Account</h3>
                  <p className="text-sm text-ivory-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="outline"
                    className="text-red-500 border-red-500 hover:bg-red-900/20"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivory-50 mb-1 font-display">Your Profile</h1>
        <p className="text-ivory-400">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass">
            <div className="p-6 text-center border-b border-onyx-800">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user?.name || "User"}
                  className="h-24 w-24 rounded-full mx-auto object-cover border border-onyx-700"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-onyx-800 flex items-center justify-center mx-auto border border-onyx-700">
                  <User className="h-12 w-12 text-ivory-500" />
                </div>
              )}
              <h3 className="mt-4 text-lg font-medium text-ivory-100">{user?.name}</h3>
              <p className="text-sm text-ivory-400 capitalize">{user?.role}</p>
            </div>
            <nav className="px-4 py-4">
              <ul className="space-y-1">
                <li>
                  <button
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'personal'
                        ? 'bg-gold-900/20 text-gold-500 border-l-2 border-gold-600'
                        : 'text-ivory-300 hover:bg-onyx-800/40 hover:text-gold-400 border-l-2 border-transparent'
                    }`}
                    onClick={() => setActiveTab('personal')}
                  >
                    <User className={`mr-3 h-5 w-5 ${activeTab === 'personal' ? 'text-gold-500' : 'text-ivory-500'}`} />
                    Personal Information
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'payment'
                        ? 'bg-gold-900/20 text-gold-500 border-l-2 border-gold-600'
                        : 'text-ivory-300 hover:bg-onyx-800/40 hover:text-gold-400 border-l-2 border-transparent'
                    }`}
                    onClick={() => setActiveTab('payment')}
                  >
                    <CreditCard className={`mr-3 h-5 w-5 ${activeTab === 'payment' ? 'text-gold-500' : 'text-ivory-500'}`} />
                    Payment Methods
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'security'
                        ? 'bg-gold-900/20 text-gold-500 border-l-2 border-gold-600'
                        : 'text-ivory-300 hover:bg-onyx-800/40 hover:text-gold-400 border-l-2 border-transparent'
                    }`}
                    onClick={() => setActiveTab('security')}
                  >
                    <Shield className={`mr-3 h-5 w-5 ${activeTab === 'security' ? 'text-gold-500' : 'text-ivory-500'}`} />
                    Security
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'notifications'
                        ? 'bg-gold-900/20 text-gold-500 border-l-2 border-gold-600'
                        : 'text-ivory-300 hover:bg-onyx-800/40 hover:text-gold-400 border-l-2 border-transparent'
                    }`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Bell className={`mr-3 h-5 w-5 ${activeTab === 'notifications' ? 'text-gold-500' : 'text-ivory-500'}`} />
                    Notifications
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      activeTab === 'data'
                        ? 'bg-gold-900/20 text-gold-500 border-l-2 border-gold-600'
                        : 'text-ivory-300 hover:bg-onyx-800/40 hover:text-gold-400 border-l-2 border-transparent'
                    }`}
                    onClick={() => setActiveTab('data')}
                  >
                    <Download className={`mr-3 h-5 w-5 ${activeTab === 'data' ? 'text-gold-500' : 'text-ivory-500'}`} />
                    Data Management
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        <div className="flex-1">
          {isLoading ? (
            <div className="bg-onyx-900 border border-onyx-800 rounded-lg overflow-hidden shadow-glass p-8 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-600 mb-4"></div>
                <p className="text-ivory-300">Loading profile data...</p>
              </div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;