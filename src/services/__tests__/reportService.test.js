import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportService } from '../reportService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const createQueryMock = (data) => {
  const query = Promise.resolve({ data, error: null });
  query.select = vi.fn().mockReturnValue(query);
  query.eq = vi.fn().mockReturnValue(query);
  query.gte = vi.fn().mockReturnValue(query);
  query.lte = vi.fn().mockReturnValue(query);
  query.order = vi.fn().mockReturnValue(query);
  query.limit = vi.fn().mockReturnValue(query);
  query.in = vi.fn().mockReturnValue(query);
  return query;
};

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4. TEST SALES SUMMARY', () => {
    it('calculates total orders, completed, cancelled, revenue, and average correctly', async () => {
      const mockOrders = [
        { status: 'COMPLETED', total_amount: 2000 },
        { status: 'COMPLETED', total_amount: 3000 },
        { status: 'CANCELLED', total_amount: 5000 },
        { status: 'PENDING', total_amount: 1000 }
      ];
      supabase.from.mockReturnValue(createQueryMock(mockOrders));

      const result = await reportService.getSalesReportSummary();
      expect(result.totalOrders).toBe(4);
      expect(result.completedOrders).toBe(2);
      expect(result.cancelledOrders).toBe(1);
      expect(result.totalRevenue).toBe(5000);
      expect(result.averageOrderValue).toBe(2500);
    });
  });

  describe('5. TEST ZERO COMPLETED ORDERS', () => {
    it('handles zero completed orders without NaN or division-by-zero', async () => {
      const mockOrders = [
        { status: 'PENDING', total_amount: 1000 },
        { status: 'CANCELLED', total_amount: 5000 }
      ];
      supabase.from.mockReturnValue(createQueryMock(mockOrders));

      const result = await reportService.getSalesReportSummary();
      expect(result.completedOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });
  });

  describe('6. TEST ORDER STATUS BREAKDOWN', () => {
    it('returns accurate breakdown of order statuses', async () => {
      const mockOrders = [
        { status: 'PENDING' }, { status: 'PENDING' },
        { status: 'CONFIRMED' },
        { status: 'READY_FOR_COLLECTION' },
        { status: 'COMPLETED' }, { status: 'COMPLETED' }, { status: 'COMPLETED' },
        { status: 'CANCELLED' }
      ];
      supabase.from.mockReturnValue(createQueryMock(mockOrders));

      const result = await reportService.getOrderStatusBreakdown();
      const findStatus = (status) => result.find(r => r.name === status)?.value || 0;

      expect(findStatus('PENDING')).toBe(2);
      expect(findStatus('CONFIRMED')).toBe(1);
      expect(findStatus('READY_FOR_COLLECTION')).toBe(1);
      expect(findStatus('COMPLETED')).toBe(3);
      expect(findStatus('CANCELLED')).toBe(1);
    });
  });

  describe('7. TEST PAYMENT METHOD BREAKDOWN', () => {
    it('aggregates payment method revenue based on COMPLETED orders only', async () => {
      const mockOrders = [
        { status: 'COMPLETED', payment_method: 'PAY_AT_SHOP', total_amount: 2000 },
        { status: 'COMPLETED', payment_method: 'MOCK_CARD', total_amount: 3000 },
        { status: 'PENDING', payment_method: 'PAY_AT_SHOP', total_amount: 1000 }
      ];
      supabase.from.mockReturnValue(createQueryMock(mockOrders));

      const result = await reportService.getPaymentMethodBreakdown();
      const shop = result.find(r => r.name === 'Pay at Shop');
      const card = result.find(r => r.name === 'Card Payment');

      expect(shop.count).toBe(2);
      expect(shop.revenue).toBe(2000);

      expect(card.count).toBe(1);
      expect(card.revenue).toBe(3000);
    });
  });

  describe('8. TEST DAILY SALES TREND', () => {
    it('trends only completed orders correctly grouped by date', async () => {
      const mockOrders = [
        { status: 'COMPLETED', created_at: '2026-08-10T10:00:00Z', total_amount: 1000 },
        { status: 'COMPLETED', created_at: '2026-08-10T14:00:00Z', total_amount: 2000 },
        { status: 'COMPLETED', created_at: '2026-08-11T09:00:00Z', total_amount: 1500 },
        { status: 'CANCELLED', created_at: '2026-08-11T12:00:00Z', total_amount: 5000 }
      ];
      supabase.from.mockReturnValue(createQueryMock(mockOrders));

      const result = await reportService.getSalesTrend();
      
      const day1 = result.find(r => r.date === '2026-08-10');
      expect(day1.orders).toBe(2);
      expect(day1.revenue).toBe(3000);

      const day2 = result.find(r => r.date === '2026-08-11');
      expect(day2.orders).toBe(1);
      expect(day2.revenue).toBe(1500);
    });
  });

  describe('9. TEST TOP SELLING BOOKS', () => {
    it('aggregates quantities and line totals for top selling books', async () => {
      const mockOrderItems = [
        { book_title_snapshot: 'Book A', quantity: 2, line_total: 2000 },
        { book_title_snapshot: 'Book A', quantity: 3, line_total: 3000 },
        { book_title_snapshot: 'Book B', quantity: 1, line_total: 1500 }
      ];
      supabase.from.mockReturnValue(createQueryMock(mockOrderItems));

      const result = await reportService.getTopSellingBooks();
      
      expect(result[0].title).toBe('Book A');
      expect(result[0].quantity).toBe(5);
      expect(result[0].revenue).toBe(5000);

      expect(result[1].title).toBe('Book B');
      expect(result[1].quantity).toBe(1);
      expect(result[1].revenue).toBe(1500);
    });
  });

  describe('10. TEST DATE RANGE HELPER', () => {
    it('formats date bounds correctly and handles nulls', () => {
      const { from, to } = reportService._formatDateRange(null, null);
      expect(from).toBeNull();
      expect(to).toBeNull();

      const { from: fromDate, to: toDate } = reportService._formatDateRange('2026-08-10', '2026-08-10');
      expect(fromDate).toContain('2026-08');
      expect(toDate).toContain('2026-08');
    });
  });
});
