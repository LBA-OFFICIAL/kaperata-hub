import React from 'react';
import { AlertTriangle } from 'lucide-react';

const MaintenanceBanner = ({ isSuperAdmin }) => {
  return (
    <div className="bg-[#FDB813] text-[#3E2723] px-6 py-2 flex items-center justify-center gap-3 relative z-[100] shadow-sm">
      <AlertTriangle size={14} className="animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        System Maintenance in Progress {isSuperAdmin && "(Admin View Active)"}
      </span>
    </div>
  );
};

export default MaintenanceBanner;
