import { supabase } from '../lib/supabase';

export const staffProfileService = {
  /**
   * Fetches the staff profile for a given user ID.
   */
  async getStaffProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null }; // No profile found
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching staff profile:', error.message);
      return { success: false, error: 'Unable to load staff profile.' };
    }
  }
};
