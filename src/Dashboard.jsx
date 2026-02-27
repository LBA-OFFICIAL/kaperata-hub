import React, { useState, useContext, useMemo } from 'react';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './firebase';
import { HubProvider, HubContext } from './contexts/HubContext.jsx';

// Components & Views
import Sidebar from './components/Sidebar.jsx';
import MaintenanceBanner from './components/MaintenanceBanner.jsx';
import DataPrivacyFooter from './components/DataPrivacyFooter.jsx';
import HomeView from './views/HomeView.jsx';
import MasteryView from './views/MasteryView.jsx';
import AboutView from './views/AboutView.jsx';
import MasterclassView from './views/MasterclassView.jsx';
import TeamView from './views/TeamView.jsx';
import EventView from './views/EventView.jsx';
import AnnouncementsView from './views/AnnouncementsView.jsx';
import CommitteeHuntView from './views/CommitteeHuntView.jsx';
import TaskBarView from './views/TaskBarView.jsx';
import RegistryView from './views/RegistryView.jsx';
import TerminalView from './views/TerminalView.jsx';

const DashboardContent = ({ logout, isSystemAdmin }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hubSettings, profile, secureKeys, committeeApps, logs, members, masterclassData } = useContext(HubContext);

  // Stats Logic for Summary Report
  const financialStats = useMemo(() => ({
    totalPaid: members?.filter(m => String(m.status || '').toLowerCase() === 'paid').length || 0,
    exemptCount: members?.filter(m => String(m.status || '').toLowerCase() === 'exempt').length || 0
  }), [members]);

  // Semester Logic for Dropdown
  const availableSemesters = useMemo(() => {
    if (!members) return [];
    const sems = members.map(m => {
      const d = m.joinedDate?.toDate ? m.joinedDate.toDate() : new Date(m.joinedDate || 0);
      const isFirst = (d.getMonth() + 1) >= 7;
      return isFirst ? `1st Sem AY ${d.getFullYear()}-${d.getFullYear()+1}` : `2nd Sem AY ${d.getFullYear()-1}-${d.getFullYear()}`;
    });
    return [...new Set(sems)].sort().reverse();
  }, [members]);

  // Global Action Handlers
  const handleUpdateSetting = async (field, val) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { [field]: val }, { merge: true });
  };

  const handleRotateKey = async (type) => {
    const key = Math.random().toString(36).substring(2, 8).toUpperCase();
    const path = type === 'daily' ? ['settings', 'ops'] : ['settings', 'keys'];
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', ...path), { [type === 'daily' ? 'dailyKey' : type]: key });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col relative overflow-hidden text-[#3E2723]">
      {hubSettings?.maintenanceMode && <MaintenanceBanner isSuperAdmin={isSystemAdmin} />}
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <Sidebar 
          view={view} setView={setView} logout={logout} 
          mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} 
          isSystemAdmin={isSystemAdmin} 
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <header className="flex justify-between items-center mb-10">
             <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 bg-white rounded-xl shadow-sm border border-amber-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
             </button>
             <h2 className="font-serif text-3xl font-black uppercase">KAPErata Hub</h2>
             
             {/* AVATAR PROFILE WORKING */}
             <div className="flex items-center gap-3 bg-white p-2 pr-6 rounded-full border border-amber-100 shadow-sm">
               <img 
                 src={profile?.photoUrl || `https://ui-avatars.com/api/?name=${profile?.name}&background=FDB813&color=3E2723`} 
                 className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="Profile"
               />
               <div className="hidden sm:block text-left">
                 <p className="text-[10px] font-black uppercase leading-none">{profile?.nickname || profile?.name?.split(' ')[0]}</p>
                 <p className="text-[8px] font-bold text-amber-500 uppercase">{profile?.specificTitle || profile?.role}</p>
               </div>
             </div>
          </header>

          <div className="pb-20">
            {view === 'home' && <HomeView profile={profile} masterclassData={masterclassData} />}
            {view === 'about' && <AboutView />}
            {view === 'masterclass' && <MasterclassView profile={profile} masterclassData={masterclassData} />}
            {view === 'mastery' && <MasteryView profile={profile} />}
            {view === 'team' && <TeamView />}
            {view === 'events' && <EventView hubSettings={hubSettings} />}
            {view === 'announcements' && <AnnouncementsView />}
            {view === 'committee_hunt' && <CommitteeHuntView profile={profile} />}
            {view === 'daily_grind' && <TaskBarView profile={profile} />}
            {view === 'members' && <RegistryView />}
            
            {view === 'reports' && isSystemAdmin && (
              <TerminalView 
                financialStats={financialStats} committeeApps={committeeApps} logs={logs} 
                secureKeys={secureKeys} hubSettings={hubSettings} availableSemesters={availableSemesters} 
                currentDailyKey={hubSettings?.dailyKey || "---"}
                handleToggleMaintenance={() => handleUpdateSetting('maintenanceMode', !hubSettings.maintenanceMode)}
                handleToggleRegistration={() => handleUpdateSetting('registrationOpen', !hubSettings.registrationOpen)}
                handleToggleRenewalMode={() => handleUpdateSetting('renewalMode', !hubSettings.renewalMode)}
                handleTogglePayment={() => handleUpdateSetting('allowedPayment', hubSettings.allowedPayment === 'gcash_only' ? 'cash_gcash' : 'gcash_only')}
                handleRotateKey={handleRotateKey}
                initiateAppAction={async (app, status) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id), { status, statusUpdatedAt: serverTimestamp() })}
                handleDeleteApp={async (id) => window.confirm("Delete?") && await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id))}
              />
            )}
          </div>
          <DataPrivacyFooter />
        </main>
      </div>
    </div>
  );
};

export default function Dashboard(props) {
  return <HubProvider profile={props.profile}><DashboardContent {...props} /></HubProvider>;
}
