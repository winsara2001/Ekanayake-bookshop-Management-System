import BookCard from '../BookCard/BookCard';
import { useBooks } from '../../hooks/useBooks';
import './FeaturedBooks.css';

const FeaturedBooks = () => {
  const { books, loading, error } = useBooks();

  if (loading) return <div>Loading new books...</div>;
  if (error) return <div>Error loading books: {error}</div>;

  const newBooks = books.slice(0, 4);

  return (
    <div className="home-section">
      <div className="section-title-wrapper">
        <h3 className="koparion-section-title">NEW BOOKS</h3>
      </div>
      <div className="book-grid">
        {newBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedBooks;
