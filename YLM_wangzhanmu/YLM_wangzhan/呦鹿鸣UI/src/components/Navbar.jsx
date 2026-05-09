import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ scrolled }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="brand-logo">
              <div className="logo-circle">
                <img src="/logo.png" alt="Youluming" className="logo-img" />
              </div>
              <div className="brand-text">
                <h1>Youluming</h1>
                <p>呦鹿鸣</p>
              </div>
            </div>
          </div>

          <nav className="navbar-menu desktop-menu">
            <ul className="nav-list">
              <li><a href="#home" className="nav-link active">Home</a></li>
              <li><a href="#brands" className="nav-link">Brands</a></li>
              <li><a href="#categories" className="nav-link">Categories</a></li>
            </ul>
          </nav>

          <div className="navbar-right">
            <div className="language-selector">
              <span className="language-text">English</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className={`menu-line ${mobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`menu-line ${mobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`menu-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <ul className="mobile-nav-list">
            <li><a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
            <li><a href="#brands" onClick={() => setMobileMenuOpen(false)}>Brands</a></li>
            <li><a href="#categories" onClick={() => setMobileMenuOpen(false)}>Categories</a></li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
