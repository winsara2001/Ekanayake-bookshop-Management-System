import { supabase } from '../lib/supabase';
import { format, startOfDay, endOfDay } from 'date-fns';

export const reportService = {
  /**
   * Helper to ensure dates are in correct ISO format for querying
   */
  _formatDateRange(dateFrom, dateTo) {
    // If dates are provided, ensure they cover the full day boundaries
    const from = dateFrom ? startOfDay(new Date(dateFrom)).toISOString() : null;
    const to = dateTo ? endOfDay(new Date(dateTo)).toISOString() : null;
    return { from, to };
  },

  /**
   * Get all orders within a date range for general aggregation
   */
  async getOrdersData(dateFrom, dateTo) {
    const { from, to } = this._formatDateRange(dateFrom, dateTo);

    let query = supabase
      .from('orders')
      .select('id, status, payment_method, payment_status, total_amount, created_at, order_number');

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get KPI Summary metrics
   */
  async getSalesReportSummary(dateFrom, dateTo) {
    const orders = await this.getOrdersData(dateFrom, dateTo);

    let totalOrders = orders.length;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;

    orders.forEach(order => {
      if (order.status === 'COMPLETED') {
        completedOrders++;
        totalRevenue += Number(order.total_amount) || 0;
      } else if (order.status === 'CANCELLED') {
        cancelledOrders++;
      }
    });

    const averageOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders) : 0;

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      averageOrderValue
    };
  },

  /**
   * Get breakdown of order statuses
   */
  async getOrderStatusBreakdown(dateFrom, dateTo) {
    const orders = await this.getOrdersData(dateFrom, dateTo);
    const breakdown = {
      PENDING: 0,
      CONFIRMED: 0,
      READY_FOR_COLLECTION: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    orders.forEach(order => {
      if (breakdown[order.status] !== undefined) {
        breakdown[order.status]++;
      } else {
        breakdown[order.status] = 1;
      }
    });

    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  },

  /**
   * Get payment method breakdown (count and revenue)
   */
  async getPaymentMethodBreakdown(dateFrom, dateTo) {
    const orders = await this.getOrdersData(dateFrom, dateTo);
    const breakdown = {};

    orders.forEach(order => {
      const method = order.payment_method;
      if (!breakdown[method]) {
        breakdown[method] = { method, count: 0, revenue: 0 };
      }
      breakdown[method].count++;

      // Revenue only from COMPLETED orders
      if (order.status === 'COMPLETED') {
        breakdown[method].revenue += Number(order.total_amount) || 0;
      }
    });

    return Object.values(breakdown).map(item => ({
      name: item.method === 'PAY_AT_SHOP' ? 'Pay at Shop' :
        item.method === 'MOCK_CARD' ? 'Card Payment' : item.method,
      ...item
    }));
  },

  /**
   * Get payment status breakdown
   */
  async getPaymentStatusBreakdown(dateFrom, dateTo) {
    const orders = await this.getOrdersData(dateFrom, dateTo);
    const breakdown = {};

    orders.forEach(order => {
      const status = order.payment_status;
      if (!breakdown[status]) {
        breakdown[status] = 0;
      }
      breakdown[status]++;
    });

    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  },

  /**
   * Get daily sales trend for COMPLETED orders
   */
  async getSalesTrend(dateFrom, dateTo) {
    const orders = await this.getOrdersData(dateFrom, dateTo);
    const completedOrders = orders.filter(o => o.status === 'COMPLETED');

    // Group by day
    const trendMap = {};

    completedOrders.forEach(order => {
      const dateStr = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { date: dateStr, orders: 0, revenue: 0 };
      }
      trendMap[dateStr].orders++;
      trendMap[dateStr].revenue += Number(order.total_amount) || 0;
    });

    // Sort by date ascending
    return Object.values(trendMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  /**
   * Get Top Selling Books from COMPLETED orders
   */
  async getTopSellingBooks(dateFrom, dateTo, limit = 10) {
    const { from, to } = this._formatDateRange(dateFrom, dateTo);

    // Using !inner join in PostgREST to filter order_items based on their parent order status and date
    let query = supabase
      .from('order_items')
      .select(`
        book_title_snapshot,
        quantity,
        line_total,
        orders!inner(status, created_at)
      `)
      .eq('orders.status', 'COMPLETED');

    if (from) query = query.gte('orders.created_at', from);
    if (to) query = query.lte('orders.created_at', to);

    const { data, error } = await query;
    if (error) throw error;

    const bookMap = {};
    (data || []).forEach(item => {
      const title = item.book_title_snapshot;
      if (!bookMap[title]) {
        bookMap[title] = { title, quantity: 0, revenue: 0 };
      }
      bookMap[title].quantity += Number(item.quantity) || 0;
      bookMap[title].revenue += Number(item.line_total) || 0;
    });

    return Object.values(bookMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  },

  /**
   * Get recent completed sales with customer details
   */
  async getRecentCompletedSales(dateFrom, dateTo, limit = 50) {
    const { from, to } = this._formatDateRange(dateFrom, dateTo);

    // Fetch completed orders
    let query = supabase
      .from('orders')
      .select('id, order_number, customer_id, payment_method, payment_status, status, total_amount, created_at')
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data: orders, error: ordersError } = await query;
    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) return [];

    // Extract unique customer IDs
    const customerIds = [...new Set(orders.map(o => o.customer_id))];

    // Fetch customer profiles safely
    const { data: profiles, error: profilesError } = await supabase
      .from('customer_profiles')
      .select('id, first_name, last_name')
      .in('id', customerIds);

    if (profilesError) {
      console.warn('Could not fetch customer profiles:', profilesError);
    }

    const profileMap = {};
    (profiles || []).forEach(p => {
      profileMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown Customer';
    });

    return orders.map(order => ({
      ...order,
      customerName: profileMap[order.customer_id] || 'Unknown Customer'
    }));
  }
};
