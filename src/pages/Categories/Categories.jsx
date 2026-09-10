import { useEffect, useMemo, useState } from 'react';
import {
  FiBook,
  FiBookOpen,
  FiMonitor,
  FiBriefcase,
  FiSmile,
  FiTrendingUp,
} from 'react-icons/fi';
import { useBooks } from '../../hooks/useBooks';
import { categoryService } from '../../services/categoryService';
import CategoryCard from '../../components/CategoryCard/CategoryCard';
import './Categories.css';

// Master list of categories with visuals and descriptions
export const categoryData = [
  { 
    name: 'Fiction', 
    icon: <FiBook />, 
    color: '#E8D5B7',
    description: "Immerse yourself in imaginative stories, novels, and literature from around the world."
  },
  { 
    name: 'Education', 
    icon: <FiBookOpen />, 
    color: '#C8D5E0',
    description: "Academic textbooks, study guides, and educational materials for students and teachers."
  },
  { 
    name: "Children's Books", 
    icon: <FiSmile />, 
    color: '#D4E8D0',
    description: "Fun, engaging, and educational books designed specifically for young readers."
  },
  { 
    name: 'Technology', 
    icon: <FiMonitor />, 
    color: '#D5D0E8',
    description: "Explore programming, software engineering, computing and modern technology books."
  },
  { 
    name: 'Business', 
    icon: <FiBriefcase />, 
    color: '#E8D0D0',
    description: "Learn about entrepreneurship, management, finance, and career development."
  },
  { 
    name: 'Self Development', 
    icon: <FiTrendingUp />, 
    color: '#D0E0E8',
    description: "Books focused on personal growth, productivity, motivation, and mental well-being."
  },
];

const CategoriesPage = () => {
  const { books } = useBooks();
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { success, data } = await categoryService.getAllCategories();
      if (success) setDbCategories(data);
    };
    fetchCategories();
  }, []);

  // Calculate counts dynamically from mock data
  const categoryCounts = useMemo(() => {
    const counts = {};
    books.forEach(book => {
      const catName = book.category?.name || book.category;
      counts[catName] = (counts[catName] || 0) + 1;
    });
    return counts;
  }, [books]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="categories-page">
      <div className="container">
        <div className="categories-header">
          <h1 className="categories-title">Browse Book Categories</h1>
          <p className="categories-subtitle">
            Explore books by category and discover something new to read.
          </p>
        </div>

        <div className="categories-page-grid">
          {dbCategories.map(cat => {
            const catName = cat.name;
            const staticData = categoryData.find(c => c.name === catName);
            const categoryObj = {
              name: catName,
              icon: staticData ? staticData.icon : <FiBook />,
              color: staticData ? staticData.color : '#F0F0F0',
              description: cat.description || (staticData ? staticData.description : `Explore our collection of ${catName} books.`)
            };
            return (
              <CategoryCard 
                key={cat.id} 
                category={categoryObj} 
                count={categoryCounts[catName] || 0}
                variant="detailed"
              />
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default CategoriesPage;
