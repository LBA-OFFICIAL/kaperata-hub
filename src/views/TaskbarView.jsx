import React, { useState, useContext } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { 
    Plus, UserCheck, Clock, ChevronRight, Pen, Trash2, 
    Coffee, Loader2, CheckSquare2, ExternalLink as Link2 
} from 'lucide-react';

const TaskBarView = () => {
    const { 
        profile, projects, tasks, members, isOfficer, isCommitteePlus 
    } = useContext(HubContext);

    // Local States for UI
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    
    // Project Form States
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [newProject, setNewProject] = useState({ 
        title: '', description: '', deadline: '', projectHeadId: '', projectHeadName: '' 
    });

    // Task Form States
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [newTask, setNewTask] = useState({ 
        title: '', description: '', deadline: '', link: '', status: 'pending', notes: '', projectId: '' 
    });

    // Helper: Activity Logger
    const logAction = async (action, details) => { 
        if (!profile) return; 
        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
                action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
            }); 
        } catch (err) { console.error("Logging failed:", err); } 
    };

    // --- PROJECT ACTIONS ---
    const handleCreateProject = async (e) => { 
        e.preventDefault(); 
        try { 
            const validMembers = members.filter(m => m != null); 
            const projectHead = validMembers.find(m => m?.memberId === newProject.projectHeadId); 
            const payload = { 
                title: newProject.title, 
                description: newProject.description, 
                deadline: newProject.deadline, 
                projectHeadId: newProject.projectHeadId, 
                projectHeadName: projectHead ? projectHead.name : '' 
            }; 
            
            if (editingProject) { 
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', editingProject.id), { ...payload, lastEdited: serverTimestamp() }); 
                logAction("Update Project", `Updated project: ${newProject.title}`); 
                setEditingProject(null); 
            } else { 
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), { ...payload, createdBy: profile.memberId, createdAt: serverTimestamp(), status: 'active' }); 
                logAction("Create Project", `Created project: ${newProject.title}`); 
            } 
            setShowProjectForm(false); 
            setNewProject({ title: '', description: '', deadline: '', projectHeadId: '', projectHeadName: '' }); 
        } catch(e) { alert("Failed to save project."); } 
    };

    const handleEditProject = (proj) => { 
        setNewProject({ 
            title: proj.title, description: proj.description, deadline: proj.deadline, 
            projectHeadId: proj.projectHeadId, projectHeadName: proj.projectHeadName 
        }); 
        setEditingProject(proj); 
        setShowProjectForm(true); 
    };

    const handleDeleteProject = async (proj) => {
        if(confirm(`Are you sure you want to delete the project board "${proj.title}"? This cannot be undone.`)) { 
            try {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', proj.id)); 
                logAction("Delete Project", `Deleted project board: ${proj.title}`);
            } catch (err) { alert("Failed to delete project."); }
        }
    };

    // --- TASK ACTIONS ---
    const handleAddTask = async (e) => { 
        e.preventDefault(); 
        if (!newTask.projectId) return alert("Task must belong to a project"); 
        try { 
            if (editingTask) { 
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', editingTask.id), { ...newTask, lastEdited: serverTimestamp() }); 
                logAction("Update Task", `Updated task: ${newTask.title}`); 
                setEditingTask(null); 
            } else { 
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { ...newTask, createdBy: profile.memberId, creatorName: profile.name, createdAt: serverTimestamp() }); 
                logAction("Create Task", `Created task: ${newTask.title}`); 
            } 
            setShowTaskForm(false); 
            setNewTask({ title: '', description: '', deadline: '', link: '', status: 'pending', notes: '', projectId: newTask.projectId }); 
        } catch (err) { alert("Failed to save task."); } 
    };

    const handleEditTask = (task) => { 
        setNewTask({ 
            title: task.title, description: task.description, deadline: task.deadline, 
            link: task.link, status: task.status, notes: task.notes || '', projectId: task.projectId 
        }); 
        setEditingTask(task); 
        setShowTaskForm(true); 
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => { 
        try { 
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { status: newStatus }); 
        } catch (err) { alert("Failed to update status."); } 
    };

    const handleDeleteTask = async (id) => { 
        if(!confirm("Delete this task?")) return; 
        try { 
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id)); 
            logAction("Delete Task", `Deleted task ID: ${id}`); 
        } catch(err) { alert("Failed to delete task."); } 
    };

    return (
        <div className="space-y-8 animate-fadeIn text-[#3E2723]">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">The Task Bar</h3>
                {isOfficer && (
                    <button onClick={() => { 
                        setEditingProject(null); 
                        setNewProject({ title: '', description: '', deadline: '', projectHeadId: '', projectHeadName: '' }); 
                        setShowProjectForm(true); 
                    }} className="bg-[#3E2723] text-white p-3 rounded-xl hover:bg-black transition-colors shadow-md">
                        <Plus size={20}/>
                    </button>
                )}
            </div>

            {/* PROJECT BOARDS GRID */}
            {projects.length === 0 ? (
                <div className="p-10 bg-white rounded-[32px] border border-dashed border-amber-200 text-center">
                    <ClipboardList size={32} className="mx-auto text-amber-300 mb-3"/>
                    <p className="text-sm font-black text-amber-900 uppercase">No active projects</p>
                    <p className="text-xs text-amber-700/60 mt-1">Time to start brewing a new idea!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(proj => {
                        const isExpanded = expandedProjectId === proj.id;
                        const projectTasks = tasks.filter(t => t.projectId === proj.id);
                        const completedCount = projectTasks.filter(t => t.status === 'served').length;
                        const totalCount = projectTasks.length;
                        const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
                        
                        return (
                            <div key={proj.id} className={`bg-white rounded-[32px] border transition-all ${isExpanded ? 'col-span-full border-[#3E2723] shadow-xl' : 'border-amber-100 shadow-sm hover:shadow-md'}`}>
                                
                                {/* PROJECT CARD HEADER (Clickable) */}
                                <div className="p-6 cursor-pointer" onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-black text-lg text-[#3E2723] uppercase leading-tight pr-2">{proj.title}</h4>
                                            <p className="text-[10px] font-bold text-indigo-600 mt-1 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md w-max">
                                                <UserCheck size={12}/> Assigned Head: {proj.projectHeadName || 'Unassigned'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-full ${progress === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {progress}% Done
                                            </span>
                                            <p className="text-[9px] text-gray-400 mt-1">{completedCount}/{totalCount} Tasks</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                                        <div className="bg-[#3E2723] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><Clock size={12}/> Due: {new Date(proj.deadline).toLocaleDateString()}</span>
                                        <button className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1 hover:underline">
                                            {isExpanded ? 'Close Board' : 'Open Board'} <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* EXPANDED KANBAN BOARD */}
                                {isExpanded && (
                                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-[32px] animate-fadeIn">
                                        
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                            <p className="text-xs text-gray-500 max-w-2xl italic pr-4">"{proj.description}"</p>
                                            <div className="flex gap-2 shrink-0 flex-wrap">
                                                {(isOfficer || profile.memberId === proj.projectHeadId) && (
                                                    <>
                                                        <button onClick={(e) => { e.stopPropagation(); handleEditProject(proj); }} className="bg-amber-100 text-amber-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-amber-200 flex items-center gap-1 shadow-sm"><Pen size={12}/> Edit Board</button>
                                                        {isOfficer && <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj); }} className="bg-red-100 text-red-700 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-200 flex items-center gap-1 shadow-sm"><Trash2 size={12}/></button>}
                                                    </>
                                                )}
                                                {(isCommitteePlus || profile.memberId === proj.projectHeadId) && (
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingTask(null); setNewTask({ title: '', description: '', deadline: '', link: '', status: 'pending', notes: '', projectId: proj.id }); setShowTaskForm(true); }} className="bg-[#3E2723] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-black flex items-center gap-1 shadow-sm">
                                                        <Plus size={12}/> Add Task
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Columns */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {['pending', 'brewing', 'served'].map(status => (
                                                <div key={status} className="bg-white/50 p-3 rounded-2xl border border-gray-200">
                                                    <h5 className="font-black uppercase text-[10px] text-gray-400 mb-3 flex items-center gap-2">
                                                        {status === 'pending' ? <Coffee size={12}/> : status === 'brewing' ? <Loader2 size={12} className="animate-spin text-amber-500"/> : <CheckSquare2 size={12} className="text-green-500"/>}
                                                        {status === 'pending' ? 'To Roast' : status === 'brewing' ? 'Brewing' : 'Served'}
                                                    </h5>
                                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                                                        {projectTasks.filter(t => t.status === status).map(task => (
                                                            <div key={task.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative group">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-bold text-xs text-[#3E2723]">{task.title}</span>
                                                                    <div className="flex gap-1">
                                                                        <button onClick={() => handleEditTask(task)} className="text-amber-500 hover:text-amber-700 p-1"><Pen size={12}/></button>
                                                                        {isOfficer && <button onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12}/></button>}
                                                                    </div>
                                                                </div>
                                                                
                                                                <details className="mt-2 text-[10px] cursor-pointer">
                                                                    <summary className="font-bold text-amber-600 mb-2 outline-none list-none flex items-center gap-1 hover:text-amber-800 transition-colors">
                                                                        <ChevronRight size={12} className="inline-block transition-transform duration-200"/> View Details
                                                                    </summary>
                                                                    <div className="pl-3 py-2 border-l-2 border-amber-100 space-y-3 cursor-default">
                                                                        {task.description && <p className="text-gray-600 italic leading-relaxed">{task.description}</p>}
                                                                        {task.link && (
                                                                            <a href={task.link.startsWith('http') ? task.link : `https://${task.link}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded-lg w-fit">
                                                                                <Link2 size={10}/> Open Reference
                                                                            </a>
                                                                        )}
                                                                        {task.notes && <div className="bg-amber-50 p-2 rounded-lg text-amber-900 border border-amber-100 font-medium">Feedback: {task.notes}</div>}
                                                                    </div>
                                                                </details>
                                                                
                                                                <div className="flex gap-1 border-t border-gray-100 pt-2 mt-2">
                                                                    {status !== 'pending' && <button onClick={() => handleUpdateTaskStatus(task.id, 'pending')} className="flex-1 bg-gray-100 text-[8px] font-bold uppercase rounded py-1.5 hover:bg-gray-200 text-gray-600 transition-colors">Revert</button>}
                                                                    {status !== 'brewing' && <button onClick={() => handleUpdateTaskStatus(task.id, 'brewing')} className="flex-1 bg-amber-100 text-[8px] font-bold uppercase rounded py-1.5 hover:bg-amber-200 text-amber-800 transition-colors">Brew</button>}
                                                                    {status !== 'served' && <button onClick={() => handleUpdateTaskStatus(task.id, 'served')} className="flex-1 bg-green-100 text-[8px] font-bold uppercase rounded py-1.5 hover:bg-green-200 text-green-800 transition-colors">Serve</button>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {projectTasks.filter(t => t.status === status).length === 0 && (
                                                            <div className="text-center py-4 text-[10px] text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">Empty</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- MODALS --- */}
            
            {/* PROJECT FORM MODAL */}
            {showProjectForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingProject ? "Edit Project" : "Create New Project"}</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Project Title" className="w-full p-3 border rounded-xl text-xs font-bold" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
                            <textarea placeholder="Description / Goals" className="w-full p-3 border rounded-xl text-xs" rows="3" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Deadline</label>
                                    <input type="date" className="w-full p-3 border rounded-xl text-xs" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Assign Project Head</label>
                                    <select className="w-full p-3 border rounded-xl text-xs" value={newProject.projectHeadId} onChange={e => setNewProject({...newProject, projectHeadId: e.target.value})}>
                                        <option value="">Select Member...</option>
                                        {members.filter(m=>m!=null).map(m => (<option key={m.memberId} value={m.memberId}>{m.name}</option>))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowProjectForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                                <button onClick={handleCreateProject} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-[#FDB813] font-bold uppercase text-xs hover:bg-black">{editingProject ? "Save" : "Create"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TASK FORM MODAL */}
            {showTaskForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingTask ? "Edit Task" : "Add Task"}</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Task Title" className="w-full p-3 border rounded-xl text-xs font-bold" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                            <textarea placeholder="Description" className="w-full p-3 border rounded-xl text-xs" rows="3" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" className="w-full p-3 border rounded-xl text-xs" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                                <select className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                                    <option value="pending">To Roast (Pending)</option>
                                    <option value="brewing">Brewing (In Progress)</option>
                                    <option value="served">Served (Completed)</option>
                                </select>
                            </div>
                            
                            <input type="text" placeholder="Reference Link (URL)" className="w-full p-3 border rounded-xl text-xs" value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} />
                            
                            <div className="bg-amber-50 p-3 rounded-xl">
                                <label className="text-[10px] font-black uppercase text-amber-800 mb-1 block">Barista Notes / Feedback</label>
                                <textarea className="w-full p-3 border border-amber-200 rounded-xl text-xs bg-white" rows="2" value={newTask.notes} onChange={e => setNewTask({...newTask, notes: e.target.value})} />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowTaskForm(false); setEditingTask(null); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                                <button onClick={handleAddTask} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Save Task</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default TaskBarView;
