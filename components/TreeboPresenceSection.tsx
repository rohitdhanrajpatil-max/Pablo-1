
import React from 'react';
import { TreeboPresence } from '../types';

interface Props {
  presence: TreeboPresence;
}

const TreeboPresenceSection: React.FC<Props> = ({ presence }) => {
  return (
    <div className="bg-treebo-brown text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-white/5">
      {/* Background Decorative Elements */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-treebo-orange/10 rounded-full blur-3xl transition-all group-hover:scale-110 duration-1000"></div>
      <div className="absolute -left-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col lg:flex-row gap-12 lg:items-center">
        {/* Left Side: Brand & Source */}
        <div className="space-y-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/10 pb-8 lg:pb-0 lg:pr-12">
          <div className="flex items-center gap-4">
            <div className="thv-logo scale-90 border border-white/20 shadow-xl">
              <div className="bg-white text-treebo-brown">T</div>
              <div className="bg-treebo-orange">H</div>
              <div className="bg-white text-treebo-brown">V</div>
            </div>
            <div>
              <h3 className="font-black uppercase text-sm tracking-[0.2em] text-white">Treebo Ecosystem</h3>
              <p className="text-[10px] font-black text-treebo-orange uppercase tracking-widest mt-0.5">Regional Synergy Hub</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <svg className="w-3 h-3 text-treebo-orange" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/60">Verified via treebo.com</span>
          </div>
        </div>

        {/* Right Side: Metrics */}
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">City-Wide Saturation</span>
              <div className="flex items-baseline gap-3">
                <span className="text-7xl font-black text-white tracking-tighter leading-none">{presence.cityHotelCount}</span>
                <span className="text-xl font-black text-treebo-orange uppercase tracking-widest">Active Hotels</span>
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-2 italic">Operating in current micro-market</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Primary Proximity Asset</span>
              <p className="text-xl font-black text-white leading-tight uppercase tracking-tight">{presence.nearestHotelName}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-treebo-orange text-white text-[10px] font-black rounded uppercase tracking-widest">~ {presence.nearestHotelDistance}</span>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Travel Radius</span>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-4 h-4 text-treebo-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Market Share Insight</span>
            </div>
            <p className="text-lg font-bold text-white/90 leading-relaxed italic tracking-tight">
              "{presence.marketShareContext}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeboPresenceSection;
