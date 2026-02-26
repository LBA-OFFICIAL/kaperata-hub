import React, { useState, useContext } from 'react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { DEFAULT_MASTERCLASS_MODULES, getDirectLink } from '../utils/helpers';
import { 
  Award, Lock, BadgeCheck, GraduationCap, Settings2, 
  X, Printer, AlertTriangle 
} from 'lucide-react';

const MasterclassView = () => {
  const { 
    profile, events, masterclassData, isOfficer, members 
  } = useContext(HubContext);

  // Local States
  const [showCertificate, setShowCertificate] = useState(false);
  const [adminMcModule, setAdminMcModule] = useState(1);
  const [adminMcSearch, setAdminMcSearch] = useState('');
  const [selectedMcMembers, setSelectedMcMembers] = useState([]);
  
  // For editing curriculum (if you want to expand this later)
  const [editingMcCurriculum, setEditingMcCurriculum] = useState(false);
  const [tempMcDetails, setTempMcDetails] = useState({ title: '', objectives: '', topics: '', icon: '' });

  // Helper: Activity Logger
  const logAction = async (action, details) => { 
    if (!profile) return; 
    try { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
        action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
      }); 
    } catch (err) { console.error("Logging failed:", err); } 
  };

  // --- ACTIONS ---

  const handleBulkAddMasterclass = async () => { 
    if (selectedMcMembers.length === 0) return alert("No members selected!"); 
    const currentAttendees = masterclassData.moduleAttendees?.[adminMcModule] || []; 
    const updatedAttendees = [...new Set([...currentAttendees, ...selectedMcMembers])]; 
    const newData = { ...masterclassData, moduleAttendees: { ...masterclassData.moduleAttendees, [adminMcModule]: updatedAttendees } }; 
    try { 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData); 
      logAction("Masterclass Add", `Added ${selectedMcMembers.length} to Module ${adminMcModule}`); 
      setSelectedMcMembers([]); 
      setAdminMcSearch(''); 
      alert(`Added ${selectedMcMembers.length} attendees to Module ${adminMcModule}`); 
    } catch(e) {
      alert("Failed to add members.");
    } 
  };

  const handleSaveCertTemplate = async () => { 
    try { 
      // We pass the existing masterclassData but just update it via local state binding in the input
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), masterclassData); 
      alert("Template Saved"); 
    } catch(e) {
      alert("Failed to save template.");
    } 
  };

  const handleSaveMcCurriculum = async () => { 
    try { 
      const newData = { ...masterclassData, moduleDetails: { ...masterclassData.moduleDetails, [adminMcModule]: tempMcDetails } }; 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData); 
      logAction("Update Curriculum", `Updated Module ${adminMcModule}`); 
      setEditingMcCurriculum(false); 
      alert("Curriculum Updated"); 
    } catch(e) {
      alert("Failed to update curriculum.");
    } 
  };

  // Check Certification Eligibility
  const hasMod1 = masterclassData.moduleAttendees?.[1]?.includes(profile.memberId);
  const hasMod2 = masterclassData.moduleAttendees?.[2]?.includes(profile.memberId);
  const optionalMods = [3, 4, 5].filter(id => masterclassData.moduleAttendees?.[id]?.includes(profile.memberId)).length;
  const isEligible = hasMod1 && hasMod2 && optionalMods >= 2;

  return (
    <div className="space-y-8 animate-fadeIn relative">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Masterclass</h3>
                <p className="text-amber-600 font-bold text-xs uppercase">School of Coffee Excellence</p>
            </div>
            
            <button 
                onClick={() => isEligible ? setShowCertificate(true) : alert("Certificate Locked: You must complete mandatory Modules 1 & 2, PLUS any two modules from Mod 3-5 to unlock your certificate.")} 
                className={`${isEligible ? 'bg-[#3E2723] text-[#FDB813] hover:bg-black' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'} px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 transition-colors w-full md:w-auto justify-center shadow-sm`}
            >
                {isEligible ? <Award size={16}/> : <Lock size={16}/>} 
                {isEligible ? 'View Certificate' : 'Certificate Locked'}
            </button>
        </div>

        {/* MODULES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEFAULT_MASTERCLASS_MODULES.map(mod => {
                const isCompleted = masterclassData.moduleAttendees?.[mod.id]?.includes(profile.memberId);
                const isOpen = events.some(ev => ev.masterclassModuleIds?.includes(mod.id));
                const details = masterclassData.moduleDetails?.[mod.id] || {};
                const defaultIcons = ["🌱", "⚙️", "💧", "☕", "🍹"]; 
                const icon = details.icon || defaultIcons[mod.id-1];
                
                return (
                    <div key={mod.id} className={`p-6 rounded-[32px] border-2 transition-all flex flex-col ${isCompleted ? 'bg-green-50 border-green-200' : isOpen ? 'bg-white border-blue-300 shadow-md' : 'bg-white border-gray-100 opacity-80'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isCompleted ? 'bg-green-200' : isOpen ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                {icon}
                            </div>
                            {isCompleted && <BadgeCheck className="text-green-600" size={24}/>}
                        </div>
                        <h4 className="font-black uppercase text-sm text-[#3E2723] mb-1">{details.title || mod.title}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Module 0{mod.id}</p>
                        
                        <div className="flex-1 space-y-4 mt-4">
                            {details.objectives && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Objectives</p>
                                    <p className="text-xs text-gray-700 leading-relaxed">{details.objectives}</p>
                                </div>
                            )}
                            {details.topics && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Topics Covered</p>
                                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{details.topics}</p>
                                </div>
                            )}
                            {!details.objectives && !details.topics && (
                                <p className="text-xs text-gray-400 italic">Curriculum details coming soon.</p>
                            )}
                        </div>
                        
                        {isCompleted ? (
                            <div className="mt-6 text-[10px] font-bold text-green-700 uppercase bg-green-100 px-3 py-1 rounded-full inline-block self-start">Completed</div>
                        ) : isOpen ? (
                            <div className="mt-6 text-[10px] font-bold text-blue-700 uppercase bg-blue-100 px-3 py-1 rounded-full inline-block self-start shadow-sm animate-pulse">Registration Open</div>
                        ) : (
                            <div className="mt-6 text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-full inline-block self-start">Locked</div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* ADMIN CONTROLS */}
        {isOfficer && (
            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-200 mt-8 space-y-4">
                <h4 className="font-black text-sm uppercase text-amber-800 mb-4 flex items-center gap-2"><Settings2 size={16}/> Admin Controls</h4>
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <select 
                          className="p-3 rounded-xl border border-amber-200 text-xs font-bold uppercase w-full md:w-auto outline-none" 
                          value={adminMcModule} 
                          onChange={e => { 
                            setAdminMcModule(e.target.value); 
                            const details = masterclassData.moduleDetails?.[e.target.value] || {}; 
                            setTempMcDetails(details); 
                            setSelectedMcMembers([]); 
                          }}
                        >
                            {DEFAULT_MASTERCLASS_MODULES.map(m => { 
                                const details = masterclassData.moduleDetails?.[m.id] || {}; 
                                const displayTitle = details.title || m.title; 
                                return <option key={m.id} value={m.id}>Module {m.id}: {displayTitle}</option> 
                            })}
                        </select>
                        <button 
                          onClick={handleBulkAddMasterclass} 
                          disabled={selectedMcMembers.length === 0} 
                          className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-amber-700 disabled:opacity-50"
                        >
                          Add {selectedMcMembers.length} Attendees
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                        <input 
                          type="text" 
                          placeholder="Search members to add..." 
                          className="w-full p-3 text-xs border-b border-amber-100 outline-none" 
                          value={adminMcSearch} 
                          onChange={e => setAdminMcSearch(e.target.value.toUpperCase())} 
                        />
                        <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                            {members.filter(m => m != null && (m?.name?.includes(adminMcSearch) || m?.memberId?.includes(adminMcSearch)) && !masterclassData.moduleAttendees?.[adminMcModule]?.includes(m.memberId)).slice(0, 50).map(m => (
                                <label key={m.memberId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" 
                                      checked={selectedMcMembers.includes(m.memberId)} 
                                      onChange={(e) => { 
                                        if (e.target.checked) setSelectedMcMembers(prev => [...prev, m.memberId]); 
                                        else setSelectedMcMembers(prev => prev.filter(id => id !== m.memberId)); 
                                      }} 
                                    />
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">{m.name}</p>
                                        <p className="text-[9px] text-gray-400 font-mono">{m.memberId}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-amber-200">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-amber-800 mb-1 block">Certificate Template URL</label>
                        <div className="flex gap-2">
                            <input 
                              type="text" 
                              className="flex-1 p-3 rounded-xl border border-amber-200 text-xs outline-none" 
                              value={masterclassData.certTemplate || ''} 
                              // Note: We are directly mutating the context state here for the input, which is fine since we save it right after.
                              // If strict mode complains, you can move this to a local state before saving.
                              onChange={e => {
                                  masterclassData.certTemplate = e.target.value;
                              }} 
                            />
                            <button onClick={handleSaveCertTemplate} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold uppercase text-xs">Save</button>
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button onClick={() => setEditingMcCurriculum(true)} className="w-full bg-[#3E2723] text-[#FDB813] px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-black transition-colors">
                            Edit Curriculum for Module {adminMcModule}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* CURRICULUM EDITOR MODAL (Admin) */}
        {editingMcCurriculum && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                    <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Edit Curriculum (Module {adminMcModule})</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Module Title</label>
                            <input type="text" className="w-full p-3 border rounded-xl text-xs font-bold" value={tempMcDetails.title} onChange={e => setTempMcDetails({...tempMcDetails, title: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Objectives</label>
                            <textarea className="w-full p-3 border rounded-xl text-xs" rows="2" value={tempMcDetails.objectives} onChange={e => setTempMcDetails({...tempMcDetails, objectives: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Topics Covered</label>
                            <textarea className="w-full p-3 border rounded-xl text-xs" rows="3" value={tempMcDetails.topics} onChange={e => setTempMcDetails({...tempMcDetails, topics: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Icon Emoji</label>
                            <input type="text" className="w-full p-3 border rounded-xl text-xs" maxLength="2" value={tempMcDetails.icon} onChange={e => setTempMcDetails({...tempMcDetails, icon: e.target.value})} placeholder="☕" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setEditingMcCurriculum(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                            <button onClick={handleSaveMcCurriculum} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Save Curriculum</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CERTIFICATE DISPLAY MODAL */}
        {showCertificate && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
                <div className="relative max-w-4xl w-full flex justify-center">
                    <button onClick={() => setShowCertificate(false)} className="absolute -top-12 right-0 text-white hover:text-amber-400 print:hidden">
                        <X size={32}/>
                    </button>
                    
                    {masterclassData.certTemplate ? (
                        <div className="relative bg-white shadow-2xl overflow-hidden w-full max-w-[800px] aspect-[1.414/1]">
                            <img src={getDirectLink(masterclassData.certTemplate)} alt="Certificate Background" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 w-full h-full">
                                <div className="absolute w-full flex justify-center px-4 md:px-12 text-center" style={{ top: '45%' }}>
                                    <h2 className="font-serif font-black text-[#FDB813] uppercase tracking-wide drop-shadow-md whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 4vw, 2.5rem)' }}>
                                        {profile.name}
                                    </h2>
                                </div>
                                <div className="absolute w-full flex justify-center" style={{ top: '75%' }}>
                                    <p className="font-serif text-[8px] sm:text-[10px] md:text-xs text-[#FDB813] font-bold tracking-[0.2em] drop-shadow-sm">
                                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl text-center max-w-sm">
                            <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4"/>
                            <h3 className="font-bold text-xl mb-2">Certificate Template Missing</h3>
                            <p className="text-sm text-gray-500">The administration has not uploaded the certificate design yet.</p>
                        </div>
                    )}
                    
                    {masterclassData.certTemplate && ( 
                        <button onClick={() => window.print()} className="absolute top-4 right-4 bg-white text-[#3E2723] p-3 rounded-full shadow-lg hover:bg-gray-100 print:hidden transition-transform hover:scale-110" title="Print or Save as PDF">
                            <Printer size={20}/>
                        </button> 
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default MasterclassView;
