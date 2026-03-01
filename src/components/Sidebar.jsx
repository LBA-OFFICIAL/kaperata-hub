import React from 'react';
import * as Lucide from 'lucide-react';

const Sidebar = ({ view, setView, logout, mobileMenuOpen, setMobileMenuOpen, isSystemAdmin }) => {
  
  // SAFETY: If an icon is missing, we use a default "Help" circle so it doesn't crash
  const getIcon = (name) => Lucide[name] || Lucide.HelpCircle;

  const menuItems = [
    { id: 'home', label: 'Home', icon: 'Home' },
    { id: 'about', label: 'About Us', icon: 'Info' },
    { id: 'events', label: "What's Brewing?", icon: 'Calendar' },
    { id: 'announcements', label: 'The Grind Report', icon: 'Bell' },
    { id: 'members_corner', label: "Member's Corner", icon: 'Heart' },
    { id: 'series', label: 'Barista Diaries', icon: 'Camera' },
    { id: 'masterclass', label: 'Masterclass', icon: 'BookOpen' },
    { id: 'mastery', label: 'Mastery Program', icon: 'GraduationCap' },
    { id: 'team', label: 'Brew Crew', icon: 'Users' },
    { id: 'committee_hunt', label: 'Committee Hunt', icon: 'Search' },
    { id: 'daily_grind', label: 'The Task Bar', icon: 'CheckSquare' },
    { id: 'members', label: 'Registry', icon: 'Database' },
  ];

  // Only add Terminal if isSystemAdmin is explicitly true
  if (isSystemAdmin) {
    menuItems.push({ id: 'reports', label: 'Terminal', icon: 'ShieldAlert' });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-[#3E2723]/60 backdrop-blur-sm z-[60] md:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed md:relative z-[70] w-72 h-screen bg-white border-r border-amber-100 p-8 flex flex-col transition-transform duration-500 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="mb-10 px-2">
          <h1 className="font-serif text-2xl font-black uppercase text-[#3E2723]">KAPERata</h1>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Brewing Excellence</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
          {menuItems.map((item) => {
            const Icon = getIcon(item.icon); // Safety check for icon
            return (
              <button
                key={item.id}
                onClick={() => { 
                  if (typeof setView === 'function') setView(item.id); 
                  if (typeof setMobileMenuOpen === 'function') setMobileMenuOpen(false); 
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${view === item.id ? 'bg-[#3E2723] text-[#FDB813] shadow-lg' : 'text-gray-400 hover:bg-amber-50 hover:text-[#3E2723]'}`}
              >
                <Icon size={18} className={view === item.id ? 'text-[#FDB813]' : 'group-hover:text-[#3E2723]'} />
                <span className="text-[11px] font-black uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button 
          onClick={logout} 
          className="mt-6 w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-50 transition-colors"
        >
          <Lucide.LogOut size={18} />
          <span className="text-[11px] font-black uppercase tracking-wider">Sign Out</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
