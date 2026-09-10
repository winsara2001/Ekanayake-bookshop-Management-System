import BookCard from '../BookCard/BookCard';
import { useBooks } from '../../hooks/useBooks';

const HotSale = () => {
  const { books, loading, error } = useBooks();

  if (loading) return <div>Loading hot sale...</div>;
  if (error) return <div>Error loading hot sale</div>;

  // Use books that are on sale or randomly slice
  const hotSaleBooks = books.slice(4, 7);

  return (
    <div className="home-section">
      <div className="section-title-wrapper">
        <h3 className="koparion-section-title">HOT SALE</h3>
      </div>
      <div className="book-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {hotSaleBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default HotSale;
