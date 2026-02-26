import React, { useContext } from 'react';
import { HubContext } from '../contexts/HubContext';

const EventView = () => {
  // Grab exactly what this view needs from your global state
  const { events, isSuperAdmin, profile } = useContext(HubContext);

  return (
    <div className="space-y-6">
       <h3 className="font-serif text-4xl font-black uppercase">What's Brewing?</h3>
       {/* Paste your Event UI code here */}
    </div>
  );
};

export default EventView;
