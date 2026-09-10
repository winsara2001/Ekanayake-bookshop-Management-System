import { supabase } from '../lib/supabase';

export const loyaltyService = {
  // Get active settings (public readable)
  async getLoyaltySettings() {
    try {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (error) {
        console.error('Error fetching loyalty settings:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error fetching loyalty settings:', err);
      return { success: false, error: err.message };
    }
  },

  // Update loyalty settings (Admin only)
  async updateLoyaltySettings(updates) {
    try {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .update({
          earn_amount_per_point: updates.earn_amount_per_point,
          redemption_value_per_point: updates.redemption_value_per_point,
          is_active: updates.is_active
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) {
        console.error('Error updating loyalty settings:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error updating loyalty settings:', err);
      return { success: false, error: err.message };
    }
  },

  // Get current logged-in user's loyalty account
  async getMyLoyaltyAccount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('customer_id', user.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // Account doesn't exist yet, return a safe default instead of failing
          return { success: true, data: { points_balance: 0, lifetime_points_earned: 0, lifetime_points_redeemed: 0 } };
        }
        console.error('Error fetching loyalty account:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error fetching loyalty account:', err);
      return { success: false, error: err.message };
    }
  },

  // Get current logged-in user's loyalty transactions
  async getMyLoyaltyTransactions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Not authenticated' };

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*, orders(order_number)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching loyalty transactions:', error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      console.error('Unexpected error fetching loyalty transactions:', err);
      return { success: false, error: err.message };
    }
  }
};
