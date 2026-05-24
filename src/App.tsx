import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DiskForensics from './pages/DiskForensics';
import DataAnalytics from './pages/DataAnalytics';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<DiskForensics />} />
        <Route path="/analytics" element={<DataAnalytics />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
