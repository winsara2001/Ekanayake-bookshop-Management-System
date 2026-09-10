import { Link } from 'react-router-dom';
import { categoryData } from '../../pages/Categories/Categories';
import './Categories.css';

const Categories = () => {
  return (
    <div className="sidebar-categories">
      <div className="sidebar-categories-header">
        <h3>CATEGORIES</h3>
      </div>
      <ul className="sidebar-categories-list">
        {categoryData.slice(0, 10).map((cat) => (
          <li key={cat.name}>
            <Link to={`/shop?category=${cat.name}`}>
              {cat.name}
              <span className="cat-arrow">&gt;</span>
            </Link>
          </li>
        ))}
        <li>
          <Link to="/categories" className="more-categories">
            <span className="cat-plus">+</span> More Categories
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Categories;
