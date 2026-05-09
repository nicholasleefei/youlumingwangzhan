import React, { useState } from 'react';
import './HotModels.css';
import ModelCard from './ModelCard';

const categories = [
  'All', 'EV', 'Sedan', 'SUV', 'MPV', 'Coupe', 'Pickup', 'Van', 'Microvan', 'Light Bus'
];

const hotBrands = [
  { id: 1, name: '比亚迪', brand: '比亚迪', isHot: true },
  { id: 2, name: '极氪', brand: '极氪', isHot: true },
  { id: 3, name: '小米', brand: '小米', isHot: true },
  { id: 4, name: '特斯拉', brand: '特斯拉', isHot: false },
  { id: 5, name: '吉利', brand: '吉利', isHot: false },
  { id: 6, name: '长安', brand: '长安', isHot: false },
];

const HotModels = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <section className="hot-models" id="models">
      <div className="star-field"></div>
      <div className="decoration-sphere"></div>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">HOT</h2>
          <p className="section-subtitle">
            Focused on compliant operations and efficient services, we provide stable and reliable bulk procurement solutions of Chinese automobiles for global auto dealers and individuals
          </p>
        </div>

        <div className="category-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="models-grid">
          {hotBrands.map((brand, index) => (
            <ModelCard
              key={brand.id}
              brand={brand.brand}
              name={brand.name}
              isHot={brand.isHot}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HotModels;
