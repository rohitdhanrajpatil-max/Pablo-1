
import React from 'react';
import { RoomTypeAudit } from '../types';

interface Props {
  rooms: RoomTypeAudit[];
}

const RoomTypeAuditSection: React.FC<Props> = ({ rooms }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room, idx) => (
        <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-black text-treebo-brown uppercase tracking-tight">{room.roomName}</h4>
              <span className="px-2 py-0.5 bg-treebo-orange/10 text-treebo-orange rounded text-[9px] font-black uppercase tracking-widest">{room.occupancy}</span>
            </div>
            {room.sizeSqFt && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{room.sizeSqFt} Approx.</p>}
          </div>
          
          <div className="p-6 space-y-6 flex-grow">
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OTA Listing Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {room.amenities.map((amenity, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">{amenity}</span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description Audit</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed italic border-l-2 border-treebo-orange pl-3">
                "{room.descriptionAudit}"
              </p>
            </div>
          </div>

          <div className="p-6 bg-red-50/50 mt-auto border-t border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">Inventory Config Risk</p>
            </div>
            <p className="text-xs font-black text-slate-700 leading-tight">{room.configRisk}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomTypeAuditSection;
