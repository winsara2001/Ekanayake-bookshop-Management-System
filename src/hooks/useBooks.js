import { useState, useEffect } from 'react';
import { bookService } from '../services/bookService';

export const useBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const result = await bookService.getAllBooks();
        
        if (result.success) {
          setBooks(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('An unexpected error occurred while fetching books.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return { books, loading, error };
};
