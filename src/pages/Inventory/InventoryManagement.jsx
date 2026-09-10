import { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiEdit, FiClock } from 'react-icons/fi';
import { inventoryService } from '../../services/inventoryService';
import AdjustStockModal from './components/AdjustStockModal';
import InventoryHistory from './components/InventoryHistory';

const InventoryManagement = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, In Stock, Low Stock, Out of Stock
  
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'history'
  
  const [adjustModalBook, setAdjustModalBook] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const res = await inventoryService.getInventoryBooks();
    if (res.success) {
      setBooks(res.data);
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  const handleAdjustSuccess = () => {
    setAdjustModalBook(null);
    fetchInventory();
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      // Status Filter
      const status = inventoryService.getStockStatus(b.stock, b.low_stock_threshold);
      if (statusFilter !== 'All' && status !== statusFilter) return false;
      
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const titleMatch = b.title?.toLowerCase().includes(query);
        const authorMatch = b.author?.name?.toLowerCase().includes(query);
        const catMatch = b.category?.name?.toLowerCase().includes(query);
        if (!titleMatch && !authorMatch && !catMatch) return false;
      }
      
      return true;
    });
  }, [books, statusFilter, searchQuery]);

  // Status counters
  const counts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    
    books.forEach(b => {
      const status = inventoryService.getStockStatus(b.stock, b.low_stock_threshold);
      if (status === 'Out of Stock') outOfStock++;
      else if (status === 'Low Stock') lowStock++;
      else inStock++;
    });
    
    return {
      all: books.length,
      inStock,
      lowStock,
      outOfStock
    };
  }, [books]);

  return (
    <main className="admin-page section">
      <div className="container">
        <div className="admin-header">
          <h1>Inventory Management</h1>
        </div>

        <div className="admin-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
          <button 
            className={`admin-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
            style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', borderBottom: activeTab === 'inventory' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'inventory' ? 'bold' : 'normal' }}
          >
            Current Stock
          </button>
          <button 
            className={`admin-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            style={{ background: 'none', border: 'none', padding: '0.75rem 1.5rem', cursor: 'pointer', borderBottom: activeTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'history' ? 'bold' : 'normal' }}
          >
            Transaction History
          </button>
        </div>

        {activeTab === 'inventory' && (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={statCardStyle} onClick={() => setStatusFilter('All')}>
                <h4 style={statLabelStyle}>Total Books</h4>
                <div style={statValueStyle}>{counts.all}</div>
              </div>
              <div style={{...statCardStyle, ...(statusFilter === 'In Stock' ? activeStatStyle : {})}} onClick={() => setStatusFilter('In Stock')}>
                <h4 style={statLabelStyle}>In Stock</h4>
                <div style={{...statValueStyle, color: '#10b981'}}>{counts.inStock}</div>
              </div>
              <div style={{...statCardStyle, ...(statusFilter === 'Low Stock' ? activeStatStyle : {})}} onClick={() => setStatusFilter('Low Stock')}>
                <h4 style={statLabelStyle}>Low Stock</h4>
                <div style={{...statValueStyle, color: '#f59e0b'}}>{counts.lowStock}</div>
              </div>
              <div style={{...statCardStyle, ...(statusFilter === 'Out of Stock' ? activeStatStyle : {})}} onClick={() => setStatusFilter('Out of Stock')}>
                <h4 style={statLabelStyle}>Out of Stock</h4>
                <div style={{...statValueStyle, color: '#ef4444'}}>{counts.outOfStock}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="admin-filters">
              <div className="search-bar">
                <FiSearch />
                <input 
                  type="text" 
                  placeholder="Search books, authors, categories..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="form-input" 
                style={{ width: 'auto' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
              <div className="page-loader">Loading inventory...</div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Threshold</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.length > 0 ? (
                      filteredBooks.map(book => {
                        const status = inventoryService.getStockStatus(book.stock, book.low_stock_threshold);
                        let statusColor = '#10b981'; // In stock
                        if (status === 'Out of Stock') statusColor = '#ef4444';
                        else if (status === 'Low Stock') statusColor = '#f59e0b';
                        
                        return (
                          <tr key={book.id}>
                            <td>
                              <img src={book.cover} alt={book.title} style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                            </td>
                            <td>{book.title}</td>
                            <td>{book.category?.name}</td>
                            <td style={{ fontWeight: 'bold' }}>{book.stock}</td>
                            <td>{book.low_stock_threshold}</td>
                            <td>
                              <span style={{ 
                                display: 'inline-block', 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '999px', 
                                fontSize: '0.8rem',
                                backgroundColor: `${statusColor}20`,
                                color: statusColor,
                                fontWeight: 'bold'
                              }}>
                                {status}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn-icon edit" 
                                  title="Adjust Stock"
                                  onClick={() => setAdjustModalBook(book)}
                                >
                                  <FiEdit /> Adjust
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                          No books found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <InventoryHistory />
        )}
      </div>

      {adjustModalBook && (
        <AdjustStockModal 
          book={adjustModalBook} 
          onClose={() => setAdjustModalBook(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </main>
  );
};

const statCardStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  border: '2px solid transparent'
};

const activeStatStyle = {
  borderColor: 'var(--color-primary)'
};

const statLabelStyle = {
  margin: '0 0 0.5rem 0',
  color: '#64748b',
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const statValueStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#0f172a'
};

export default InventoryManagement;
