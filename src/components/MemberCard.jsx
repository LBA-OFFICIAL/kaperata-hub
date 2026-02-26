import React from 'react';
import { getDirectLink } from '../utils/helpers';

const MemberCard = ({ m }) => {
  return (
    <div key={m?.memberId || m?.name} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col items-center text-center shadow-sm w-full sm:w-64">
      <img 
        src={getDirectLink(m?.photoUrl) || `https://ui-avatars.com/api/?name=${m?.name}&background=FDB813&color=3E2723`} 
        className="w-20 h-20 rounded-full border-4 border-[#3E2723] mb-4 object-cover"
        alt="Profile"
      />
      <h4 className="font-black text-xs uppercase mb-1">{m?.name}</h4>
      {m?.nickname && <p className="text-[10px] text-gray-500 mb-2">"{m.nickname}"</p>}
      <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[8px] font-black uppercase">
        {m?.specificTitle}
      </span>
    </div>
  );
};

export default MemberCard;
