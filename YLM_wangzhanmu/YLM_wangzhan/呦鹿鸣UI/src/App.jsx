import React, { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HotModels from './components/HotModels';
import HowWeWork from './components/HowWeWork';
import GlobalCoverage from './components/GlobalCoverage';
import Consultation from './components/Consultation';
import Footer from './components/Footer';

function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      <Navbar scrolled={scrolled} />
      <Hero />
      <HotModels />
      <HowWeWork />
      <GlobalCoverage />
      <Consultation />
      <Footer />
    </div>
  );
}

export default App;
