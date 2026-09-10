import { supabase } from '../lib/supabase';

const INVENTORY_SELECT = `
  id,
  title,
  author:author_id(id, name),
  category:category_id(id, name),
  stock,
  low_stock_threshold,
  price,
  cover,
  is_active
`;

export const inventoryService = {
  /**
   * Fetches books specifically formatted for inventory management
   */
  async getInventoryBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(INVENTORY_SELECT)
        .order('title');

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching inventory books:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Adjusts the stock of a book using the secure RPC
   */
  async adjustBookStock(bookId, adjustmentType, quantity, reason, referenceType = null, referenceId = null) {
    try {
      const { error } = await supabase.rpc('adjust_book_stock', {
        p_book_id: bookId,
        p_adjustment_type: adjustmentType,
        p_quantity: quantity,
        p_reason: reason,
        p_reference_type: referenceType,
        p_reference_id: referenceId
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adjusting book stock:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetches transaction history for a specific book or all books
   */
  async getInventoryHistory(bookId = null) {
    try {
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          book:books!inventory_transactions_book_id_fkey(title),
          performer:staff_profiles!inventory_transactions_created_by_fkey(first_name, last_name, role)
        `)
        .order('created_at', { ascending: false });

      if (bookId) {
        query = query.eq('book_id', bookId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching inventory history:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Helper function to determine stock status
   */
  getStockStatus(stock, threshold) {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= threshold) return 'Low Stock';
    return 'In Stock';
  }
};
