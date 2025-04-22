import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthError, AuthUser, Factor, Session } from '@supabase/supabase-js';

type UserRole = 'user' | 'admin';

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMfaChallenge: boolean;
  mfaFactors: Factor[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role?: UserRole) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  enrollMfa: () => Promise<{ qrCodeUrl: string | null; secret: string | null; error: AuthError | null }>;
  challengeMfa: (factorId: string, code: string) => Promise<{ error: AuthError | null }>;
  verifyMfa: (factorId: string, code: string) => Promise<{ session: Session | null; error: AuthError | null }>;
  unenrollMfa: (factorId: string) => Promise<{ error: AuthError | null }>;
  listFactors: () => Promise<void>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

interface UserProfile {
  name?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMfaChallenge, setIsMfaChallenge] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<Factor[]>([]);

  const updateUserState = async (session: Session | null, authUser: AuthUser | null) => {
    console.log('updateUserState called:', { sessionExists: !!session, authUserExists: !!authUser });
    if (session?.user && authUser) {
      console.log('updateUserState: Session and AuthUser exist, fetching profile and factors for user:', authUser.id);
      await fetchUserProfile(authUser.id);
      await listFactors();
    } else {
      console.log('updateUserState: No session or AuthUser, clearing user state.');
      setUser(null);
      setMfaFactors([]);
    }
    // Always reset MFA challenge state when user state is updated
    setIsMfaChallenge(false);
    // Log the user ID or null to confirm state update
    console.log('updateUserState finished. Current state:', { userId: user?.id || null, factorCount: mfaFactors.length, isMfaChallenge: isMfaChallenge });
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        // First get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        // If no session, clear the state
        if (!session) {
          if (mounted) {
            setUser(null);
            setMfaFactors([]);
            setIsMfaChallenge(false);
            setIsLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        // If we have a session, get the user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User error:', userError);
          throw userError;
        }
        
        if (authUser && authUser.factors && authUser.factors.length > 0) {
          if (session && mounted) {
            await updateUserState(session, authUser);
          } else if (mounted) {
            setIsMfaChallenge(true);
            await listFactors(authUser); 
            setUser(null);
          }
        } else if (mounted) {
          await updateUserState(session, session?.user || null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) {
          setUser(null);
          setMfaFactors([]);
          setIsMfaChallenge(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (!mounted || !isInitialized) return;
      
      setIsLoading(true);
      
      try {
        if (event === 'SIGNED_OUT') {
          await updateUserState(null, null);
        } else if (event === 'MFA_CHALLENGE_VERIFIED') {
          await updateUserState(session, session?.user || null);
        } else if (session?.user) {
          await updateUserState(session, session.user);
        } else {
          await updateUserState(null, null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        await updateUserState(null, null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);

  const fetchUserProfile = async (userId: string) => {
    console.log('fetchUserProfile called for userId:', userId);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('fetchUserProfile: Error fetching profile:', profileError);
        throw profileError;
      }
      
      if (profileData) {
        console.log('fetchUserProfile: Found existing profile:', profileData);
        setUser({
          id: profileData.id,
          name: profileData.name || '',
          email: profileData.email,
          role: profileData.role as UserRole || 'user',
          avatar: profileData.avatar_url,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          country: profileData.country,
          postalCode: profileData.postal_code,
        });
        console.log('fetchUserProfile: User state updated with existing profile.');
        return;
      }

      // Profile doesn't exist, try to create it
      console.log('fetchUserProfile: No profile found, attempting to create one.');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('fetchUserProfile: Error getting auth user for profile creation:', authError);
        throw authError;
      }
      if (!authUser) {
        console.warn("fetchUserProfile: Cannot create profile, no valid auth user found.");
        setUser(null);
        return;
      }

      const email = authUser.email || '';
      const userMetadata = authUser.user_metadata || {};
      const newProfile = {
        id: userId,
        email,
        name: userMetadata.name || email.split('@')[0],
        role: userMetadata.role || 'user',
      };

      console.log('fetchUserProfile: Inserting new profile:', newProfile);
      const { error: createError } = await supabase
        .from('users')
        .insert([newProfile]);
      
      if (createError) {
        console.error('fetchUserProfile: Error creating user profile:', createError);
        // Don't throw here, maybe log and set minimal user state?
        setUser({
            id: userId,
            name: newProfile.name,
            email: newProfile.email,
            role: newProfile.role as UserRole,
        });
        console.warn('fetchUserProfile: Set user state minimally despite profile creation error.')
      } else {
         setUser({
            id: userId,
            name: newProfile.name,
            email: newProfile.email,
            role: newProfile.role as UserRole,
         });
         console.log('fetchUserProfile: User state updated with newly created profile.');
      }

    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  };

  const listFactors = async (currentUser?: AuthUser | null) => {
    const getUser = async (): Promise<AuthUser | null> => {
      if (currentUser) return currentUser;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      return authUser;
    };
    
    const authUser = await getUser();
    if (!authUser) {
       console.log("listFactors: No authenticated user found.");
       setMfaFactors([]);
       return;
    }

    console.log("Listing factors for user:", authUser.id);
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    if (error) {
      console.error("Error listing MFA factors:", error);
      setMfaFactors([]);
    } else {
      console.log("Factors listed:", data?.all);
      setMfaFactors(data?.all || []);
    }
  };

  const enrollMfa = async () => {
    console.log("Attempting to enroll MFA...");
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      console.error("Error enrolling MFA:", error);
      return { qrCodeUrl: null, secret: null, error };
    }

    console.log("MFA Enrollment initiated:", data);
    const qrCodeUrl = data?.totp?.qr_code || null; 
    const secret = data?.totp?.secret || null;
    
    return { qrCodeUrl, secret, error: null };
  };

  const challengeMfa = async (factorId: string, code: string) => {
     console.log("Attempting to challenge MFA factor:", factorId);
     const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
     
     if (challengeError) {
       console.error("Error creating MFA challenge:", challengeError);
       return { error: challengeError };
     }

     if (!challengeData) {
       console.error("MFA Challenge did not return data.");
       return { error: new AuthError("MFA challenge failed: No challenge data returned.") };
     }
     
     console.log("MFA challenge created successfully, verifying factor:", factorId, "Challenge ID:", challengeData.id);
     const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challengeData.id, code });
     
     if (verifyError) {
        console.error("Error verifying MFA challenge:", verifyError);
        return { error: verifyError };
     }

     console.log("MFA factor verified and enrolled successfully.");
     await listFactors(); 
     return { error: null };
  };
  
  const verifyMfa = async (factorId: string, code: string) => {
     console.log("Verifying MFA code for factor:", factorId);
     const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });

     if (error) {
        console.error("Error verifying MFA code:", error);
        setIsMfaChallenge(true); 
        return { session: null, error };
     }

     console.log("MFA code verified successfully, session:", data);
     setIsMfaChallenge(false); 
     return { session: data, error: null };
  };

  const unenrollMfa = async (factorId: string) => {
     console.log("Attempting to unenroll MFA factor:", factorId);
     const { error } = await supabase.auth.mfa.unenroll({ factorId });
     
     if (error) {
       console.error("Error unenrolling MFA factor:", error);
       return { error };
     }
     
     console.log("MFA factor unenrolled successfully:", factorId);
     await listFactors();
     return { error: null };
  };

  const login = async (email: string, password: string) => {
    console.log('Attempting login with:', email);
    setIsLoading(true);
    setIsMfaChallenge(false);
    setUser(null); // Reset user state before login attempt
    setMfaFactors([]);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message === 'MFA authentication required') {
           console.log("MFA required for login. Setting MFA challenge state.");
           setIsMfaChallenge(true); 
           await listFactors(); // List factors to show challenge options
           setUser(null); // Ensure user is null during MFA challenge
           setIsLoading(false); // Stop loading as we are waiting for MFA code
           return; // Stop the login process here, wait for verifyMfa
        } else {
           console.error('Login error:', error);
           throw error; // Rethrow other errors
        }
      }
      
      console.log('Login successful (no MFA or already verified), session/user data received:', data);
      if (!data?.user || !data?.session) {
        console.error('Login seemed successful but session or user data is missing:', data);
        throw new Error('Login successful but no session or user data received');
      }

      // Update user state after successful login
      console.log('Login successful, calling updateUserState...');
      await updateUserState(data.session, data.user);
      console.log('Login flow completed successfully.');
    } catch (err) {
      console.error('Error during login flow:', err);
      // Ensure state is reset on error
      setUser(null);
      setMfaFactors([]);
      setIsMfaChallenge(false);
      throw err; // Rethrow the error for the calling component
    } finally {
      // Only set loading to false if not in MFA challenge
      if (!isMfaChallenge) {
         setIsLoading(false);
      }
      console.log('Login function finally block executed. isLoading:', isLoading, 'isMfaChallenge:', isMfaChallenge);
    }
  };

  const logout = async () => {
    console.log("Attempting logout...");
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
        throw error;
      }
      
      console.log("Logout successful");
      setUser(null);
      setMfaFactors([]);
      setIsMfaChallenge(false);
    } catch (err) {
      console.error('Error during logout:', err);
      setUser(null);
      setMfaFactors([]);
      setIsMfaChallenge(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, role: UserRole = 'user') => {
    console.log('Registering with:', email, role);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role
          }
        }
      });
      
      if (error) {
        console.error('Registration error:', error.message);
        throw new Error(error.message);
      }
      
      console.log('Registration successful, user requires email verification:', data.user);
      
    } catch (err) {
      console.error('Error during registration:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('You must be logged in to update your profile');
    
    setIsLoading(true);
    
    try {
      const dbUpdates: any = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.city !== undefined) dbUpdates.city = updates.city;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.postalCode !== undefined) dbUpdates.postal_code = updates.postalCode;
      
      if (updates.email && updates.email !== user.email) {
         console.warn("Email update requested. Ensure Supabase email change confirmation is handled.");
      }
      
      const { data: updatedProfileData, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      if (!updatedProfileData) {
         throw new Error("Failed to update profile or retrieve updated data.");
      }
      
      console.log("Profile updated successfully in DB:", updatedProfileData);

      setUser(prevUser => {
         if (!prevUser) return null;
         return {
             ...prevUser,
             name: updatedProfileData.name || '',
             email: updatedProfileData.email,
             avatar: updatedProfileData.avatar_url || undefined,
             phone: updatedProfileData.phone || undefined,
             address: updatedProfileData.address || undefined,
             city: updatedProfileData.city || undefined,
             country: updatedProfileData.country || undefined,
             postalCode: updatedProfileData.postal_code || undefined,
         };
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !isMfaChallenge,
        isLoading,
        isMfaChallenge,
        mfaFactors,
        login,
        logout,
        register,
        updateProfile,
        enrollMfa,
        challengeMfa,
        verifyMfa,
        unenrollMfa,
        listFactors
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};