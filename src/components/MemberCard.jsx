import React from 'react';
import { User, Shield, IdCard } from 'lucide-react';

const MemberCard = ({ member }) => {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-[#3E2723] overflow-hidden">
          {member?.photoUrl ? (
            <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={24} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-[#3E2723] uppercase text-sm truncate">{member?.name || 'Anonymous'}</h4>
          <p className="text-[10px] font-bold text-amber-500 uppercase mb-2">{member?.specificTitle || member?.positionCategory}</p>
          
          <div className="flex items-center gap-2 text-gray-400">
            <IdCard size={12} />
            <span className="text-[10px] font-mono font-bold tracking-tighter">{member?.memberId}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4">
        {member?.role === 'admin' ? (
          <Shield size={16} className="text-amber-400" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-green-400" />
        )}
      </div>
    </div>
  );
};

export default MemberCard;
