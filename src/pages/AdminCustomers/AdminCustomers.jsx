import { useState, useEffect } from 'react';
import { FiUsers, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import '../AdminBooks/AdminBooks.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter(c => {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim().toLowerCase();
    const phone = c.phone || '';
    const searchLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchLower) || phone.includes(searchLower);
  });

  return (
    <div className="admin-page section" style={{ padding: '0', minHeight: 'auto' }}>
      <div className="admin-header">
        <div>
          <h1>Customer Profiles</h1>
          <p className="admin-subtitle">View registered customers.</p>
        </div>
      </div>

      <div className="admin-filters">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="page-loader">Loading Customers...</div>
      ) : error ? (
        <div className="admin-error" style={{ margin: '2rem', padding: '2rem', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
          <h3 style={{ color: '#991b1b', marginBottom: '0.5rem' }}>Failed to Load Customers</h3>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan="4" className="text-center">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td className="font-medium" style={{ fontSize: '0.85rem' }}>{c.id.substring(0, 8)}</td>
                    <td>{`${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Customer'}</td>
                    <td>{c.phone || 'N/A'}</td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
