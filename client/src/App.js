import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Simulation from './pages/Simulation';
import Visualizer from './pages/Visualizer';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
}

export default App;