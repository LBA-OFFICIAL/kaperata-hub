import React, { useContext } from 'react';
import { HubContext } from '../contexts/HubContext';
import { ORG_LOGO_URL, SOCIAL_LINKS, getDirectLink } from '../utils/helpers';
import { 
  Home, History, GraduationCap, Sparkles, Users, Calendar, 
  Bell, MessageSquare, Image as ImageIcon, Briefcase, ClipboardList, 
  FileText, LogOut, X, Facebook, Instagram, Music, Mail 
} from 'lucide-react';

const Sidebar = ({ view, setView, logout, mobileMenuOpen, setMobileMenuOpen }) => {
  // Pull only what we need from our global state!
  const { 
    isSuperAdmin, 
    isOfficer, 
    isCommitteePlus, 
    notifications, 
    updateLastVisited 
  } = useContext(HubContext);

  // Dynamic menu array that adjusts based on user role
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'about', label: 'Legacy Story', icon: History },
    { id: 'masterclass', label: 'Masterclass', icon: GraduationCap },
    { id: 'mastery', label: 'Mastery Program', icon: Sparkles },
    { id: 'team', label: 'Brew Crew', icon: Users },
    { id: 'events', label: "What's Brewing?", icon: Calendar, hasNotification: notifications.events },
    { id: 'announcements', label: 'Grind Report', icon: Bell, hasNotification: notifications.announcements },
    { id: 'members_corner', label: "Member's Corner", icon: MessageSquare, hasNotification: notifications.suggestions },
    { id: 'series', label: 'Barista Diaries', icon: ImageIcon },
    { id: 'committee_hunt', label: 'Committee Hunt', icon: Briefcase, hasNotification: notifications.committee_hunt },
    ...(isCommitteePlus ? [ { id: 'daily_grind', label: 'The Task Bar', icon: ClipboardList } ] : []),
    ...(isOfficer ? [ { id: 'members', label: 'Registry', icon: Users, hasNotification: notifications.members } ] : []),
    ...(isSuperAdmin ? [{ id: 'reports', label: 'Terminal', icon: FileText }] : [])
  ];

  const activeMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all bg-[#FDB813] text-[#3E2723] shadow-lg font-black relative";
  const inactiveMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-amber-200/40 hover:bg-white/5 relative";

  return (
    <>
      <aside className={`bg-[#3E2723] text-amber-50 flex-col md:w-64 md:flex ${mobileMenuOpen ? 'fixed inset-0 z-50 w-64 shadow-2xl flex' : 'hidden'}`}>
        
        {/* Header & Logo */}
        <div className="p-8 border-b border-amber-900/30 text-center">
          <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h1 className="font-serif font-black text-[10px] uppercase">LPU Baristas' Association</h1>
        </div>
        
        {/* Mobile Close Button */}
        <div className="md:hidden p-4 flex justify-end absolute top-2 right-2">
          <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        
        {/* Navigation Links */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => {
             const active = view === item.id; 
             const Icon = item.icon; 
             return (
                <button 
                  key={item.id} 
                  onClick={() => { 
                    setView(item.id); 
                    updateLastVisited(item.id); 
                    setMobileMenuOpen(false); 
                  }} 
                  className={active ? activeMenuClass : inactiveMenuClass}
                >
                  <Icon size={18}/> 
                  <span className="uppercase text-[10px] font-black">{item.label}</span>
                  {item.hasNotification && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
                  )}
                </button>
             );
          })}
        </nav>
        
        {/* Footer Socials & Logout */}
        <div className="p-6 border-t border-amber-900/30 space-y-4">
            <div className="flex justify-center gap-4">
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Facebook size={18} /></a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Instagram size={18} /></a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Music size={18} /></a>
              <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Mail size={18} /></a>
            </div>
            <button 
              onClick={logout} 
              className="w-full flex items-center justify-center gap-2 text-red-400 font-black text-[10px] uppercase hover:text-red-300"
            >
              <LogOut size={16} /> Exit Hub
            </button>
        </div>
      </aside>
      
      {/* Mobile Overlay Background */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
