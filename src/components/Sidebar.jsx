import React from 'react';
import { Home, Info, ShieldAlert, LogOut, Coffee, Award, Star } from 'lucide-react';

const Sidebar = ({ view, setView, logout, mobileMenuOpen, setMobileMenuOpen, isSystemAdmin }) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'masterclass', label: 'Masterclass', icon: Award },
    { id: 'mastery', label: 'Mastery', icon: Star },
    { id: 'events', label: "Events", icon: Coffee },
    { id: 'committee_hunt', label: 'Committee', icon: ShieldAlert },
    // Add other items here...
  ];

  if (isSystemAdmin) menuItems.push({ id: 'reports', label: 'Terminal', icon: ShieldAlert });

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#3E2723]/60 backdrop-blur-sm z-[60] md:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:relative z-[70] w-72 h-screen bg-white border-r border-amber-100 p-8 flex flex-col 
        transition-transform duration-500 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-10">
          <h1 className="font-serif text-2xl font-black uppercase text-[#3E2723]">KAPERata</h1>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Brewing Excellence</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-black uppercase text-[11px] tracking-wider transition-all
                ${view === item.id ? 'bg-[#3E2723] text-[#FDB813] shadow-lg scale-[1.02]' : 'text-gray-400 hover:bg-amber-50'}
              `}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <button onClick={logout} className="mt-6 flex items-center gap-4 px-4 py-4 text-red-400 font-black uppercase text-[11px] hover:bg-red-50 rounded-2xl transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
