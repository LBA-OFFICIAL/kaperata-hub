import React, { useState } from 'react';
// We will create these files next!
// import Sidebar from './components/Sidebar';
// import HomeView from './views/HomeView';
// import EventView from './views/EventView';

const Dashboard = ({ user, profile, setProfile, logout }) => {
  // This state controls which page we are looking at
  const [view, setView] = useState('home');

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] text-[#3E2723] font-sans relative overflow-hidden">
      
      {/* 1. Your Sidebar Navigation */}
      {/* <Sidebar view={view} setView={setView} logout={logout} profile={profile} /> */}

      {/* 2. Your Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative custom-scrollbar">
        
        {/* We will route your views here */}
        {view === 'home' && <div>Home View Placeholder</div>}
        {view === 'events' && <div>Events View Placeholder</div>}
        
      </main>
    </div>
  );
};

export default Dashboard;
