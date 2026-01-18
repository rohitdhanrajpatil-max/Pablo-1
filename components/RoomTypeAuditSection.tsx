
import React from 'react';
import { RoomTypeAudit } from '../types';

interface Props {
  rooms: RoomTypeAudit[];
}

const RoomTypeAuditSection: React.FC<Props> = ({ rooms }) => {
  const safeRooms = rooms || [];
  
  if (safeRooms.length === 0) {
    return (
      <div className="p-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No detailed inventory records indexed.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {safeRooms.map((room, idx) => {
        const amenities = room.amenities || [];
        const hasRisk = !!room.configRisk && room.configRisk.toLowerCase() !== 'none';
        
        return (
          <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/30 overflow-hidden flex flex-col hover:border-treebo-orange/30 transition-all group">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-treebo-brown uppercase tracking-tight group-hover:text-treebo-orange transition-colors">
                    {room.roomName || 'Inventory Node'}
                  </h4>
                  <span className="text-[7px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">Verified: B.com + MMT</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-2 py-0.5 rounded">
                    {room.occupancy || 'Double'}
                  </span>
                  {room.sizeSqFt && (
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-2 py-0.5 rounded">
                      {room.sizeSqFt}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex -space-x-1">
                {amenities.slice(0, 3).map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 flex-grow space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Cross-Channel Logic Audit</p>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                    <div className="w-1 h-1 rounded-full bg-pink-400"></div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic border-l-2 border-treebo-orange/20 pl-4 py-1 bg-slate-50/50 rounded-r-lg">
                  {room.descriptionAudit}
                </p>
              </div>

              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {amenities.slice(0, 5).map((amenity, i) => (
                    <span key={i} className="px-2 py-1 bg-white text-slate-500 rounded-md text-[9px] font-bold border border-slate-100">
                      {amenity}
                    </span>
                  ))}
                  {amenities.length > 5 && (
                    <span className="px-2 py-1 bg-white text-slate-300 rounded-md text-[9px] font-bold border border-slate-100">
                      +{amenities.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>

            {hasRisk && (
              <div className="px-6 py-4 bg-red-50/50 border-t border-red-100 flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Parity Node Risk</p>
                  <p className="text-[10px] font-black text-slate-700 leading-tight">{room.configRisk}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoomTypeAuditSection;
