  import React from 'react';
  import { Droplet, Flame } from 'lucide-react';

  const LandingPage = () => {
    return (
      <div className=""
      
      //center the element with style
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}      
      >
        
        {/* Gradient Overlay Animation */}
        <div className=" inset-0 bg-gradient-to-br from-blue-900 via-blue-950 to-black 
          opacity-50 animate-gradient-x z-0"></div>

        {/* Content Container */}
        <div className=""
          
          //increase the size of the element
          style={{
            width: '700px',
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            borderRadius: '20px',
            padding: '20px',
            backgroundColor: 'rgba(23, 78, 196, 0.41)',
            backdropFilter: 'blur(10px)',
            //add shadow
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            //add border  
            border: '1px solid rgba(255, 255, 255, 0.18)',
            //add animation
            animation: 'fadeIn 0.5s forwards',
            animationDelay: '0.5s',

            }}
          >
          {/* Decorative Flame Icons */}
          <div className="absolute -top-8 left-4 text-blue-300 opacity-50 animate-float">
            <Flame size={80} />
          </div>
          <div className="absolute -bottom-8 right-4 text-blue-300 opacity-50 animate-float-reverse">
            <Droplet size={80} />
          </div>

          {/* Main Content */}
          <h1 className="text-5xl font-extrabold text-blue-200 mb-4 
            animate-fade-in-down tracking-tight">
            Wildfire Prediction Simulator
          </h1>
          <p className="text-2xl text-blue-100 mb-8 
            animate-fade-in-up opacity-0 animate-delay-500">
            Analyze, Visualize, and Predict Wildfire Risks
          </p>
          
          {/* CTA Button */}
          {/* <button className="bg-blue-600 text-white px-8 py-3 rounded-full 
            hover:bg-blue-700 transition-all duration-300 
            transform hover:-translate-y-1 hover:shadow-lg
            animate-pulse-slow">
            Get Started
          </button> */}
        </div>

        {/* Custom Animations */}
        <style jsx>{`
          @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatAnimation {
            0%, 100% { transform: translateY(0) rotate(-5deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes floatReverseAnimation {
            0%, 100% { transform: translateY(0) rotate(5deg); }
            50% { transform: translateY(20px) rotate(-5deg); }
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
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradientAnimation 15s ease infinite;
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