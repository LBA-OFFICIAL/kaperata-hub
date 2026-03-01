// --- 1. LBA BRANDING & CONFIGURATION ---
export const ORG_LOGO_URL = "https://drive.google.com/file/d/14kDHPLQdRKu0faFRvQy2ZZm0qu8gkAIL/view?usp=sharing";
export const APP_ICON_URL = "https://drive.google.com/file/d/1QzaJ9DxqL38xM4BPCBOeaC0LtH8lY8fy/view?usp=sharing";

export const OFFICER_TITLES = [
  "President", "Vice President", "Secretary", "Assistant Secretary", 
  "Treasurer", "Auditor", "Business Manager", "P.R.O.", "Overall Committee Head"
];

export const COMMITTEE_TITLES = ["Committee Head", "Committee Member"];
export const PROGRAMS = ["CAKO", "CLOCA", "CLOHS", "HRA", "ITM/ITTM"];
export const POSITION_CATEGORIES = ["Member", "Officer", "Committee", "Execomm", "Alumni", "Org Adviser", "Blacklisted"];

export const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" }, 
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" }, 
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" }, 
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
];

export const DEFAULT_MASTERCLASS_MODULES = [
  { id: 1, title: "Basic Coffee Knowledge & History", short: "Basics" }, 
  { id: 2, title: "Equipment Familiarization", short: "Equipment" }, 
  { id: 3, title: "Manual Brewing", short: "Brewing" }, 
  { id: 4, title: "Espresso Machine", short: "Espresso" }, 
  { id: 5, title: "Signature Beverage (Advanced)", short: "Sig Bev" }
];

export const DEFAULT_MASTERY = { 
  paths: [], status: 'Not Started', startDate: '', 
  milestones: { 
    Brewer: {Q1:false, Q2:false, Q3:false, Q4:false}, 
    Artist: {Q1:false, Q2:false, Q3:false, Q4:false}, 
    Alchemist: {Q1:false, Q2:false, Q3:false, Q4:false} 
  } 
};

export const COMMITTEES_INFO = [
  { id: "Arts", title: "Arts & Design", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80", description: "The creative soul of LBA. We handle all visual assets, stage decorations, and artistic direction.", roles: ["Pubmats & Posters", "Merch Design", "Venue Styling"] },
  { id: "Media", title: "Media & Documentation", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80", description: "Capturing the moments. We handle photography, videography, and highlights of every event.", roles: ["Photography", "Videography", "Editing"] },
  { id: "Events", title: "Events & Logistics", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80", description: "The backbone of operations. We plan flows, manage logistics, and ensure smooth gatherings.", roles: ["Program Flow", "Logistics", "Crowd Control"] },
  { id: "PR", title: "Public Relations", image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80", description: "The voice of the association. We manage social media, engagement, and external partners.", roles: ["Social Media", "Copywriting", "External Partnerships"] }
];

export const SOCIAL_LINKS = { 
  facebook: "https://fb.com/lpubaristas.official", 
  instagram: "https://instagram.com/lpubaristas.official", 
  tiktok: "https://tiktok.com/@lpubaristas.official", 
  email: "lpubaristas.official@gmail.com", 
  pr_email: "lbaofficial.pr@gmail.com" 
};

// --- 2. CORE UTILITY FUNCTIONS ---

export const getDirectLink = (url) => { 
  if (!url || typeof url !== 'string') return ""; 
  if (url.includes('drive.google.com')) { 
    const idMatch = url.match(/[-\w]{25,}/); 
    if (idMatch) return `https://drive.google.com/uc?export=view&id=${idMatch[0]}`; 
  } 
  return url; 
};

export const generateCSV = (headers, rows, filename) => { 
  const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n'); 
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); 
  const link = document.createElement("a"); 
  if (link.download !== undefined) { 
    const url = URL.createObjectURL(blob); 
    link.setAttribute("href", url); 
    link.setAttribute("download", filename); 
    link.style.visibility = 'hidden'; 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link); 
    URL.revokeObjectURL(url); 
  } 
};

export const getMemberIdMeta = () => { 
  const now = new Date(); 
  const month = now.getMonth() + 1; 
  const year = now.getFullYear(); 
  let syStart = year % 100; 
  let syEnd = (year + 1) % 100; 
  if (month < 8) { 
    syStart = (year - 1) % 100; 
    syEnd = year % 100; 
  } 
  const sy = `${String(syStart).padStart(2, '0')}${String(syEnd).padStart(2, '0')}`;
  const sem = (month >= 8 || month <= 12) && month >= 8 ? "1" : "2";
  return { sy, sem }; 
};

export const generateLBAId = (category, currentCount = 0) => { 
  const { sy, sem } = getMemberIdMeta(); 
  const padded = String(Number(currentCount) + 1).padStart(4, '0'); 
  const isLeader = ['Officer', 'Committee', 'Execomm'].includes(category); 
  return `LBA${sy}-${sem}${padded}${isLeader ? "C" : ""}`; 
};

export const getDailyCashPasskey = () => { 
  const now = new Date(); 
  return `KBA-${now.getDate()}-${(now.getMonth() + 1) + (now.getFullYear() % 100)}`; 
};

// --- 3. DATE FORMATTERS ---

export const formatDate = (dateInput) => { 
  if (!dateInput) return ""; 
  const d = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput); 
  if (isNaN(d.getTime())) return ""; 
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); 
};

export const getEventDay = (dateInput) => { 
  if (!dateInput) return "?"; 
  const d = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput); 
  return isNaN(d.getTime()) ? "?" : d.getDate(); 
};

export const getEventMonth = (dateInput) => { 
  if (!dateInput) return "???"; 
  const d = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput); 
  return isNaN(d.getTime()) ? "???" : d.toLocaleString('default', { month: 'short' }).toUpperCase(); 
};

export const getEventDateParts = (startInput, endInput) => { 
  if (!startInput) return { day: '?', month: '?' }; 
  const start = startInput?.toDate ? startInput.toDate() : new Date(startInput); 
  const startMonth = start.toLocaleString('default', { month: 'short' }).toUpperCase(); 
  const startDay = start.getDate(); 
  if (!endInput || startInput === endInput) return { day: `${startDay}`, month: startMonth }; 
  const end = endInput?.toDate ? endInput.toDate() : new Date(endInput); 
  const endMonth = end.toLocaleString('default', { month: 'short' }).toUpperCase(); 
  const endDay = end.getDate(); 
  return startMonth === endMonth ? { day: `${startDay}-${endDay}`, month: startMonth } : { day: `${startDay}-${endDay}`, month: `${startMonth}/${endMonth}` }; 
};
