import { supabase } from '../lib/supabase';

export const purchaseOrderService = {
  /**
   * Fetch all Purchase Orders, optionally filtered by status or search text.
   */
  async getPurchaseOrders() {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name, is_active),
          created_by_user:staff_profiles!created_by(first_name, last_name),
          approved_by_user:staff_profiles!approved_by(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching POs:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch a single PO by ID, including its items and related book data.
   */
  async getPurchaseOrderById(id) {
    try {
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers(name, contact_person, email, phone, is_active),
          created_by_user:staff_profiles!created_by(first_name, last_name),
          approved_by_user:staff_profiles!approved_by(first_name, last_name),
          cancelled_by_user:staff_profiles!cancelled_by(first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (poError) throw poError;

      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          books(title, isbn, author_id, authors(name))
        `)
        .eq('purchase_order_id', id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      return { success: true, data: { ...po, items } };
    } catch (error) {
      console.error('Error fetching PO:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Create a new DRAFT Purchase Order with items.
   * Uses a two-step process: Create PO -> Insert Items.
   */
  async createPurchaseOrder(poData, itemsData) {
    try {
      // 1. Create the PO
      const { data: newPo, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          supplier_id: poData.supplier_id,
          expected_date: poData.expected_date || null,
          supplier_reference: poData.supplier_reference || null,
          notes: poData.notes || null
        }])
        .select()
        .single();

      if (poError) throw poError;

      // 2. Insert the Items
      if (itemsData && itemsData.length > 0) {
        const itemsToInsert = itemsData.map(item => ({
          purchase_order_id: newPo.id,
          book_id: item.book_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          // If item insert fails, we should ideally rollback. We can attempt to delete the orphaned PO.
          await supabase.from('purchase_orders').delete().eq('id', newPo.id);
          throw itemsError;
        }
      }

      return { success: true, data: newPo };
    } catch (error) {
      console.error('Error creating PO:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update an existing DRAFT Purchase Order and its items.
   */
  async updatePurchaseOrder(id, poData, currentItems, newItems) {
    try {
      // 1. Update PO Header
      const { error: poError } = await supabase
        .from('purchase_orders')
        .update({
          supplier_id: poData.supplier_id,
          expected_date: poData.expected_date || null,
          supplier_reference: poData.supplier_reference || null,
          notes: poData.notes || null
        })
        .eq('id', id);

      if (poError) throw poError;

      // 2. Synchronize Items
      // For simplicity in a real app without transactions, we can delete all old items and insert the new ones,
      // OR we can perform targeted inserts/updates/deletes. Since items have triggers that recalculate total, 
      // deleting and re-inserting is safest if the list is small. 
      // However, we will do a targeted sync to be more robust.
      
      const currentItemIds = currentItems.map(i => i.id);
      const newItemIds = newItems.map(i => i.id).filter(Boolean);
      
      // Items to delete
      const idsToDelete = currentItemIds.filter(id => !newItemIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase.from('purchase_order_items').delete().in('id', idsToDelete);
      }

      // Items to update and insert
      for (const item of newItems) {
        if (item.id) {
          // Update existing
          await supabase.from('purchase_order_items').update({
            quantity: item.quantity,
            unit_cost: item.unit_cost
          }).eq('id', item.id);
        } else {
          // Insert new
          await supabase.from('purchase_order_items').insert([{
            purchase_order_id: id,
            book_id: item.book_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost
          }]);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating PO:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Securely Approve a Purchase Order via RPC
   */
  async approvePurchaseOrder(id) {
    try {
      const { error } = await supabase.rpc('approve_purchase_order', {
        p_po_id: id
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error approving PO:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Securely Cancel a Purchase Order via RPC
   */
  async cancelPurchaseOrder(id) {
    try {
      const { error } = await supabase.rpc('cancel_purchase_order', {
        p_po_id: id
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cancelling PO:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Securely Receive Books for a Purchase Order via RPC
   */
  async receivePurchaseOrder(id, items, note) {
    try {
      const { error } = await supabase.rpc('receive_purchase_order', {
        p_po_id: id,
        p_items: items,
        p_note: note || null
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error receiving PO:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Fetch receipt history for a given Purchase Order
   */
  async getPurchaseOrderReceipts(id) {
    try {
      const { data, error } = await supabase
        .from('purchase_order_receipts')
        .select(`
          *,
          received_by_user:staff_profiles!received_by(first_name, last_name),
          items:purchase_order_receipt_items(
            *,
            books(title, isbn)
          )
        `)
        .eq('purchase_order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching receipts:', error.message);
      return { success: false, error: error.message };
    }
  }
};
