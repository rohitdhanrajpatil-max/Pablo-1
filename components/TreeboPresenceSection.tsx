
import React from 'react';
import { TreeboPresence } from '../types';

interface Props {
  presence: TreeboPresence;
}

const TreeboPresenceSection: React.FC<Props> = ({ presence }) => {
  return (
    <div className="relative group overflow-hidden">
      <div className="absolute inset-0 bg-treebo-brown rounded-[3rem] shadow-2xl transition-all duration-700 group-hover:shadow-treebo-orange/20 group-hover:shadow-[0_0_50px_rgba(188,77,46,0.15)]"></div>
      
      {/* Decorative High-Tech Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 rounded-[3rem]"></div>
      
      {/* Dynamic Glow Orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-treebo-orange/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]"></div>

      <div className="relative z-10 p-8 md:p-12 space-y-12">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <svg className="w-6 h-6 text-treebo-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A2 2 0 013 15.382V7.618a2 2 0 011.553-1.944L9 4m0 16l5.447-2.724A2 2 0 0016 15.382V7.618a2 2 0 00-1.553-1.944L9 4m0 16V4m0 16l5 5m0-5l-5 5" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Network Synergy Radar</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-treebo-orange uppercase tracking-[0.3em]">Direct Domain Audit: treebo.com</span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-treebo-orange animate-ping"></span>
                    <span className="w-1 h-1 rounded-full bg-treebo-orange/50"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Status</span>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest mt-1">Live Integration</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Last Checked</span>
              <span className="text-[10px] font-black text-white uppercase tracking-widest mt-1">Real-Time</span>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hotel Count Module */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex items-center gap-8 group/stat hover:bg-white/10 transition-colors duration-500">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white/5 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-treebo-orange/20 animate-pulse"></div>
                 <span className="text-5xl font-black text-white relative z-10 tracking-tighter">
                   {presence.cityHotelCount}
                 </span>
              </div>
              <div className="absolute -inset-2 border border-treebo-orange/30 rounded-full animate-[spin_10s_linear_infinite] border-dashed"></div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Active Asset Count</p>
              <h4 className="text-2xl font-black text-white uppercase tracking-tight">Local Portfolio</h4>
              <p className="text-[10px] font-bold text-treebo-orange uppercase tracking-widest mt-2">Validated City-Wide Listing</p>
            </div>
          </div>

          {/* Proximity Module */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-4 group/stat hover:bg-white/10 transition-colors duration-500">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Nearest Cluster Node</p>
                <h4 className="text-xl font-black text-white uppercase tracking-tight truncate max-w-[200px]" title={presence.nearestHotelName}>
                  {presence.nearestHotelName}
                </h4>
              </div>
              <div className="px-4 py-2 bg-treebo-orange rounded-xl shadow-lg shadow-treebo-orange/20">
                <span className="text-xl font-black text-white tracking-tighter">{presence.nearestHotelDistance}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="h-1 flex-grow bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-treebo-orange rounded-full w-2/3"></div>
              </div>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Network Radius</span>
            </div>
          </div>
        </div>

        {/* Bottom Strategy Analysis Area */}
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[2.5rem] p-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-5 grayscale">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-treebo-orange rounded-full"></div>
              <h5 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Commercial Synergy Impact</h5>
            </div>
            <p className="text-2xl font-black text-white italic leading-[1.2] tracking-tight group-hover:text-treebo-orange transition-colors duration-500">
              "{presence.marketShareContext}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeboPresenceSection;
