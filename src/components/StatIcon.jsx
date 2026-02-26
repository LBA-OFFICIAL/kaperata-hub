import React from 'react';

const StatIcon = ({ icon: Icon, variant = 'default' }) => { 
  const colors = { 
    amber: 'bg-amber-100 text-amber-600', 
    indigo: 'bg-indigo-100 text-indigo-600', 
    green: 'bg-green-100 text-green-600', 
    blue: 'bg-blue-100 text-blue-600', 
    red: 'bg-red-100 text-red-600', 
    default: 'bg-gray-100 text-gray-600' 
  }; 
  
  return (
    <div className={`p-3 rounded-2xl ${colors[variant] || colors.default}`}>
      <Icon size={24} />
    </div>
  ); 
};

export default StatIcon;
