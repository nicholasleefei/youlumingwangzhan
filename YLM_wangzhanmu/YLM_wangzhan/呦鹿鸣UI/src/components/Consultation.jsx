import React from 'react';
import './Consultation.css';

const Consultation = () => {
  return (
    <section className="consultation">
      <div className="star-field"></div>
      <div className="decoration-sphere"></div>
      <div className="container">
        <div className="consultation-card">
          <div className="consultation-avatar">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces"
              alt="Consultant"
            />
            <div className="whatsapp-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 21L4.5 16.5C2.5 13.5 2 10 3.5 6.5C5 3 8.5 0 12 0C15.5 0 19 3 20.5 6.5C22 10 21.5 13.5 19.5 16.5L21 21L16.5 19.5C13.5 21.5 10.5 21.5 7.5 19.5L3 21Z" fill="#22c55e"/>
                <path d="M16.5 14.1C16.1 13.7 14.8 13.1 14.5 13C14.2 12.9 14 12.8 13.8 13.1C13.6 13.4 13.1 14 12.9 14.2C12.7 14.4 12.5 14.5 12.2 14.3C11.9 14.1 11.1 13.6 10.2 12.7C9.4 11.9 8.8 11 8.6 10.7C8.4 10.4 8.6 10.2 8.8 10C9 9.8 9.1 9.6 9.2 9.4C9.3 9.2 9.4 8.9 9.6 8.6C9.8 8.3 9.7 8.1 9.6 7.9C9.5 7.7 8.9 6.4 8.6 5.8C8.3 5.2 8 5.3 7.8 5.3C7.6 5.3 7.3 5.3 7 5.3C6.7 5.3 6.2 5.5 5.8 5.9C5.4 6.3 4.8 6.9 4.8 8C4.8 9.1 5.6 10.6 6.7 11.9C7.8 13.2 10 14.7 12.1 15C12.9 15.2 13.6 15.2 14.2 15.1C14.8 15 16 14.5 16.4 13.9C16.8 13.3 16.9 12.7 16.8 12.5C16.7 12.3 16.6 14.1 16.5 14.1Z" fill="white"/>
              </svg>
            </div>
          </div>
          <div className="consultation-content">
            <h3 className="consultation-title">
              Book a free 30-minute strategy session. We'll analyze your current workflows and identify the highest-ROI automation opportunities for your business.
            </h3>
            <a href="https://wa.me/+86" className="btn-consultation">
              Schedule a Session
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10H16M16 10L10 4M16 10L10 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Consultation;
