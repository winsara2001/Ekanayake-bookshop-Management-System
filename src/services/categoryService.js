import { supabase } from '../lib/supabase';

export const categoryService = {
  /**
   * Fetches all active categories (for customers/dropdowns).
   */
  async getAllCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching active categories:', error.message);
      return { success: false, error: 'Unable to load categories.' };
    }
  },

  /**
   * Fetches all categories for management (admin/staff).
   */
  async getAllCategoriesForManagement() {
    try {
      // Get all categories along with their book count
      const { data, error } = await supabase
        .from('categories')
        .select('*, books(count)')
        .order('name');
      if (error) throw error;

      // Transform books(count) to a flat number
      const transformedData = data.map(c => ({
        ...c,
        books_count: c.books && c.books.length > 0 ? c.books[0].count : 0
      }));

      return { success: true, data: transformedData };
    } catch (error) {
      console.error('Error fetching categories for management:', error.message);
      return { success: false, error: 'Unable to load categories.' };
    }
  },

  /**
   * Creates a new category.
   */
  async createCategory(categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: categoryData.name.trim(),
          description: categoryData.description?.trim(),
          is_active: categoryData.is_active ?? true
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // unique violation
          return { success: false, error: 'This category already exists.' };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error creating category:', error.message);
      return { success: false, error: 'Unable to create category.' };
    }
  },

  /**
   * Updates an existing category.
   */
  async updateCategory(id, categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name.trim(),
          description: categoryData.description?.trim(),
          is_active: categoryData.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'This category name already exists.' };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating category:', error.message);
      return { success: false, error: 'Unable to update category.' };
    }
  },

  /**
   * Deactivates or activates a category.
   */
  async setCategoryActiveStatus(id, isActive) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error setting category active status:', error.message);
      return { success: false, error: 'Unable to update category status.' };
    }
  }
};
