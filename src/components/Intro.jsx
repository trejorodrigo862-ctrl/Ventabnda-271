import React from 'react';

const Intro = ({ onDone }) => {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="https://videos.pexels.com/video-files/8098263/8098263-hd_1920_1080_25fps.mp4"
        // A backup video in case the primary one is unavailable
        onError={(e) => (e.currentTarget.src = 'https://videos.pexels.com/video-files/5904253/5904253-hd_1920_1080_25fps.mp4')}
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10" />
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center p-4">
        <div className="bg-black/30 backdrop-blur-sm p-8 rounded-2xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-4 animate-fade-in-down">
            Ventas Mc Banda
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 mb-8 animate-fade-in-up">
            Potenciando tu rendimiento de ventas.
          </p>
          <button
            onClick={onDone}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-300 animate-fade-in-up"
          >
            Ingresar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.4s forwards; opacity: 0; }
      `}</style>
    </div>
  );
};

export default Intro;
