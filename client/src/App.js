import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Simulation from './pages/Simulation';
import Visualizer from './pages/Visualizer';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Simulation />} /> {/* Default route */}
      </Routes>
    </div>
  );
}

export default App;