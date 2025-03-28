import React from 'react';
import { Flame, Droplet } from 'lucide-react';

const LandingPage = () => {
  const menuItems = ['Home', 'Simulation', 'Prediction', 'Visualizer', 'Dashboard'];

  return (
    <div className="flex min-h-screen bg-blue-950">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 p-6">
        <div className="flex items-center mb-10">
          <Flame className="mr-2 text-blue-400" size={30} />
          <h2 className="text-xl font-bold text-blue-100">Wildfire App</h2>
        </div>
        <nav>
          {menuItems.map((item) => (
            <div 
              key={item} 
              className="py-3 text-blue-200 hover:text-blue-50 cursor-pointer 
              transition-colors duration-200"
            >
              {item}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center relative overflow-hidden">
        {/* Decorative Icons */}
        <div className="absolute -top-10 left-10 text-blue-500/30 animate-float">
          <Flame size={100} />
        </div>
        <div className="absolute -bottom-10 right-10 text-blue-500/30 animate-float-reverse">
          <Droplet size={100} />
        </div>

        {/* Content Card */}
        <div className="bg-blue-900/60 backdrop-blur-sm rounded-2xl p-12 text-center max-w-xl w-full relative z-10">
          <h1 className="text-5xl font-extrabold text-blue-200 mb-4 
            animate-fade-in-down tracking-tight">
            Wildfire Prediction Simulator
          </h1>
          <p className="text-2xl text-blue-100 mb-8 
            animate-fade-in-up opacity-0 animate-delay-500">
            Analyze, Visualize, and Predict Wildfire Risks
          </p>
          
          <button className="bg-blue-600 text-white px-8 py-3 rounded-full 
            hover:bg-blue-700 transition-all duration-300 
            transform hover:-translate-y-1 hover:shadow-lg
            animate-pulse-slow">
            Get Started
          </button>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes floatAnimation {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes floatReverseAnimation {
          0%, 100% { transform: translateY(0) rotate(5deg); }
          50% { transform: translateY(30px) rotate(-5deg); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-float { animation: floatAnimation 4s ease-in-out infinite; }
        .animate-float-reverse { animation: floatReverseAnimation 4s ease-in-out infinite; }
        .animate-fade-in-down { animation: fadeInDown 1s forwards; }
        .animate-fade-in-up { animation: fadeInUp 1s forwards; }
        .animate-pulse-slow { animation: pulseSlow 2s ease-in-out infinite; }
        .animate-delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
};

export default LandingPage;