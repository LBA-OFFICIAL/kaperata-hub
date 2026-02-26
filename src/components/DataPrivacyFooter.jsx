import React from 'react';
import { Lock } from 'lucide-react';

const DataPrivacyFooter = () => {
  return (
    <footer className="mt-20 py-10 border-t border-amber-100/50">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
          <Lock size={16} />
        </div>
        <h5 className="text-[11px] font-black uppercase text-[#3E2723] mb-2 tracking-widest">Data Privacy Notice</h5>
        <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-bold px-4">
          By using the KAPErata Hub, you agree to our internal data handling policies. 
          Your information is used strictly for organization records and member identification. 
          The LBA ensures that your personal data is protected and used responsibly.
        </p>
        <div className="mt-6 flex gap-4 text-[9px] font-black text-amber-500 uppercase tracking-tighter">
          <span>&copy; 2026 LBA-OFFICIAL</span>
          <span>•</span>
          <span>Version 1.2.0-Alpha</span>
        </div>
      </div>
    </footer>
  );
};

export default DataPrivacyFooter;
