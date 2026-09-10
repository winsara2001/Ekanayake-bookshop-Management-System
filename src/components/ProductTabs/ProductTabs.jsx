import React, { useState } from 'react';
import BookCard from '../BookCard/BookCard';
import { useBooks } from '../../hooks/useBooks';
import './ProductTabs.css';

const ProductTabs = () => {
  const { books, loading } = useBooks();
  const [activeTab, setActiveTab] = useState('FEATURED');

  if (loading) return <div>Loading...</div>;

  const getBooksForTab = () => {
    switch (activeTab) {
      case 'FEATURED': return books.filter(b => b.featured).slice(0, 4);
      case 'MOST VIEWED': return books.slice(2, 6);
      case 'ON SALE': return books.slice(1, 5);
      default: return books.slice(0, 4);
    }
  };

  const currentBooks = getBooksForTab();

  return (
    <div className="product-tabs-section">
      <div className="product-tabs-header">
        {['FEATURED', 'MOST VIEWED', 'ON SALE'].map(tab => (
          <button 
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="product-tabs-content">
        <div className="book-grid">
          {currentBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductTabs;
