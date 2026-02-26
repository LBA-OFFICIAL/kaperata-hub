import React, { useState, useContext } from 'react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { getDirectLink } from '../utils/helpers';
import { History, Pen, Trash2, Plus, Check, X } from 'lucide-react';

const AboutView = () => {
    const { legacyContent, isOfficer, profile } = useContext(HubContext);

    // Local States for Editing
    const [isEditingLegacy, setIsEditingLegacy] = useState(false);
    const [legacyForm, setLegacyForm] = useState({ 
        body: '', imageUrl: '', galleryUrl: '', achievements: [], establishedDate: '', 
        imageSettings: { objectFit: 'cover', objectPosition: 'center' } 
    });
    const [tempAchievement, setTempAchievement] = useState({ date: '', text: '' });

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

    const startEditing = () => {
        setLegacyForm({
            ...legacyContent,
            achievements: legacyContent.achievements || [],
            imageUrl: legacyContent.imageUrl || '',
            galleryUrl: legacyContent.galleryUrl || '',
            imageSettings: legacyContent.imageSettings || { objectFit: 'cover', objectPosition: 'center' }
        });
        setIsEditingLegacy(true);
    };

    const handleSaveLegacy = async () => { 
        try { 
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), legacyForm); 
            logAction("Update Legacy", "Updated About Us / Legacy content"); 
            setIsEditingLegacy(false); 
        } catch(err) { alert("Failed to save legacy details."); } 
    };

    const handleAddAchievement = () => { 
        if (!tempAchievement.text.trim()) return; 
        const newAch = { 
            text: tempAchievement.text.trim(), 
            date: tempAchievement.date || new Date().toISOString().split('T')[0] 
        }; 
        const updatedList = [...(legacyForm.achievements || []), newAch].sort((a,b) => new Date(a.date) - new Date(b.date)); 
        setLegacyForm(prev => ({ ...prev, achievements: updatedList })); 
        setTempAchievement({ date: '', text: '' }); 
    };

    const handleRemoveAchievement = (index) => { 
        setLegacyForm(prev => ({ 
            ...prev, 
            achievements: prev.achievements.filter((_, i) => i !== index) 
        })); 
    };

    return (
        <div className="space-y-8 animate-fadeIn text-[#3E2723] pb-20">
            
            {/* HERO BANNER */}
            {legacyContent.imageUrl && !isEditingLegacy && (
                <div className="w-full h-64 md:h-80 rounded-[40px] overflow-hidden mb-8 shadow-xl border-4 border-white">
                    <img 
                        src={getDirectLink(legacyContent.imageUrl)} 
                        alt="Legacy Banner" 
                        className="w-full h-full object-cover" 
                    />
                </div>
            )}

            {/* MAIN STORY SECTION */}
            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border-t-[12px] border-[#3E2723] relative">
                <h3 className="font-serif text-4xl font-black uppercase mb-6 flex items-center gap-3">
                    <History size={32} className="text-amber-600"/> Our Legacy
                </h3>

                {isEditingLegacy ? (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">The Story</label>
                            <textarea 
                                className="w-full p-4 border rounded-2xl bg-gray-50 text-sm leading-relaxed outline-none focus:ring-2 ring-amber-100" 
                                rows="8" 
                                value={legacyForm.body} 
                                onChange={e => setLegacyForm({ ...legacyForm, body: e.target.value })} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Banner Image URL</label>
                                <input type="text" className="w-full p-3 border rounded-xl text-xs" value={legacyForm.imageUrl || ''} onChange={e => setLegacyForm({ ...legacyForm, imageUrl: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Photo Gallery Link</label>
                                <input type="text" className="w-full p-3 border rounded-xl text-xs" value={legacyForm.galleryUrl || ''} onChange={e => setLegacyForm({ ...legacyForm, galleryUrl: e.target.value })} />
                            </div>
                        </div>

                        {/* Achievement Editor inside Legacy Form */}
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                            <label className="text-[10px] font-black uppercase text-amber-800 mb-4 block">Edit Milestones</label>
                            <div className="space-y-3 mb-4">
                                {legacyForm.achievements?.map((ach, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm">
                                        <span className="text-[10px] font-bold text-gray-400 w-24">{ach.date}</span>
                                        <span className="text-xs font-bold flex-1">{ach.text}</span>
                                        <button onClick={() => handleRemoveAchievement(idx)} className="text-red-400 p-1"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input type="date" className="p-2 border rounded-lg text-xs" value={tempAchievement.date} onChange={e => setTempAchievement({...tempAchievement, date: e.target.value})} />
                                <input type="text" placeholder="Achievement text..." className="flex-1 p-2 border rounded-lg text-xs" value={tempAchievement.text} onChange={e => setTempAchievement({...tempAchievement, text: e.target.value})} />
                                <button onClick={handleAddAchievement} className="bg-amber-600 text-white p-2 rounded-lg"><Plus size={16}/></button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={handleSaveLegacy} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                <Check size={16}/> Save Changes
                            </button>
                            <button onClick={() => setIsEditingLegacy(false)} className="px-8 py-4 bg-gray-200 text-gray-600 rounded-2xl font-black uppercase text-xs hover:bg-gray-300 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-lg leading-relaxed whitespace-pre-wrap font-medium text-gray-700 italic">
                            {legacyContent.body || "No story has been written yet."}
                        </p>
                        
                        {legacyContent.galleryUrl && (
                            <a 
                                href={legacyContent.galleryUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-block mt-8 bg-amber-100 text-amber-800 px-6 py-3 rounded-xl font-black uppercase text-[10px] hover:bg-amber-200 transition-colors shadow-sm"
                            >
                                📸 View Photo Gallery
                            </a>
                        )}

                        {isOfficer && (
                            <button 
                                onClick={startEditing} 
                                className="absolute top-8 right-8 p-3 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-100 transition-colors shadow-sm"
                            >
                                <Pen size={18}/>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* TIMELINE SECTION */}
            <div className="bg-[#3E2723] text-white p-10 rounded-[48px] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <History size={200} />
                </div>
                
                <h3 className="font-serif text-2xl font-black uppercase mb-10 text-[#FDB813] tracking-widest">
                    Historical Milestones
                </h3>
                
                <div className="space-y-12 border-l-2 border-[#FDB813]/30 pl-8 ml-4 relative">
                    {legacyContent.achievements && legacyContent.achievements.length > 0 ? (
                        legacyContent.achievements.map((ach, i) => (
                            <div key={i} className="relative animate-fadeIn" style={{ animationDelay: `${i * 100}ms` }}>
                                {/* Timeline Dot */}
                                <div className="absolute -left-[41px] top-1.5 w-5 h-5 bg-[#FDB813] rounded-full border-4 border-[#3E2723] shadow-[0_0_0_4px_rgba(253,184,19,0.1)]"></div>
                                
                                <span className="text-[10px] font-black text-[#FDB813] uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full mb-3 inline-block">
                                    {ach.date}
                                </span>
                                <p className="font-bold text-xl leading-snug max-w-2xl">
                                    {ach.text}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-white/40 italic text-sm">No milestones recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AboutView;
