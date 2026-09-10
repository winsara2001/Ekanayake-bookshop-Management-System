import { useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Hero from '../../components/Hero/Hero';
import FeaturedBooks from '../../components/FeaturedBooks/FeaturedBooks';
import HotSale from '../../components/HotSale/HotSale';
import ProductTabs from '../../components/ProductTabs/ProductTabs';
import './Home.css';

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="home-page container">
      <div className="home-layout">
        <aside className="home-sidebar">
          <Sidebar />
        </aside>
        
        <div className="home-main-content">
          <Hero />
          <FeaturedBooks />
          <HotSale />
          <ProductTabs />
        </div>
      </div>
    </main>
  );
};

export default Home;
