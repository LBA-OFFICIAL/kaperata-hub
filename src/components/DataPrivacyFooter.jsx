import React from 'react';
import { ShieldCheck } from 'lucide-react';

const DataPrivacyFooter = () => {
  return (
    <div className="w-full py-8 mt-12 border-t border-amber-900/10 text-[#3E2723]/40 text-center">
      <div className="flex items-center justify-center gap-2 mb-2 font-black uppercase text-[10px] tracking-widest">
        <ShieldCheck size={12} /> Data Privacy Statement
      </div>
      <p className="text-[9px] leading-relaxed max-w-lg mx-auto px-4">
        LPU Baristas' Association (LBA) is committed to protecting your personal data strictly for membership management.
      </p>
      <div className="mt-4 flex justify-center gap-4 text-[9px] font-bold uppercase tracking-wider">
        <span>© {new Date().getFullYear()} LBA</span>
      </div>
    </div>
  );
};

export default DataPrivacyFooter;
