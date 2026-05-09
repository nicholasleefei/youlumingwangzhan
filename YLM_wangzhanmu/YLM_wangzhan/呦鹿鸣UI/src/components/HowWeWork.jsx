import React from 'react';
import './HowWeWork.css';

const steps = [
  {
    number: 1,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 23L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Requirements Inquiry',
    description: 'Understand your needs and recommend suitable vehicle models'
  },
  {
    number: 2,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 18H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 24H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Contract Signing',
    description: 'Confirm order details and sign procurement contract'
  },
  {
    number: 3,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 3L20 12L29 14L22 21L24 30L16 25L8 30L10 21L3 14L12 12L16 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Vehicle Procurement',
    description: 'Procure from factory with quality inspection'
  },
  {
    number: 4,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M22 4H6C4.89543 4 4 4.89543 4 6V26C4 27.1046 4.89543 28 6 28H26C27.1046 28 28 27.1046 28 26V10L22 4Z" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="12" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    title: 'Export Customs Declaration',
    description: 'Handle export procedures and customs declaration'
  },
  {
    number: 5,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 2L3 20L16 30L29 20L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'International Logistics',
    description: 'Sea/land transportation with full tracking'
  },
  {
    number: 6,
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M27 11L19 19L13 13L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M27 11H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M27 11V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Destination Delivery',
    description: 'Customs clearance and vehicle delivery'
  }
];

const HowWeWork = () => {
  return (
    <section className="how-we-work">
      <div className="logo-watermark">
        <img src="/logo.png" alt=""/>
      </div>
      <div className="star-field"></div>
      <div className="decoration-sphere"></div>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">How We Work</h2>
          <p className="section-subtitle">Professional auto export service process from China to global markets</p>
        </div>

        <div className="process-timeline">
          <div className="timeline-line"></div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="process-step"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="step-icon-wrapper">
                  <div className="step-icon">
                    {step.icon}
                  </div>
                  <span className="step-number">{step.number}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowWeWork;
