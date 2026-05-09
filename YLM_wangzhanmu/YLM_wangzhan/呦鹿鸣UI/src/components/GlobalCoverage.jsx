import React from 'react';
import './GlobalCoverage.css';

const GlobalCoverage = () => {
  const regions = [
    'Middle East',
    'Central Asia',
    'Southeast Asia',
    'Africa',
    'South America',
    'Europe',
    'Oceania'
  ];

  return (
    <section className="global-coverage">
      <div className="star-field"></div>
      <div className="decoration-sphere decoration-sphere-1"></div>
      <div className="decoration-sphere decoration-sphere-2"></div>
      <div className="container">
        <div className="coverage-content">
          <h2 className="section-title">Global Market Coverage</h2>
          <p className="coverage-description">
            Our auto export business covers Middle East, Central Asia, Southeast Asia, Africa, South America and more regions worldwide
          </p>
          <div className="regions-grid">
            {regions.map((region, index) => (
              <div
                key={region}
                className="region-tag"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {region}
              </div>
            ))}
          </div>
          <div className="coverage-stats">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Countries</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Vehicles Exported</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5+</div>
              <div className="stat-label">Years Experience</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalCoverage;
