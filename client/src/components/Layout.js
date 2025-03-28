import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

const Layout = ({ children }) => {
  //   return (
  //     <div className="layout">
  //       <aside className="sidebar">
  //         <h2 className="sidebar-title">Wildfire Simulator</h2>
  //         <nav>
  //           <ul className="sidebar-menu">
  //             <li><Link to="/">Home</Link></li>
  //             <li><Link to="/simulation">Simulation</Link></li>
  //             <li><Link to="/upload-json">Predictio</Link></li>
  //             <li><Link to="/visualizer">Visualizer</Link></li>
  //             <li><Link to="/dashboard">Dashboard</Link></li>
  //           </ul>
  //         </nav>
  //       </aside>
  //       <main className="main-content">
  //         {children}
  //       </main>
  //     </div>
  //   );
  // };




  return (
    <div className="flex min-h-screen bg-blue-950">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 p-6">
        <div className="flex items-center mb-10">
          <Flame className="mr-2 text-blue-400" size={30} />
          <h2 className="text-xl font-bold text-blue-100">Wildfire App</h2>
        </div>
        
        <nav>
          <ul className="sidebar-menu">
            <li>
              <Link 
                to="/"
                className="block py-3 px-4 bg-sky-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-300 mb-2"
                //font weight
                style={{ fontWeight: 'bold' }}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/simulation"
                className="block py-3 px-4 bg-sky-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-300 mb-2"
                style={{ fontWeight: 'bold' }}
              >
                Simulation
              </Link>
            </li>
            <li>
              <Link 
                to="/upload-json"
                className="block py-3 px-4 bg-sky-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-300 mb-2"
                style={{ fontWeight: 'bold' }}>
                Prediction
              </Link>
            </li>
            <li>
              <Link 
                to="/visualizer"
                className="block py-3 px-4 bg-sky-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-300 mb-2"
                style={{ fontWeight: 'bold' }}
              >
                Visualizer
              </Link>
            </li>
            <li>
              <Link 
                to="/dashboard"
                className="block py-3 px-4 bg-sky-100 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-300 mb-2"
                style={{ fontWeight: 'bold' }}
              >
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;