
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className={`${fullWidth ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between transition-all duration-500`}>
          <div className="flex items-center gap-4">
            <div className="thv-logo shadow-lg">
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
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Version</span>
              <span className="text-xs font-bold text-treebo-brown">v3.4.1 (Enterprise)</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-8">
        <div className={`${fullWidth ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto transition-all duration-500`}>
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className={`${fullWidth ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto px-4 text-center space-y-4 transition-all duration-500`}>
           <div className="thv-logo mx-auto opacity-20 grayscale">
              <div className="bg-treebo-brown">T</div>
              <div className="bg-treebo-orange">H</div>
              <div className="bg-treebo-brown">V</div>
            </div>
          <p className="text-sm font-medium text-slate-400">
            &copy; {new Date().getFullYear()} Treebo Hotels Ventures. Proprietary Strategy Engine.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
