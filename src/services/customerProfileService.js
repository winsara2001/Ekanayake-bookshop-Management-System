import { supabase } from '../lib/supabase';

export const customerProfileService = {
  /**
   * Fetches the customer profile for the given user ID.
   */
  async getCustomerProfile(userId) {
    if (!userId) return { success: false, error: 'User ID is required' };

    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Profile not found' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred while fetching profile' };
    }
  },

  /**
   * Updates the customer profile for the given user ID.
   */
  async updateCustomerProfile(userId, profileData) {
    if (!userId) return { success: false, error: 'User ID is required' };

    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred while updating profile' };
    }
  }
};
