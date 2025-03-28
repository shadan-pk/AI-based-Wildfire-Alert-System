import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2 className="sidebar-title">Wildfire Simulator</h2>
        <nav>
          <ul className="sidebar-menu">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/simulation">Simulation</Link></li>
            <li><Link to="/visualizer">Visualizer</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;