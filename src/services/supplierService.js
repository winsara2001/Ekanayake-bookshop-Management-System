import { supabase } from '../lib/supabase';
import { adminService } from './adminService';

export const supplierService = {
  /**
   * Fetch all suppliers.
   */
  async getSuppliers() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching suppliers:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch a single supplier by ID.
   */
  async getSupplierById(id) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching supplier:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new supplier.
   */
  async createSupplier(supplierData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating supplier:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an existing supplier.
   */
  async updateSupplier(id, updates) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating supplier:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Securely deactivate a supplier via the Admin RPC.
   */
  async deactivateSupplier(id) {
    try {
      const { error } = await supabase.rpc('set_supplier_active_status', {
        p_supplier_id: id,
        p_is_active: false
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deactivating supplier:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Securely reactivate a supplier via the Admin RPC.
   */
  async reactivateSupplier(id) {
    try {
      const { error } = await supabase.rpc('set_supplier_active_status', {
        p_supplier_id: id,
        p_is_active: true
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error reactivating supplier:', error.message);
      return { success: false, error: error.message };
    }
  }
};
