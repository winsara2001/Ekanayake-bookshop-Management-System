import { supabase } from '../lib/supabase';

export const adminService = {
  /**
   * Invokes the secure admin-users edge function.
   * Automatically passes the current user's session JWT.
   */
  async invokeAdminFunction(action, payload = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action, payload }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Unknown error occurred.');

      return { success: true, data: data.data };
    } catch (error) {
      console.error(`Error in admin-users [${action}]:`, error.message);
      return { success: false, error: error.message || 'Unable to perform admin action.' };
    }
  },

  /**
   * Fetches all users from the system securely.
   */
  async getAllUsers() {
    return this.invokeAdminFunction('list');
  },

  /**
   * Assigns an existing customer as staff.
   */
  async assignCustomerToStaff(userId, role = 'inventory_manager') {
    return this.invokeAdminFunction('assign_staff', { userId, role });
  },

  /**
   * Updates a staff member's role (e.g. promote to admin).
   */
  async updateStaffRole(userId, role) {
    return this.invokeAdminFunction('update_role', { userId, role });
  },

  /**
   * Activates or deactivates a staff member.
   */
  async setStaffActiveStatus(userId, is_active) {
    return this.invokeAdminFunction('set_active_status', { userId, is_active });
  },

  /**
   * Deletes a staff member (removes staff access).
   */
  async deleteStaff(userId) {
    return this.invokeAdminFunction('delete_staff', { userId });
  },

  /**
   * Gets Dashboard summary metrics efficiently using exact counts.
   */
  async getDashboardMetrics() {
    try {
      // Fetch books count directly and users via edge function to bypass RLS
      const [booksRes, usersRes] = await Promise.all([
        supabase.from('books').select('*', { count: 'exact', head: true }),
        this.getAllUsers()
      ]);

      let totalCustomers = 0;
      let activeStaff = 0;

      if (usersRes.success) {
        totalCustomers = usersRes.data.filter(u => u.account_type === 'Customer').length;
        activeStaff = usersRes.data.filter(u => u.account_type !== 'Customer' && u.is_active).length;
      }

      return {
        success: true,
        data: {
          totalBooks: booksRes.count || 0,
          totalCustomers: totalCustomers,
          activeStaff: activeStaff,
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error.message);
      return { success: false, error: 'Unable to load dashboard metrics.' };
    }
  }
};
