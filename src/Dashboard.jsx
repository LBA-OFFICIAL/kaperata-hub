import React from 'react';

// We are NOT importing Sidebar or Context yet. 
// This is a pure "Emergency" test.

const Dashboard = ({ isSystemAdmin, logout }) => {
  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      backgroundColor: '#FDFBF7', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'sans-serif' 
    }}>
      <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h1 style={{ color: '#3E2723', margin: '0' }}>☕ LBA Hub Emergency Mode</h1>
        <p style={{ color: '#A8875C', fontWeight: 'bold', fontSize: '12px', marginTop: '10px' }}>THE DASHBOARD FILE IS WORKING</p>
        
        <div style={{ marginTop: '30px', textAlign: 'left', fontSize: '13px', color: '#5D4037' }}>
          <p>If you see this screen, the problem is likely one of these:</p>
          <ul style={{ lineHeight: '1.6' }}>
            <li><strong>Sidebar.jsx:</strong> Check if it has an <code>export default Sidebar</code>.</li>
            <li><strong>HubContext.jsx:</strong> Check for typos in your Firebase paths.</li>
            <li><strong>Firebase.js:</strong> Check if your <code>db</code> or <code>appId</code> are exported correctly.</li>
          </ul>
        </div>

        <button 
          onClick={logout}
          style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#3E2723', color: 'white', cursor: 'pointer' }}
        >
          Test Logout Button
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
