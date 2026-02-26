import React, { useState, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { formatDate } from '../utils/helpers';
import { Bell, Plus, Pen, Trash2 } from 'lucide-react';

const AnnouncementsView = () => {
    const { announcements, profile, isCommitteePlus } = useContext(HubContext);

    const [showAnnounceForm, setShowAnnounceForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

    const handlePostAnnouncement = async (e) => { 
        e.preventDefault(); 
        try { 
            if (editingAnnouncement) { 
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', editingAnnouncement.id), { 
                    ...newAnnouncement, 
                    lastEdited: serverTimestamp() 
                }); 
            } else { 
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), { 
                    ...newAnnouncement, 
                    date: new Date().toISOString(), 
                    createdAt: serverTimestamp() 
                }); 
            } 
            setShowAnnounceForm(false); 
            setNewAnnouncement({ title: '', content: '' }); 
        } catch (err) { alert("Failed to save notice."); } 
    };

    return (
        <div className="space-y-6 animate-fadeIn relative">
            <div className="flex justify-between items-center">
                <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Grind Report</h3>
                {isCommitteePlus && (
                    <button onClick={() => setShowAnnounceForm(true)} className="bg-[#3E2723] text-[#FDB813] px-4 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2">
                        <Plus size={16}/> New Notice
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.length === 0 ? (
                    <div className="p-10 bg-white rounded-[32px] border border-dashed border-amber-200 text-center col-span-full">
                        <Bell size={32} className="mx-auto text-amber-300 mb-3"/>
                        <p className="text-sm font-black text-amber-900 uppercase">All caught up!</p>
                    </div>
                ) : (
                    announcements.map(ann => (
                        <div key={ann.id} className="bg-yellow-50 p-8 rounded-[32px] border border-yellow-200 relative group">
                            <span className="inline-block bg-[#FDB813] px-4 py-1.5 rounded-full text-[9px] font-black uppercase text-[#3E2723] mb-4">
                                {formatDate(ann.date)}
                            </span>
                            <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-3 leading-tight">{ann.title}</h4>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                        </div>
                    ))
                )}
            </div>
            
            {/* Modal placeholder */}
            {showAnnounceForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white p-8 rounded-3xl max-w-md w-full">
                        <h4 className="font-black mb-4">Post Announcement</h4>
                        <input className="w-full p-2 border mb-2" placeholder="Title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                        <textarea className="w-full p-2 border mb-4" placeholder="Content" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
                        <div className="flex gap-2">
                            <button onClick={handlePostAnnouncement} className="bg-[#3E2723] text-white px-4 py-2 rounded">Post</button>
                            <button onClick={() => setShowAnnounceForm(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsView;
