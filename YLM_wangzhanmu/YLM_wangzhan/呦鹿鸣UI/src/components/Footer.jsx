import React from 'react';
import './Footer.css';

const socialLinks = [
  { name: 'TikTok', icon: '𝕥', url: '#' },
  { name: 'Facebook', icon: 'f', url: '#' },
  { name: 'Instagram', icon: 'IG', url: '#' },
  { name: 'LinkedIn', icon: 'in', url: '#' },
  { name: 'YouTube', icon: '▶', url: '#' },
];

const Footer = () => {
  return (
    <footer className="footer" id="contact">
      <div className="decoration-sphere"></div>
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-circle">
                <img src="/logo.png" alt="Youluming" className="logo-img" />
              </div>
              <div className="brand-text">
                <h2>Youluming</h2>
                <p>呦鹿鸣</p>
              </div>
            </div>
            <p className="brand-desc">
              Professional auto bulk export services, connecting global markets
            </p>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><a href="#models">Hot Models Library</a></li>
              <li><a href="#inquiry">Bulk Inquiry</a></li>
              <li><a href="#about">About Us</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-contact">
              <li>
                <span className="contact-label">Email:</span>
                <span className="contact-value">business@youluming.com</span>
              </li>
              <li>
                <span className="contact-label">WhatsApp:</span>
                <span className="contact-value">+86 xxx xxxx xxxx</span>
              </li>
              <li>
                <span className="contact-label">Location:</span>
                <span className="contact-value">Shanghai, China</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © {new Date().getFullYear()} Youluming. All rights reserved
          </p>
          <div className="social-links">
            <span className="follow-text">Follow Us:</span>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                className="social-link"
                aria-label={social.name}
              >
                <span>{social.icon}</span> {social.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
