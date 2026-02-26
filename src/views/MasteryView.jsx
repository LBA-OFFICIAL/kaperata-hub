import React, { useState, useContext } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { DEFAULT_MASTERY } from '../utils/helpers';
import { Sparkles, CheckCircle2, Lock, Award, Settings2 } from 'lucide-react';

const MasteryView = () => {
  const { profile, setProfile, members, isOfficer } = useContext(HubContext);
  
  // Local state for Admin Controls
  const [adminMasteryMemberId, setAdminMasteryMemberId] = useState('');

  // Helper: Activity Logger
  const logAction = async (action, details) => { 
    if (!profile) return; 
    try { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
        action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
      }); 
    } catch (err) { console.error("Logging failed:", err); } 
  };

  // Helper: Calculate Certificate Eligibility
  const calculateEligibleCertificate = (masteryData) => {
    if (!masteryData || !masteryData.paths || masteryData.paths.length === 0) return null;
    const m = masteryData.milestones;
    const checkTrack = (t) => m[t]?.Q1 && m[t]?.Q2 && m[t]?.Q3 && m[t]?.Q4;
    const hasBrewer = checkTrack('Brewer');
    const hasArtist = checkTrack('Artist');
    const hasAlchemist = checkTrack('Alchemist');
    
    if (hasBrewer && hasArtist && hasAlchemist) return { type: 'TYPE_D_MASTER', title: 'Master of the Craft', color: 'Gold' };
    if (hasBrewer) return { type: 'TYPE_A_BREWER', title: 'Certified Craft Brewer', color: 'Bronze' };
    if (hasArtist) return { type: 'TYPE_B_ARTIST', title: 'Certified Latte Artist', color: 'Silver' };
    if (hasAlchemist) return { type: 'TYPE_C_ALCHEMIST', title: 'Certified Beverage Alchemist', color: 'Copper' };
    return null;
  };

  // --- ACTIONS ---

  const handleSelectPaths = async (pathsToSelect) => {
      if (!confirm(`Are you sure you want to commit to: ${pathsToSelect.join(', ')}?`)) return;
      try {
          const newMastery = { 
            paths: pathsToSelect, 
            status: 'Trainee', 
            startDate: new Date().toISOString(), 
            milestones: DEFAULT_MASTERY.milestones 
          };
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), { 
            mastery: newMastery 
          });
          setProfile(prev => ({ ...prev, mastery: newMastery }));
          alert("Welcome to the Mastery Program!");
      } catch (e) { alert("Failed to save selection."); }
  };
  
  const handleToggleMilestone = async (targetMemberId, currentMasteryData, track, quarter) => {
      if (!isOfficer) return;
      const updatedMilestones = { ...currentMasteryData.milestones };
      updatedMilestones[track][quarter] = !updatedMilestones[track][quarter];
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', targetMemberId), { 
            'mastery.milestones': updatedMilestones 
          });
          logAction("Update Mastery", `Updated ${track} ${quarter} for ${targetMemberId}`);
      } catch (e) { alert("Failed to update milestone."); }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
        {/* HERO BANNER */}
        <div className="text-center bg-[#3E2723] text-white p-10 rounded-[48px] relative overflow-hidden shadow-md">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10">
                <Sparkles size={40} className="mx-auto text-[#FDB813] mb-4"/>
                <h3 className="font-serif text-4xl font-black uppercase mb-2">Mastery Program</h3>
                <p className="text-amber-200/80 font-bold uppercase text-sm max-w-xl mx-auto">Elevate Your Craft. Choose your path and achieve mastery.</p>
            </div>
        </div>

        {/* CONTENT */}
        {(!profile.mastery || !profile.mastery.paths || profile.mastery.paths.length === 0) ? (
            
            /* --- STATE 1: PATH SELECTION --- */
            <div className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-sm text-center">
                <h4 className="font-black text-xl text-[#3E2723] uppercase mb-6">Choose Your Path</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div onClick={() => handleSelectPaths(['Brewer'])} className="p-6 rounded-3xl border-2 border-amber-200 hover:bg-amber-50 transition-colors cursor-pointer group">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">☕</div>
                        <h5 className="font-black text-lg uppercase text-[#3E2723]">Brewer</h5>
                        <p className="text-xs text-gray-500 mt-2">Master the art of extraction, TDS, and recipe creation.</p>
                    </div>
                    <div onClick={() => handleSelectPaths(['Artist'])} className="p-6 rounded-3xl border-2 border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎨</div>
                        <h5 className="font-black text-lg uppercase text-[#3E2723]">Artist</h5>
                        <p className="text-xs text-gray-500 mt-2">Perfect your pours, symmetry, and advanced latte art.</p>
                    </div>
                    <div onClick={() => handleSelectPaths(['Alchemist'])} className="p-6 rounded-3xl border-2 border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer group">
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🧪</div>
                        <h5 className="font-black text-lg uppercase text-[#3E2723]">Alchemist</h5>
                        <p className="text-xs text-gray-500 mt-2">Develop signature beverages and flavor pairings.</p>
                    </div>
                </div>
                <button onClick={() => handleSelectPaths(['Brewer', 'Artist', 'Alchemist'])} className="bg-[#3E2723] text-[#FDB813] px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl">
                    Embark on the Master Track (Triple Crown)
                </button>
                <p className="text-xs text-gray-400 mt-4">Select a single track above to specialize, or embark on the Master Track to pursue all three!</p>
            </div>
            
        ) : (
            
            /* --- STATE 2: ACTIVE TRACKING --- */
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {profile.mastery.paths.map(track => {
                        const ms = profile.mastery.milestones[track] || {};
                        const progress = Object.values(ms).filter(v => v).length;
                        const percent = (progress / 4) * 100;
                        return (
                            <div key={track} className="bg-white p-8 rounded-[32px] border border-amber-100 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723]">{track} Path</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Status: {progress === 4 ? 'Completed' : 'In Progress'}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-amber-600">{progress}/4</span>
                                        <p className="text-[8px] uppercase font-bold text-gray-400">Milestones</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
                                    <div className="bg-[#3E2723] h-2 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
                                        <div key={q} className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 ${ms[q] ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            {ms[q] ? <CheckCircle2 size={18}/> : <Lock size={18}/>}
                                            <span className="text-[10px] font-black">{q}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Eligibility Box */}
                {calculateEligibleCertificate(profile.mastery) && (
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between shadow-lg gap-4 text-center md:text-left">
                        <div>
                            <h4 className="font-serif text-2xl font-black uppercase mb-1">Graduation Ready</h4>
                            <p className="text-sm font-medium">You have met the requirements for certification!</p>
                        </div>
                        <div className="bg-white text-amber-600 px-6 py-3 rounded-full font-black uppercase text-xs flex items-center gap-2 shadow-sm">
                            <Award size={16}/> Certificate Unlocked in Trophy Case
                        </div>
                    </div>
                )}

                {/* Admin / Trainer Controls */}
                {isOfficer && (
                    <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-200 mt-12">
                        <h4 className="font-black text-sm uppercase text-amber-800 mb-6 flex items-center gap-2"><Settings2 size={18}/> Trainer Controls</h4>
                        
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <select 
                              className="p-4 rounded-xl border border-amber-200 text-xs font-bold uppercase flex-1 outline-none" 
                              value={adminMasteryMemberId} 
                              onChange={e => setAdminMasteryMemberId(e.target.value)}
                            >
                                <option value="">Select Trainee...</option>
                                {members.filter(m => m != null && m.mastery && m.mastery.paths?.length > 0).map(m => (
                                    <option key={m.memberId} value={m.memberId}>{m.name} ({m.memberId})</option>
                                ))}
                            </select>
                        </div>
                        
                        {adminMasteryMemberId && (() => {
                            const trainee = members.find(m => m.memberId === adminMasteryMemberId);
                            if (!trainee || !trainee.mastery) return null;
                            
                            return (
                                <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-6">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h5 className="font-black text-[#3E2723] uppercase text-lg">{trainee.name}</h5>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Enrolled: {trainee.mastery.paths.join(', ')}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {trainee.mastery.paths.map(track => (
                                            <div key={track} className="space-y-3">
                                                <h6 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2">{track} Track</h6>
                                                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                                                    const isDone = trainee.mastery.milestones[track][q];
                                                    return (
                                                        <div key={q} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors">
                                                            <span className="text-xs font-bold text-gray-700">{q} Milestone</span>
                                                            <button 
                                                              onClick={() => handleToggleMilestone(trainee.memberId, trainee.mastery, track, q)} 
                                                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${isDone ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600 hover:bg-amber-100 hover:text-amber-800'}`}
                                                            >
                                                              {isDone ? 'Approved ✓' : 'Approve'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default MasteryView;
