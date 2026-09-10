import { supabase } from '../lib/supabase';

export const orderService = {
  /**
   * Place a new order using the secure RPC
   */
  async placeOrder(paymentMethod, items, notes = '', loyaltyPointsToRedeem = 0) {
    try {
      // Map items for RPC
      const mappedItems = items.map(item => ({
        book_id: item.id,
        quantity: item.quantity
      }));

      const { data, error } = await supabase.rpc('place_customer_order', {
        p_payment_method: paymentMethod,
        p_notes: notes,
        p_items: mappedItems,
        p_loyalty_points_to_redeem: loyaltyPointsToRedeem
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error placing order:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch orders for the currently authenticated customer
   */
  async getMyOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            line_total,
            book_title_snapshot
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching my orders:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch a specific order by ID for the customer
   */
  async getMyOrderById(orderId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            book_id,
            book_title_snapshot,
            unit_price,
            quantity,
            line_total,
            book:books(cover)
          )
        `)
        .eq('order_number', orderId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching order by id:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch all orders for staff/admin
   */
  async getAllOrders() {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const ordersData = orders || [];
      const customerIds = [...new Set(ordersData.map(o => o.customer_id).filter(Boolean))];

      if (customerIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('customer_profiles')
          .select('id, first_name, last_name, phone')
          .in('id', customerIds);

        if (!profileError && profiles) {
          const profileMap = {};
          profiles.forEach(p => {
            profileMap[p.id] = p;
          });

          ordersData.forEach(order => {
            order.customer_profile = profileMap[order.customer_id] || null;
          });
        }
      }

      return { success: true, data: ordersData };
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch latest stock for items in cart to sync
   */
  async syncCartStock(cartItems) {
    if (!cartItems || cartItems.length === 0) return { success: true, data: [] };
    
    try {
      const bookIds = cartItems.map(item => item.id);
      const { data, error } = await supabase
        .from('books')
        .select('id, title, stock, is_active')
        .in('id', bookIds);
        
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error syncing cart stock:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update the status of an order (Staff/Admin)
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Confirm pay at shop payment (Staff/Admin)
   */
  async confirmPayAtShopPayment(orderId) {
    try {
      const { data, error } = await supabase.rpc('confirm_pay_at_shop_payment', {
        p_order_id: orderId
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cancel order (Customer)
   */
  async cancelOrder(orderId) {
    try {
      const { data, error } = await supabase.rpc('cancel_customer_order', {
        p_order_id: orderId
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  }
};
