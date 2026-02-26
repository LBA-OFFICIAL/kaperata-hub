import React, { useState, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { formatDate } from '../utils/helpers';
import { BarChart2, Plus, Trash2, MessageSquare, Send } from 'lucide-react';

const MemberCornerView = () => {
    const { 
        polls, suggestions, profile, isCommitteePlus, isOfficer, isExpired 
    } = useContext(HubContext);

    // Local States
    const [showPollForm, setShowPollForm] = useState(false);
    const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
    const [suggestionText, setSuggestionText] = useState("");

    // Helper: Activity Logger
    const logAction = async (action, details) => { 
        if (!profile) return; 
        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
                action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
            }); 
        } catch (err) { console.error("Logging failed:", err); } 
    };

    // --- POLL ACTIONS ---

    const handleCreatePoll = async (e) => { 
        e.preventDefault(); 
        const validOptions = newPoll.options.filter(o => o.trim() !== ''); 
        if (!newPoll.question || validOptions.length < 2) return alert("A question and at least 2 options are required."); 
        
        try { 
            const formattedOptions = validOptions.map((opt, idx) => ({ id: idx + 1, text: opt, votes: [] })); 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'polls'), { 
                question: newPoll.question, 
                options: formattedOptions, 
                createdBy: profile.name, 
                createdAt: serverTimestamp(), 
                status: 'active' 
            }); 
            setShowPollForm(false); 
            setNewPoll({ question: '', options: ['', ''] }); 
            logAction("Create Poll", `Created poll: ${newPoll.question}`); 
        } catch (e) { alert("Failed to create poll."); } 
    };

    const handleVotePoll = async (pollId, optionId) => { 
        if (isExpired) return alert("Renew membership to vote."); 
        try { 
            const pollRef = doc(db, 'artifacts', appId, 'public', 'data', 'polls', pollId); 
            const poll = polls.find(p => p.id === pollId); 
            if (!poll) return; 
            
            const updatedOptions = poll.options.map(opt => { 
                const newVotes = opt.votes.filter(uid => uid !== profile.memberId); // Remove existing vote if any
                if (opt.id === optionId) newVotes.push(profile.memberId); // Add new vote
                return { ...opt, votes: newVotes }; 
            }); 
            await updateDoc(pollRef, { options: updatedOptions }); 
        } catch (e) { alert("Failed to cast vote."); } 
    };

    const handleDeletePoll = async (id) => { 
        if(!confirm("Delete this poll?")) return; 
        try { 
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'polls', id)); 
            logAction("Delete Poll", `Deleted poll ID: ${id}`);
        } catch (e) { alert("Failed to delete poll."); } 
    };

    // --- SUGGESTION ACTIONS ---

    const handlePostSuggestion = async (e) => { 
        e.preventDefault(); 
        if (isExpired) return alert("Your membership is expired. Please renew to post suggestions."); 
        if (!suggestionText.trim()) return; 
        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), { 
                text: suggestionText, 
                authorId: profile.memberId, 
                authorName: "Anonymous", 
                createdAt: serverTimestamp() 
            }); 
            setSuggestionText(""); 
            alert("Suggestion submitted anonymously!"); 
        } catch (err) { alert("Failed to submit suggestion."); } 
    };

    const handleDeleteSuggestion = async (id) => { 
        if(!confirm("Are you sure you want to delete this suggestion?")) return; 
        try { 
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id)); 
            logAction("Delete Suggestion", `Deleted suggestion ID: ${id}`); 
        } catch(err) { alert("Failed to delete suggestion."); } 
    };

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto relative">
            
            {/* HEADER */}
            <div className="text-center mb-8">
                <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Member's Corner</h3>
                <p className="text-gray-500 font-bold text-xs uppercase">Your voice, your vote, your community.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* LEFT COLUMN: POLLS */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h4 className="font-black uppercase text-sm flex items-center gap-2 text-[#3E2723]">
                            <BarChart2 size={18}/> Community Polls
                        </h4>
                        {isCommitteePlus && (
                            <button onClick={() => { setNewPoll({ question: '', options: ['', ''] }); setShowPollForm(true); }} className="bg-amber-100 text-amber-700 p-2 rounded-xl hover:bg-amber-200 transition-colors">
                                <Plus size={16}/>
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {polls.length === 0 ? (
                            <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                                No active polls.
                            </div>
                        ) : (
                            polls.map(poll => (
                                <div key={poll.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm relative group">
                                    {isCommitteePlus && (
                                        <button onClick={() => handleDeletePoll(poll.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Trash2 size={14}/>
                                        </button>
                                    )}
                                    <h5 className="font-bold text-sm text-[#3E2723] mb-4 pr-6 leading-snug">{poll.question}</h5>
                                    
                                    <div className="space-y-3">
                                        {poll.options && poll.options.map(opt => {
                                            const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes?.length || 0), 0);
                                            const percent = totalVotes === 0 ? 0 : Math.round(((opt.votes?.length || 0) / totalVotes) * 100);
                                            const hasVoted = opt.votes?.includes(profile.memberId);
                                            
                                            return (
                                                <div key={opt.id} onClick={() => handleVotePoll(poll.id, opt.id)} className={`relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all ${hasVoted ? 'border-[#3E2723]' : 'border-gray-100 hover:border-amber-200'}`}>
                                                    <div className="absolute top-0 left-0 bottom-0 bg-amber-100 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                                    <div className="relative p-3 flex justify-between items-center z-10">
                                                        <span className={`text-xs font-bold ${hasVoted ? 'text-[#3E2723]' : 'text-gray-600'}`}>{opt.text}</span>
                                                        <span className="text-[10px] font-black opacity-60">{percent}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[9px] text-gray-400 text-right mt-3 uppercase font-bold">
                                        {poll.options?.reduce((acc,o)=>acc+(o.votes?.length||0),0)} Votes
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                {/* RIGHT COLUMN: SUGGESTION BOX */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h4 className="font-black uppercase text-sm flex items-center gap-2 text-[#3E2723]">
                            <MessageSquare size={18}/> Suggestion Box
                        </h4>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm">
                        <form onSubmit={handlePostSuggestion}>
                            <textarea 
                                className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-sm resize-none focus:ring-2 ring-amber-100" 
                                rows="3" 
                                placeholder="Drop your thoughts anonymously..." 
                                value={suggestionText} 
                                onChange={e => setSuggestionText(e.target.value)} 
                            />
                            <div className="flex justify-end mt-4">
                                <button type="submit" disabled={!suggestionText.trim()} className="bg-[#3E2723] text-[#FDB813] px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black disabled:opacity-50 transition-colors">
                                    <Send size={14}/> Send
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    {/* View Suggestions (Officers only usually, but following your original render logic) */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {suggestions.map(s => (
                            <div key={s.id} className="bg-white p-4 rounded-2xl border border-gray-100 relative group shadow-sm">
                                {isOfficer && (
                                    <button onClick={() => handleDeleteSuggestion(s.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                                        <Trash2 size={12}/>
                                    </button>
                                )}
                                <p className="text-gray-800 text-xs font-medium italic">"{s.text}"</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase mt-2 text-right">
                                    {s.createdAt?.toDate ? formatDate(s.createdAt.toDate()) : "Just now"}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CREATE POLL MODAL */}
            {showPollForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border-b-[8px] border-[#3E2723]">
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Create New Poll</h3>
                        <div className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Poll Question" 
                                className="w-full p-3 border border-amber-200 rounded-xl text-sm font-bold" 
                                value={newPoll.question} 
                                onChange={e => setNewPoll({...newPoll, question: e.target.value})} 
                            />
                            
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {newPoll.options.map((opt, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder={`Option ${index + 1}`} 
                                            className="flex-1 p-3 border rounded-xl text-xs" 
                                            value={opt} 
                                            onChange={e => { 
                                                const updatedOptions = [...newPoll.options]; 
                                                updatedOptions[index] = e.target.value; 
                                                setNewPoll({...newPoll, options: updatedOptions}); 
                                            }} 
                                        />
                                        {newPoll.options.length > 2 && (
                                            <button type="button" onClick={() => { 
                                                const filtered = newPoll.options.filter((_, i) => i !== index); 
                                                setNewPoll({...newPoll, options: filtered}); 
                                            }} className="text-red-400 hover:text-red-600 font-bold px-2">
                                                X
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button type="button" onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="text-xs text-amber-600 font-bold uppercase w-full text-center hover:text-amber-800 transition-colors">
                                + Add Another Option
                            </button>
                            
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button onClick={() => setShowPollForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                                <button onClick={handleCreatePoll} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-[#FDB813] font-bold uppercase text-xs hover:bg-black">Post Poll</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberCornerView;
