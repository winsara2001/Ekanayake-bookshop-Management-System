import React, { useState, useEffect } from 'react';
import { 
  format, subDays, startOfMonth, endOfMonth, 
  startOfDay, endOfDay 
} from 'date-fns';
import { 
  FiDownload, FiPrinter, FiCalendar 
} from 'react-icons/fi';
import { reportService } from '../../services/reportService';
import './SalesReports.css';

const SalesReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range state
  const [dateRangeType, setDateRangeType] = useState('LAST_30_DAYS');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Report Data State
  const [summary, setSummary] = useState(null);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [paymentStatusBreakdown, setPaymentStatusBreakdown] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [dateRangeType, customFrom, customTo]);

  const getDateRange = () => {
    const today = new Date();
    switch (dateRangeType) {
      case 'TODAY':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'LAST_7_DAYS':
        return { from: startOfDay(subDays(today, 7)), to: endOfDay(today) };
      case 'LAST_30_DAYS':
        return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
      case 'THIS_MONTH':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'ALL_TIME':
        return { from: null, to: null };
      case 'CUSTOM':
        return { 
          from: customFrom ? startOfDay(new Date(customFrom)) : null, 
          to: customTo ? endOfDay(new Date(customTo)) : null 
        };
      default:
        return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
    }
  };

  const fetchReportData = async () => {
    if (dateRangeType === 'CUSTOM' && (!customFrom || !customTo)) {
      return; // wait for both dates
    }

    try {
      setLoading(true);
      setError(null);
      const { from, to } = getDateRange();

      const [
        sumData, statusData, payMethodData, 
        payStatusData, trendData, booksData, recentData
      ] = await Promise.all([
        reportService.getSalesReportSummary(from, to),
        reportService.getOrderStatusBreakdown(from, to),
        reportService.getPaymentMethodBreakdown(from, to),
        reportService.getPaymentStatusBreakdown(from, to),
        reportService.getSalesTrend(from, to),
        reportService.getTopSellingBooks(from, to, 5),
        reportService.getRecentCompletedSales(from, to, 10)
      ]);

      setSummary(sumData);
      setStatusBreakdown(statusData);
      setPaymentBreakdown(payMethodData);
      setPaymentStatusBreakdown(payStatusData);
      setSalesTrend(trendData);
      setTopBooks(booksData);
      setRecentSales(recentData);

    } catch (err) {
      console.error('Report fetch error:', err);
      setError('Failed to load sales report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!recentSales.length) {
      alert("No data available to export.");
      return;
    }

    const headers = ['Order Number', 'Date', 'Customer', 'Payment Method', 'Payment Status', 'Order Status', 'Total Amount (LKR)'];
    
    const rows = recentSales.map(order => [
      order.order_number,
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
      order.customerName.replace(/,/g, ''), // remove commas for safe CSV
      order.payment_method,
      order.payment_status,
      order.status,
      order.total_amount
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'CANCELLED': return 'status-cancelled';
      case 'CONFIRMED': return 'status-confirmed';
      case 'READY_FOR_COLLECTION': return 'status-ready';
      default: return 'status-pending';
    }
  };

  if (loading && !summary) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading Report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-reports-container">
        <div className="alert-error" style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          {error}
        </div>
      </div>
    );
  }

  // Find max revenue for chart scaling
  const maxTrendRevenue = salesTrend.length > 0 
    ? Math.max(...salesTrend.map(t => t.revenue)) 
    : 0;

  return (
    <div className="sales-reports-container">
      <div className="report-header">
        <div>
          <h1>Sales Reports</h1>
          <p style={{ color: 'var(--color-text-light)' }}>
            Analytics based on existing order and payment data.
          </p>
        </div>

        <div className="report-actions">
          <div className="date-filter-group">
            <label><FiCalendar /> Period</label>
            <select 
              className="date-filter-select"
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value)}
            >
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="ALL_TIME">All Time</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {dateRangeType === 'CUSTOM' && (
            <>
              <div className="date-filter-group">
                <label>From Date</label>
                <input 
                  type="date" 
                  className="date-input" 
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="date-filter-group">
                <label>To Date</label>
                <input 
                  type="date" 
                  className="date-input" 
                  value={customTo}
                  min={customFrom}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100%', paddingBottom: '4px' }}>
            <button className="export-btn" onClick={handleExportCSV}>
              <FiDownload /> Export CSV
            </button>
            <button className="print-btn" onClick={handlePrint}>
              <FiPrinter /> Print Report
            </button>
          </div>
        </div>
      </div>

      {!summary || (summary.totalOrders === 0 && summary.completedOrders === 0 && summary.cancelledOrders === 0) ? (
        <div className="no-data">
          No sales data available for the selected period.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Total Orders</div>
              <div className="kpi-value">{summary.totalOrders}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Completed Orders</div>
              <div className="kpi-value highlight">{summary.completedOrders}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Cancelled Orders</div>
              <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>{summary.cancelledOrders}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Total Sales Revenue</div>
              <div className="kpi-value highlight">
                LKR {Number(summary.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-title">Avg Order Value</div>
              <div className="kpi-value">
                LKR {Number(summary.averageOrderValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="reports-grid">
            {/* Daily Trend Chart */}
            <div className="report-panel" style={{ gridColumn: '1 / -1' }}>
              <h3>Daily Sales Trend (Completed Orders)</h3>
              {salesTrend.length === 0 ? (
                <div className="no-data">No completed sales to chart.</div>
              ) : (
                <div className="simple-bar-chart">
                  {salesTrend.map((point) => {
                    const heightPercent = maxTrendRevenue > 0 ? (point.revenue / maxTrendRevenue) * 100 : 0;
                    return (
                      <div key={point.date} className="bar-container">
                        <div 
                          className="bar" 
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <div className="bar-label">{format(new Date(point.date), 'MMM dd')}</div>
                        <div className="bar-tooltip">
                          <div>{format(new Date(point.date), 'MMM dd, yyyy')}</div>
                          <div>Orders: {point.orders}</div>
                          <div>Revenue: LKR {point.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Status Breakdown */}
            <div className="report-panel">
              <h3>Order Status Breakdown</h3>
              <div className="status-breakdown-list">
                {statusBreakdown.map(stat => (
                  <div key={stat.name} className="status-item">
                    <span className={`status-badge ${getStatusColor(stat.name)}`}>{stat.name}</span>
                    <span style={{ fontWeight: 'bold' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="report-panel">
              <h3>Payment Method Breakdown</h3>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Orders</th>
                      <th>Revenue (Completed)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentBreakdown.map(pb => (
                      <tr key={pb.name}>
                        <td>{pb.name}</td>
                        <td>{pb.count}</td>
                        <td>LKR {pb.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {paymentBreakdown.length === 0 && (
                      <tr><td colSpan="3" className="no-data">No payment data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Selling Books */}
            <div className="report-panel">
              <h3>Top Selling Books (Completed Orders)</h3>
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Qty Sold</th>
                      <th>Sales Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBooks.map(book => (
                      <tr key={book.title}>
                        <td title={book.title}>{book.title.length > 40 ? book.title.substring(0, 40) + '...' : book.title}</td>
                        <td>{book.quantity}</td>
                        <td>LKR {book.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {topBooks.length === 0 && (
                      <tr><td colSpan="3" className="no-data">No top selling data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Status Breakdown */}
            <div className="report-panel">
              <h3>Payment Status Breakdown</h3>
              <div className="status-breakdown-list">
                {paymentStatusBreakdown.map(stat => (
                  <div key={stat.name} className="status-item">
                    <span className="status-badge" style={{ background: '#f3f4f6', color: '#1f2937' }}>{stat.name}</span>
                    <span style={{ fontWeight: 'bold' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Completed Sales Table */}
          <div className="report-panel" style={{ marginBottom: '2rem' }}>
            <h3>Recent Completed Sales</h3>
            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: '500' }}>{order.order_number}</td>
                      <td>{format(new Date(order.created_at), 'MMM dd, HH:mm')}</td>
                      <td>{order.customerName}</td>
                      <td>{order.payment_method === 'PAY_AT_SHOP' ? 'Pay at Shop' : 'Card'}</td>
                      <td><span className="status-badge status-completed">{order.status}</span></td>
                      <td style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>
                        LKR {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {recentSales.length === 0 && (
                    <tr><td colSpan="6" className="no-data">No recent completed sales.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesReports;
