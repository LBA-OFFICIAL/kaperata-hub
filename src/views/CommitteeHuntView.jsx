import React, { useState, useContext } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp, writeBatch, arrayUnion } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { COMMITTEES_INFO, formatDate } from '../utils/helpers';
import { Briefcase, Mail, Trash2, X, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const CommitteeHuntView = () => {
    const { 
        profile, committeeApps, userApplications, isSuperAdmin, isExpired 
    } = useContext(HubContext);

    // Local States
    const [submittingApp, setSubmittingApp] = useState(false);
    const [emailModal, setEmailModal] = useState({ isOpen: false, app: null, type: '', subject: '', body: '' });

    // Helper: Activity Logger
    const logAction = async (action, details) => { 
        if (!profile) return; 
        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
                action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
            }); 
        } catch (err) { console.error("Logging failed:", err); } 
    };

    // --- MEMBER ACTIONS ---
    const handleApplyCommittee = async (targetCommitteeId) => {
        if (isExpired) return alert("Your membership is expired. Please renew to apply.");
        setSubmittingApp(true);
        
        try {
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId));
            const snap = await getDocs(q);
            
            if(!snap.empty) {
                alert("You already have a pending application.");
                setSubmittingApp(false);
                return;
            }

            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), {
                memberId: profile.memberId,
                name: profile.name,
                email: profile.email,
                committee: targetCommitteeId,
                role: 'Committee Member',
                status: 'pending',
                createdAt: serverTimestamp(),
                statusUpdatedAt: serverTimestamp()
            });

            alert("Application submitted successfully!");
        } catch(err) {
            alert("Failed to submit application.");
        } finally {
            setSubmittingApp(false);
        }
    };

    // --- ADMIN ACTIONS ---
    const initiateAppAction = (app, type) => {
        let subject = "";
        let body = "";
        const signature = "\n\nBest regards,\nLBA Executive Committee";

        if (type === 'for_interview') {
            subject = `LBA Committee Application: Interview Invitation`;
            body = `Dear ${app.name},\n\nWe have reviewed your application for the ${app.committee} committee and would like to invite you for a short interview.\n\nPlease let us know your availability this week.\n${signature}`;
        } else if (type === 'accepted') {
            subject = `LBA Committee Application: Congratulations!`;
            body = `Dear ${app.name},\n\nWe are pleased to inform you that you have been accepted as a Committee Member for ${app.committee}!\n\nWelcome to the team! We will add you to the official group chat shortly.\n${signature}`;
        } else if (type === 'denied') {
            subject = `LBA Committee Application Update`;
            body = `Dear ${app.name},\n\nThank you for your interest in joining the LBA Committee. After careful consideration, we regret to inform you that we cannot move forward with your application at this time.\n\nWe encourage you to stay active and apply again in the future!\n${signature}`;
        }

        setEmailModal({ isOpen: true, app, type, subject, body });
    };

    const confirmAppAction = async () => {
        if (!emailModal.app) return;
        try {
            const { app, type, subject, body } = emailModal;
            const batch = writeBatch(db);
            const appRef = doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id);
            
            const updates = { 
                status: type, 
                statusUpdatedAt: serverTimestamp(), 
                lastEmailSent: new Date().toISOString() 
            };
            
            batch.update(appRef, updates);

            // If accepted, automatically update their Registry Profile
            if (type === 'accepted') {
                const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', app.memberId);
                batch.update(memberRef, { 
                    positionCategory: 'Committee', 
                    specificTitle: 'Committee Member', 
                    committee: app.committee,
                    accolades: arrayUnion(`${app.committee} Member`)
                });
            }

            await batch.commit();
            logAction("Committee Action", `${type.toUpperCase()} application for ${app.name}`);
            
            // Open the user's local email client
            window.location.href = `mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' });
            alert("Status updated and email client opened!");
        } catch (err) {
            alert("Error updating status.");
        }
    };

    const handleDeleteApp = async (id) => {
        if (!confirm("Delete this application record?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id));
            logAction("Delete App", `Deleted application ID: ${id}`);
        } catch (err) { alert("Delete failed."); }
    };

    return (
        <div className="space-y-8 animate-fadeIn text-[#3E2723]">
            {/* HERO BANNER */}
            <div className="bg-[#3E2723] text-white p-10 rounded-[48px] text-center relative overflow-hidden shadow-xl">
                <div className="relative z-10">
                    <h3 className="font-serif text-4xl font-black uppercase mb-4">Join the Team</h3>
                    <p className="text-amber-200/80 font-bold uppercase text-sm max-w-xl mx-auto">Serve the student body, hone your leadership skills, and be part of the legacy.</p>
                </div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            {/* ADMIN DASHBOARD (Applicants List) */}
            {isSuperAdmin && (
                <div className="bg-white p-8 rounded-[40px] border-2 border-[#3E2723] shadow-md">
                    <h4 className="font-black uppercase text-sm mb-6 flex items-center gap-2"><Briefcase size={18}/> Review Applicants ({committeeApps.length})</h4>
                    <div className="space-y-4">
                        {committeeApps.length === 0 ? <p className="text-center text-gray-400 py-4 italic">No applications received yet.</p> : (
                            committeeApps.map(app => (
                                <div key={app.id} className="p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
                                    <div>
                                        <p className="font-black uppercase text-[#3E2723]">{app.name}</p>
                                        <p className="text-[10px] font-bold text-amber-700 uppercase">Applying for: {app.committee}</p>
                                        <p className="text-[9px] text-gray-400 mt-1">Submitted: {app.createdAt?.toDate ? formatDate(app.createdAt.toDate()) : 'Recently'}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => initiateAppAction(app, 'for_interview')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase hover:bg-blue-200">Invite</button>
                                        <button onClick={() => initiateAppAction(app, 'accepted')} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase hover:bg-green-200">Accept</button>
                                        <button onClick={() => initiateAppAction(app, 'denied')} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase hover:bg-red-200">Deny</button>
                                        <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* MEMBER'S OWN APPLICATION STATUS */}
            {!isSuperAdmin && userApplications && userApplications.length > 0 && (
                <div className="bg-white p-8 rounded-[32px] border-2 border-amber-200 shadow-md">
                    <h4 className="font-black uppercase text-sm mb-4 text-[#3E2723] flex items-center gap-2"><Clock size={18}/> Your Application Status</h4>
                    <div className="space-y-3">
                        {userApplications.map(app => {
                            let statusStyles = 'bg-yellow-50 border-yellow-200 text-yellow-700';
                            let statusText = "Application Pending";
                            if (app.status === 'for_interview') { statusStyles = 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse'; statusText = "Shortlisted for Interview"; }
                            else if (app.status === 'accepted') { statusStyles = 'bg-green-50 border-green-300 text-green-700'; statusText = "🎉 Application Accepted!"; }
                            else if (app.status === 'denied') { statusStyles = 'bg-gray-50 border-gray-200 text-gray-500'; statusText = "Application Closed"; }

                            return (
                                <div key={app.id} className={`p-5 rounded-2xl border-2 flex justify-between items-center ${statusStyles}`}>
                                    <div><p className="font-black uppercase text-lg">{app.committee}</p><p className="text-[10px] uppercase font-bold">{app.role}</p></div>
                                    <p className="font-black uppercase text-xs">{statusText}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* COMMITTEE CARDS FOR RECRUITMENT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {COMMITTEES_INFO.map(c => {
                    const hasApplied = userApplications && userApplications.some(a => a.committee === c.id);
                    return (
                        <div key={c.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm hover:shadow-xl transition-all flex flex-col group">
                            <div className="h-32 rounded-2xl bg-gray-100 mb-6 overflow-hidden">
                                <img src={c.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={c.title} />
                            </div>
                            <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-2">{c.title}</h4>
                            <p className="text-xs text-gray-600 mb-6 leading-relaxed flex-1">{c.description}</p>
                            <button 
                                onClick={() => handleApplyCommittee(c.id)} 
                                disabled={submittingApp || hasApplied} 
                                className={`w-full py-4 rounded-xl font-black uppercase text-xs transition-all ${hasApplied ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200' : 'bg-[#3E2723] text-[#FDB813] hover:bg-black shadow-md'}`}
                            >
                                {hasApplied ? 'Applied ✓' : 'Apply Now'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* EMAIL MODAL (Admin) */}
            {emailModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Send Update Email</h3>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Subject</label><input type="text" className="w-full p-3 border rounded-xl text-xs font-bold" value={emailModal.subject} onChange={e => setEmailModal({...emailModal, subject: e.target.value})} /></div>
                            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Message Body</label><textarea className="w-full p-3 border rounded-xl text-xs h-32" value={emailModal.body} onChange={e => setEmailModal({...emailModal, body: e.target.value})} /></div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' })} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                                <button onClick={confirmAppAction} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Update & Open Email</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommitteeHuntView;
