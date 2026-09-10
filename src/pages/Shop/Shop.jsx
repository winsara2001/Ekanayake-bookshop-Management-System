import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FiSearch, FiFilter, FiX, FiFrown } from 'react-icons/fi';
import { useBooks } from '../../hooks/useBooks';
import { categoryService } from '../../services/categoryService';
import { authorService } from '../../services/authorService';
import BookCard from '../../components/BookCard/BookCard';
import './Shop.css';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const { books, loading, error } = useBooks();

  const location = useLocation();
  const searchInputRef = useRef(null);

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [availability, setAvailability] = useState('All'); // 'All', 'In Stock', 'Out of Stock'
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'price-low', 'price-high', 'title-az', 'rating', 'bestselling'

  // Sync selectedCategory and search if URL changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
    const search = searchParams.get('search');
    if (search !== null) {
      setSearchQuery(search);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location.state?.focusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [location.state]);
  
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [dbCategories, setDbCategories] = useState([]);
  const [dbAuthors, setDbAuthors] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      const [catRes, authRes] = await Promise.all([
        categoryService.getAllCategories(),
        authorService.getAllAuthors()
      ]);
      if (catRes.success) setDbCategories(catRes.data);
      if (authRes.success) setDbAuthors(authRes.data);
    };
    fetchFilters();
  }, []);

  // Derived filter options using real table data
  const categories = useMemo(() => ['All', ...dbCategories.map(c => c.name)], [dbCategories]);
  const authors = useMemo(() => ['All', ...dbAuthors.map(a => a.name)], [dbAuthors]);
  
  // Find highest price for the range slider
  const maxPossiblePrice = useMemo(() => {
    return books.length > 0 ? Math.max(...books.map(b => b.price)) : 10000;
  }, [books]);

  // Set initial max price once books load
  useEffect(() => {
    if (books.length > 0 && maxPrice === 10000) {
      setMaxPrice(maxPossiblePrice);
    }
  }, [books, maxPossiblePrice, maxPrice]);

  // Filtering & Sorting Logic
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search (title, author)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        b => {
          const authorName = b.author?.name || b.author || '';
          return b.title.toLowerCase().includes(query) || 
                 authorName.toLowerCase().includes(query);
        }
      );
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter(b => {
        const catName = b.category?.name || b.category;
        return catName === selectedCategory;
      });
    }

    // Author
    if (selectedAuthor !== 'All') {
      result = result.filter(b => {
        const authName = b.author?.name || b.author;
        return authName === selectedAuthor;
      });
    }

    // Availability
    if (availability === 'In Stock') {
      result = result.filter(b => b.stock > 0);
    } else if (availability === 'Out of Stock') {
      result = result.filter(b => b.stock === 0);
    }

    // Price
    result = result.filter(b => b.price <= maxPrice);

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'title-az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'bestselling':
        // Sort by bestseller flag first
        result.sort((a, b) => (b.bestseller === a.bestseller ? 0 : b.bestseller ? 1 : -1));
        break;
      case 'featured':
      default:
        // Sort by featured flag first
        result.sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1));
        break;
    }

    return result;
  }, [books, searchQuery, selectedCategory, selectedAuthor, availability, maxPrice, sortBy]);

  const hasActiveFilters = 
    selectedCategory !== 'All' || 
    selectedAuthor !== 'All' || 
    availability !== 'All' || 
    searchQuery !== '' ||
    maxPrice < maxPossiblePrice;

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedAuthor('All');
    setAvailability('All');
    setMaxPrice(maxPossiblePrice);
  };

  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
    // Prevent background scrolling when filter is open
    document.body.style.overflow = !isMobileFilterOpen ? 'hidden' : 'auto';
  };

  // Clean up body overflow if unmounted
  useEffect(() => {
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading shop...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '4rem', color: 'red' }}>Error: {error}</div>;

  return (
    <main className="shop-page">
      <div className="container">
        <div className="shop-header">
          <h1 className="shop-title">Shop Books</h1>
          <p className="shop-subtitle">Explore our collection and find the perfect book for you.</p>
        </div>

        <div className="shop-layout">
          {/* Mobile Overlay */}
          <div 
            className={`mobile-filter-overlay ${isMobileFilterOpen ? 'open' : ''}`} 
            onClick={toggleMobileFilter}
          />

          {/* Sidebar */}
          <aside className={`shop-sidebar ${isMobileFilterOpen ? 'open' : ''}`}>
            <div className="filter-header-mobile">
              <h3>Filters</h3>
              <button className="close-filter-btn" onClick={toggleMobileFilter}>
                <FiX />
              </button>
            </div>

            {/* Category Filter */}
            <div className="filter-section">
              <h4 className="filter-title">Category</h4>
              <ul className="filter-list">
                {categories.map(category => (
                  <li key={category}>
                    <label className="filter-label">
                      <input 
                        type="radio" 
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                      />
                      {category}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability Filter */}
            <div className="filter-section">
              <h4 className="filter-title">Availability</h4>
              <ul className="filter-list">
                {['All', 'In Stock', 'Out of Stock'].map(status => (
                  <li key={status}>
                    <label className="filter-label">
                      <input 
                        type="radio" 
                        name="availability"
                        checked={availability === status}
                        onChange={() => setAvailability(status)}
                      />
                      {status === 'All' ? 'All Books' : status}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Author Filter */}
            <div className="filter-section">
              <h4 className="filter-title">Author</h4>
              <select 
                className="sort-select" 
                style={{ width: '100%' }}
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
              >
                {authors.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="filter-section">
              <h4 className="filter-title">Max Price</h4>
              <div className="price-range-container">
                <input 
                  type="range" 
                  min="0" 
                  max={maxPossiblePrice} 
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="price-slider"
                />
                <div className="price-values">
                  <span>Rs. 0</span>
                  <span>Rs. {maxPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="shop-content">
            {/* Top Controls */}
            <div className="shop-controls">
              <div className="search-wrapper">
                <FiSearch className="search-icon" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search by title or author..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value) {
                      searchParams.set('search', e.target.value);
                    } else {
                      searchParams.delete('search');
                    }
                    setSearchParams(searchParams);
                  }}
                />
              </div>

              <div className="controls-row">
                <button className="mobile-filter-btn" onClick={toggleMobileFilter}>
                  <FiFilter /> Filters
                </button>

                <div className="sort-wrapper">
                  <span className="sort-label">Sort by:</span>
                  <select 
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="bestselling">Best Selling</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="title-az">Title: A-Z</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Header */}
            <div className="results-info">
              <span>Showing <strong>{filteredBooks.length}</strong> books</span>
              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={handleClearFilters}>
                  <FiX /> Clear Filters
                </button>
              )}
            </div>

            {/* Book Grid or Empty State */}
            {filteredBooks.length > 0 ? (
              <div className="book-grid">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FiFrown className="empty-icon" />
                <h3 className="empty-title">No books found</h3>
                <p className="empty-subtitle">Try changing your search or filters to find what you're looking for.</p>
                <button className="btn btn-primary" onClick={handleClearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Shop;
