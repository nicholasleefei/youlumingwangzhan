import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="hero-background">
        <div className="gradient-sphere"></div>
        <div className="stars">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>
      </div>
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            DRIVE THE FUTURE WITH <span className="text-gradient">CHINA AUTO</span>
          </h1>
          <p className="hero-description">
            Focused on compliant operations and efficient services, we provide stable and reliable bulk procurement solutions of Chinese automobiles for global auto dealers and individuals
          </p>
          <div className="hero-cta">
            <a href="#models" className="btn btn-primary">
              Browse Hot Models
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#contact" className="btn btn-outline">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
