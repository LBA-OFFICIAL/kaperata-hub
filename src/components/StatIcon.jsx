import React from 'react';

const StatIcon = ({ icon: Icon, label, value, colorClass = "bg-amber-100 text-amber-900" }) => {
  return (
    <div className="flex items-center gap-4 p-6 bg-white rounded-[32px] border border-amber-50 shadow-sm">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p>
        <p className="text-2xl font-serif font-black text-[#3E2723]">{value}</p>
      </div>
    </div>
  );
};

export default StatIcon;
