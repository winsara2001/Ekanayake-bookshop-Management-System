import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { customerProfileService } from '../services/customerProfileService';
import { staffProfileService } from '../services/staffProfileService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId) => {
    if (!userId) {
      setCustomerProfile(null);
      setStaffProfile(null);
      return;
    }
    
    // Fetch both profiles in parallel
    const [custRes, staffRes] = await Promise.all([
      customerProfileService.getCustomerProfile(userId),
      staffProfileService.getStaffProfile(userId)
    ]);
    
    if (custRes.success) {
      setCustomerProfile(custRes.data);
    } else {
      setCustomerProfile(null);
    }
    
    if (staffRes.success) {
      setStaffProfile(staffRes.data);
    } else {
      setStaffProfile(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error fetching session:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setCustomerProfile(null);
          setStaffProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Map common Supabase errors to friendly messages
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Please verify your email before logging in.' };
        }
        return { success: false, error: error.message };
      }

      // Check if user is an admin or staff
      let role = 'customer';
      if (data?.user) {
        const staffRes = await staffProfileService.getStaffProfile(data.user.id);
        if (staffRes.success && staffRes.data?.is_active) {
          role = staffRes.data.role; // Will be 'admin', 'inventory_manager', or 'sales_manager'
        }
      }

      return { success: true, role };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  };

  const register = async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone,
            role: 'customer'
          }
        }
      });

      if (error) {
        if (error.status === 429) {
          console.error('Auth email request failed: rate limit exceeded');
          return { success: false, error: 'Too many email requests. Please wait a while and try again.' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // We don't manually set user(null) here because onAuthStateChange handles it.
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const updateProfile = async (updatedData) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    const result = await customerProfileService.updateCustomerProfile(user.id, {
      first_name: updatedData.firstName,
      last_name: updatedData.lastName,
      phone: updatedData.phone
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Update local profile state immediately
    setCustomerProfile(result.data);
    return { success: true };
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, session, customerProfile, staffProfile, loading, isAuthenticated, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
