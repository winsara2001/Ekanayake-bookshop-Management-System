import { supabase } from '../lib/supabase';

export const authorService = {
  /**
   * Fetches all active authors (for customers/dropdowns).
   */
  async getAllAuthors() {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching active authors:', error.message);
      return { success: false, error: 'Unable to load authors.' };
    }
  },

  /**
   * Fetches all authors for management (admin/staff).
   */
  async getAllAuthorsForManagement() {
    try {
      const { data, error } = await supabase
        .from('authors')
        .select('*, books(count)')
        .order('name');
      if (error) throw error;

      // Transform books(count) to a flat number
      const transformedData = data.map(a => ({
        ...a,
        books_count: a.books && a.books.length > 0 ? a.books[0].count : 0
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching authors for management:', error.message);
      return { success: false, error: 'Unable to load authors.' };
    }
  },

  /**
   * Creates a new author.
   */
  async createAuthor(authorData) {
    try {
      const { data, error } = await supabase
        .from('authors')
        .insert([{
          name: authorData.name.trim(),
          bio: authorData.bio?.trim(),
          is_active: authorData.is_active ?? true
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // unique violation
          return { success: false, error: 'This author already exists.' };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error creating author:', error.message);
      return { success: false, error: 'Unable to create author.' };
    }
  },

  /**
   * Updates an existing author.
   */
  async updateAuthor(id, authorData) {
    try {
      const { data, error } = await supabase
        .from('authors')
        .update({
          name: authorData.name.trim(),
          bio: authorData.bio?.trim(),
          is_active: authorData.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'This author name already exists.' };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating author:', error.message);
      return { success: false, error: 'Unable to update author.' };
    }
  },

  /**
   * Deactivates or activates an author.
   */
  async setAuthorActiveStatus(id, isActive) {
    try {
      const { data, error } = await supabase
        .from('authors')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error setting author active status:', error.message);
      return { success: false, error: 'Unable to update author status.' };
    }
  }
};
