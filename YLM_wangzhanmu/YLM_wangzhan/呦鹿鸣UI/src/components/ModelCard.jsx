import React from 'react';
import './ModelCard.css';

const ModelCard = ({ brand, name, isHot, delay = 0 }) => {
  return (
    <div
      className="model-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="model-image-container">
        <div className="no-image-placeholder">
          <svg className="car-silhouette" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 38 C8 30 12 22 20 22 L35 22 L45 18 L70 18 L80 22 L96 22 C104 22 108 28 108 36 L108 42 C108 48 104 52 98 52 L110 52 L110 56 L10 56 L10 52 L2 52 L2 42 L8 42 Z" />
            <ellipse cx="28" cy="52" rx="10" ry="10" />
            <ellipse cx="88" cy="52" rx="10" ry="10" />
            <path d="M20 30 L95 30" stroke="currentColor" strokeOpacity="0.5" />
          </svg>
          <span className="placeholder-text">No Image Available</span>
        </div>
        {isHot && <span className="hot-badge">HOT</span>}
      </div>
      <div className="model-info">
        <h3 className="model-brand">{brand}</h3>
        <p className="model-name">{name}</p>
        <div className="model-actions">
          <button className="btn-details">View Details</button>
          <button className="btn-inquiry">Add to Inquiry</button>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
