import React from 'react';
import { Coffee, AlertOctagon } from 'lucide-react';

const MaintenanceBanner = ({ isSuperAdmin }) => {
  if (isSuperAdmin) {
    return (
      <div className="w-full bg-red-600 text-white text-center py-2 px-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase animate-pulse border-b-2 border-red-800">
        <AlertOctagon size={14} />
        <span>MAINTENANCE MODE IS CURRENTLY ACTIVE</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#3E2723] text-[#FDB813] text-center py-2 px-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase animate-pulse border-b-2 border-[#FDB813]">
      <Coffee size={14} />
      <span>Machine Calibration in Progress • Some Features Unavailable</span>
    </div>
  );
};

export default MaintenanceBanner;
