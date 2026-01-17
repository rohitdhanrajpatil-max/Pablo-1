
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
    <div className={`min-h-screen bg-[#F8FAFC] flex flex-col transition-all duration-700 ${isFullscreen ? 'bg-white' : ''}`}>
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-[100] shadow-sm">
        <div className={`${fullWidth ? 'w-full px-6 md:px-12' : 'max-w-6xl mx-auto px-6'} h-16 flex items-center justify-between transition-all duration-500`}>
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="thv-logo shadow-lg ring-1 ring-slate-100 transition-transform group-hover:scale-105 duration-300 !w-10 !h-10">
              <div className="bg-treebo-brown text-xs">T</div>
              <div className="bg-treebo-orange text-xs">H</div>
              <div className="bg-treebo-brown text-xs">V</div>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <h1 className="text-lg font-black text-treebo-brown tracking-tighter leading-none">
                TREEBO <span className="text-treebo-orange">STRATOS</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1.5">
                Audit Engine 
                <span className="w-1 h-1 rounded-full bg-treebo-orange animate-pulse"></span>
                v3.4
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-treebo-orange transition-all text-slate-400 hover:text-treebo-orange no-print group relative"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isFullscreen ? "M9 9L4 4m0 0l5 0m-5 0l0 5m11 0V4m0 0l-5 5m5-5h-5" : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5"} />
              </svg>
            </button>
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">STRAT-NODE</span>
              <span className="text-[10px] font-bold text-treebo-brown mt-0.5">HQ-IND</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className={`flex-grow ${fullWidth ? 'p-0' : 'p-4 md:p-8'}`}>
        <div className={`${fullWidth ? 'w-full' : 'max-w-6xl mx-auto'} transition-all duration-500`}>
          {children}
        </div>
      </main>
      
      <footer className="bg-slate-900 border-t border-white/5 py-12 no-print mt-auto">
        <div className={`${fullWidth ? 'w-full px-6 md:px-12' : 'max-w-6xl mx-auto px-6'} flex flex-col items-center gap-4 transition-all duration-500`}>
          <div className="text-center space-y-2">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">
              Proprietary Strategy Ledger &bull; Treebo Hotels Ventures
            </p>
            <div className="flex items-center justify-center gap-4">
               <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">Protocol 9 Compliance</span>
               <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">Secure Audit Trail</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
