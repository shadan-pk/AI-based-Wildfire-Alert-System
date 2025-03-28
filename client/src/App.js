import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Simulation from './pages/Simulation';
import Visualizer from './pages/Visualizer';
import Dashboard from './pages/Dashboard';
import UploadJson from './pages/UploadJson';


function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload-json" element={<UploadJson />} />
      </Routes>
    </Layout>
  );
}

export default App;