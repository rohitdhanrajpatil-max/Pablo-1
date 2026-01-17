
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col transition-colors duration-500 ${isFullscreen ? 'bg-white' : ''}`}>
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className={`${fullWidth ? 'w-full px-6 md:px-12' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-12'} h-20 flex items-center justify-between transition-all duration-500`}>
          <div className="flex items-center gap-4">
            <div className="thv-logo shadow-xl ring-1 ring-black/5">
              <div className="bg-treebo-brown">T</div>
              <div className="bg-treebo-orange">H</div>
              <div className="bg-treebo-brown">V</div>
            </div>
            <div>
              <h1 className="text-xl font-black text-treebo-brown tracking-tighter leading-none">
                TREEBO <span className="text-treebo-orange">HOTELS</span>
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Commercial & Strategy Unit</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <button 
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-treebo-brown no-print group relative"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 9L4 4m0 0l5 0m-5 0l0 5m11 0V4m0 0l-5 5m5-5h-5M9 15l-5 5m0 0h5m-5 0v-5m11 0l5 5m0 0h-5m5 0v-5" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen Dashboard"}
              </span>
            </button>
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Access</span>
              <span className="text-xs font-bold text-treebo-brown">v3.4.1 (STRAT-OS)</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className={`flex-grow ${fullWidth ? 'p-0' : 'p-4 md:p-8'}`}>
        <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'} transition-all duration-500`}>
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-12 no-print">
        <div className={`${fullWidth ? 'w-full px-6 md:px-12' : 'max-w-7xl mx-auto px-4'} flex flex-col items-center gap-6 transition-all duration-500`}>
           <div className="thv-logo opacity-20 grayscale scale-75">
              <div className="bg-treebo-brown">T</div>
              <div className="bg-treebo-orange">H</div>
              <div className="bg-treebo-brown">V</div>
            </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
              Proprietary Strategy Engine &bull; Treebo Hotels Ventures
            </p>
            <p className="text-[10px] font-bold text-slate-300 mt-2">
              Unauthorized reproduction is strictly prohibited under Enterprise Protocol 9.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
