import { supabase } from '../lib/supabase';

const BOOK_SELECT = '*, category:category_id(id, name), author:author_id(id, name)';

export const bookService = {
  /**
   * Fetches all books from the database.
   */
  async getAllBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(BOOK_SELECT)
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching all books:', error.message);
      return { success: false, error: 'Unable to load books right now. Please try again.' };
    }
  },

  /**
   * Fetches a specific book by ID.
   */
  async getBookById(id) {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(BOOK_SELECT)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Book Not Found' };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error(`Error fetching book ${id}:`, error.message);
      return { success: false, error: 'Unable to load book details right now. Please try again.' };
    }
  },

  /**
   * Fetches featured books.
   */
  async getFeaturedBooks(limit = 4) {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(BOOK_SELECT)
        .eq('is_active', true)
        .eq('featured', true)
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching featured books:', error.message);
      return { success: false, error: 'Unable to load featured books right now. Please try again.' };
    }
  },

  /**
   * Fetches best seller books.
   */
  async getBestSellerBooks(limit = 4) {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(BOOK_SELECT)
        .eq('is_active', true)
        .eq('bestseller', true)
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching best seller books:', error.message);
      return { success: false, error: 'Unable to load best seller books right now. Please try again.' };
    }
  },

  /**
   * Fetches books in a specific category (useful for related books).
   */
  async getBooksByCategory(categoryId, excludeId, limit = 4) {
    try {
      let query = supabase
        .from('books')
        .select(BOOK_SELECT)
        .eq('is_active', true)
        .eq('category_id', categoryId)
        .limit(limit);
        
      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error(`Error fetching books in category ${categoryId}:`, error.message);
      return { success: false, error: 'Unable to load related books right now. Please try again.' };
    }
  },

  /**
   * Fetches all books for management (admin/staff).
   * Includes inactive books.
   */
  async getAllBooksForManagement() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select(BOOK_SELECT)
        .order('id', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching all books for management:', error.message);
      return { success: false, error: 'Unable to load books.' };
    }
  },

  /**
   * Creates a new book.
   */
  async createBook(bookData) {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([{
          title: bookData.title.trim(),
          category: bookData.category || '',
          author: bookData.author || '',
          category_id: bookData.category_id,
          author_id: bookData.author_id,
          price: bookData.price,
          cover: bookData.cover || null,
          rating: bookData.rating || 0,
          stock: 0, // Stock strictly initialized to 0
          featured: bookData.featured || false,
          bestseller: bookData.bestseller || false,
          is_active: bookData.is_active ?? true
        }])
        .select(BOOK_SELECT)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating book:', error.message);
      return { success: false, error: 'Unable to create book.' };
    }
  },

  /**
   * Updates an existing book.
   */
  async updateBook(id, bookData) {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({
          title: bookData.title.trim(),
          category: bookData.category || '',
          author: bookData.author || '',
          category_id: bookData.category_id,
          author_id: bookData.author_id,
          price: bookData.price,
          cover: bookData.cover || null,
          featured: bookData.featured || false,
          bestseller: bookData.bestseller || false,
          is_active: bookData.is_active
        })
        .eq('id', id)
        .select(BOOK_SELECT)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating book:', error.message);
      return { success: false, error: 'Unable to update book.' };
    }
  },

  /**
   * Deactivates or activates a book.
   */
  async setBookActiveStatus(id, isActive) {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({ is_active: isActive })
        .eq('id', id)
        .select(BOOK_SELECT)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error setting book active status:', error.message);
      return { success: false, error: 'Unable to update book status.' };
    }
  }
};
