
import React from 'react';
import { TreeboPresence } from '../types';

interface Props {
  presence: TreeboPresence;
}

const TreeboPresenceSection: React.FC<Props> = ({ presence }) => {
  return (
    <div className="relative group overflow-hidden h-full">
      <div className="absolute inset-0 bg-treebo-brown rounded-[2.5rem] shadow-xl transition-all duration-700"></div>
      
      {/* Native CSS Pattern (SVG Data URI) - replaces external transparenttextures.com dependency */}
      <div 
        className="absolute inset-0 opacity-10 rounded-[2.5rem]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` 
        }}
      ></div>
      
      {/* Decorative Accents */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-treebo-orange/10 rounded-full blur-[60px] animate-pulse"></div>

      <div className="relative z-10 p-8 flex flex-col h-full gap-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-treebo-orange/20 rounded-lg flex items-center justify-center border border-treebo-orange/30">
               <svg className="w-4 h-4 text-treebo-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A2 2 0 013 15.382V7.618a2 2 0 011.553-1.944L9 4m0 16l5.447-2.724A2 2 0 0016 15.382V7.618a2 2 0 00-1.553-1.944L9 4m0 16V4m0 16l5 5m0-5l-5 5" />
               </svg>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Local Node Synergy Matrix</h3>
              <p className="text-[8px] font-black text-treebo-orange uppercase tracking-widest mt-0.5">Treebo.com Network Data</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[7px] font-black uppercase tracking-widest mb-1">Live Sync</span>
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-tighter italic">Source: Treebo Official Inventory</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Node Count */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center group/stat hover:bg-white/10 transition-colors">
            <span className="text-4xl font-black text-white tracking-tighter leading-none">{presence.cityHotelCount}</span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mt-2">Active City Clusters</span>
          </div>

          {/* Proximity Node */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-center space-y-2 group/stat hover:bg-white/10 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">Network Neighbor</span>
              <span className="text-[10px] font-black text-treebo-orange">{presence.nearestHotelDistance}</span>
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-tight truncate leading-none" title={presence.nearestHotelName}>
              {presence.nearestHotelName}
            </p>
          </div>
        </div>

        {/* Commercial Context Area */}
        <div className="mt-auto bg-gradient-to-r from-white/5 to-transparent p-6 rounded-2xl border border-white/5">
          <p className="text-xs font-black text-white/80 italic leading-relaxed">
            <span className="text-treebo-orange mr-2">SYNERGY LOGIC:</span>
            "{presence.marketShareContext}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default TreeboPresenceSection;
