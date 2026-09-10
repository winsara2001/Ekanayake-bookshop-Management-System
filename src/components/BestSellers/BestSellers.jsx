import { Link } from 'react-router-dom';
import { useBooks } from '../../hooks/useBooks';
import './BestSellers.css';
import { FiStar } from 'react-icons/fi';

const BestSellers = () => {
  const { books, loading, error } = useBooks();

  if (loading) return <div>Loading best sellers...</div>;
  if (error) return <div>Error loading books</div>;

  const bestSellers = books.filter((b) => b.bestseller).slice(0, 3);

  return (
    <div className="sidebar-bestsellers">
      <h3 className="sidebar-title">BEST SELLERS</h3>
      <div className="sidebar-bestsellers-list">
        {bestSellers.map((book) => (
          <div key={book.id} className="sidebar-book-item">
            <Link to={`/books/${book.id}`} className="sidebar-book-img">
              <img src={book.cover} alt={book.title} />
            </Link>
            <div className="sidebar-book-info">
              <div className="sidebar-book-rating">
                <FiStar className="star-filled" /><FiStar className="star-filled" /><FiStar className="star-filled" /><FiStar className="star-filled" /><FiStar />
              </div>
              <Link to={`/books/${book.id}`} className="sidebar-book-title">{book.title}</Link>
              <div className="sidebar-book-price">Rs. {book.price.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BestSellers;
