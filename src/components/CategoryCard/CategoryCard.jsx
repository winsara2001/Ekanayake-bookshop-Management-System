import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import './CategoryCard.css';

const CategoryCard = ({ category, count = 0, variant = 'detailed' }) => {
  const { name, icon, description, color } = category;

  if (variant === 'simple') {
    return (
      <Link to={`/shop?category=${encodeURIComponent(name)}`} className="category-card-component variant-simple">
        <div
          className="category-icon-wrapper"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        <span className="category-card-title" style={{ fontSize: '1rem', marginBottom: 0 }}>{name}</span>
      </Link>
    );
  }

  return (
    <Link to={`/shop?category=${encodeURIComponent(name)}`} className="category-card-component variant-detailed">
      <div
        className="category-icon-wrapper"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      
      <h3 className="category-card-title">{name}</h3>
      <p className="category-card-description">{description}</p>
      
      <div className="category-card-footer">
        <span className="category-card-count">
          {count} {count === 1 ? 'Book' : 'Books'}
        </span>
        <span className="category-card-action">
          Browse Books <FiArrowRight />
        </span>
      </div>
    </Link>
  );
};

export default CategoryCard;
