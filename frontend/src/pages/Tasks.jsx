import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import {
  CheckSquare, Trash2, PlusCircle, CheckCircle, AlertCircle,
  BookOpen, Code, Globe, Cpu, Users, UserPlus, UserMinus,
  ChevronDown, ChevronUp, Search, X, UsersRound
} from 'lucide-react';

const DEFAULT_PLATFORMS = ['Codechef', 'HackerRank', 'Akamai', 'Internal'];

const normalizePlatform = (raw) => {
  if (!raw) return 'Akamai';
  const lower = raw.toLowerCase();
  if (lower === 'codechef') return 'Codechef';
  if (lower === 'hackerrank') return 'HackerRank';
  if (lower === 'akamai') return 'Akamai';
  if (lower === 'internal') return 'Internal';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const PLATFORM_COLORS = {
  Codechef:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HackerRank: 'bg-green-500/10 text-green-400 border-green-500/20',
  Akamai:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Internal:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
};
const getPlatformColor = (plat) =>
  PLATFORM_COLORS[plat] || 'bg-pink-500/10 text-pink-400 border-pink-500/20';

const PlatformIcon = ({ platform, className }) => {
  switch (platform) {
    case 'Codechef':   return <Code className={className} />;
    case 'HackerRank': return <CheckSquare className={className} />;
    case 'Akamai':     return <Globe className={className} />;
    default:           return <Cpu className={className} />;
  }
};

/* ── Trainee multi-select checkboxlist ─────────────────────────────── */
const TraineeSelector = ({ trainees, selected, onChange, isDark }) => {
  const [search, setSearch] = useState('');
  const filtered = trainees.filter(t =>
    t.trainee_name.toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  const selectAll = () => onChange(filtered.map(t => t.id));
  const clearAll = () => onChange([]);

  return (
    <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      {/* Search bar */}
      <div className={`flex items-center gap-2 p-2 border-b ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
        <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
        <input
          type="text"
          placeholder="Search trainees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 text-xs bg-transparent outline-none ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-300">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Bulk actions */}
      <div className={`flex gap-3 px-3 py-1.5 text-[10px] font-bold border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
        <button onClick={selectAll} className="text-indigo-400 hover:text-indigo-300">
          Select all ({filtered.length})
        </button>
        <span className={isDark ? 'text-gray-700' : 'text-gray-300'}>|</span>
        <button onClick={clearAll} className="text-red-400 hover:text-red-300">Clear</button>
        <span className={`ml-auto ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {selected.length} selected
        </span>
      </div>

      {/* Trainee list */}
      <div className="max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className={`text-xs text-center py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No trainees found</p>
        ) : (
          filtered.map(t => {
            const checked = selected.includes(t.id);
            return (
              <label
                key={t.id}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                  checked
                    ? isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                    : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(t.id)}
                  className="accent-indigo-500 h-3.5 w-3.5"
                />
                <span className={`text-xs font-medium flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {t.trainee_name}
                </span>
                {checked && <CheckCircle className="h-3 w-3 text-indigo-500 shrink-0" />}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ── Manage Assignments panel ──────────────────────────────────────── */
const ManageAssignmentsPanel = ({ task, trainees, isDark, onToast, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [toAdd, setToAdd] = useState([]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${task.id}/assignments`);
      setAssignments(res.data);
    } catch { /* noop */ }
  }, [task.id]);

  useEffect(() => {
    if (open) fetchAssignments();
  }, [open, fetchAssignments]);

  const assignedIds = assignments.map(a => a.trainee_id);
  const unassignedTrainees = trainees.filter(t => !assignedIds.includes(t.id));

  const handleRemove = async (traineeId, traineeName) => {
    if (!confirm(`Remove "${traineeName}" from "${task.task_name}"?\n\nAll their progress on this task will be permanently deleted.`)) return;
    setLoadingAssign(true);
    try {
      await api.post(`/tasks/${task.id}/unassign`, { trainee_ids: [traineeId] });
      onToast(`Removed "${traineeName}" from task.`);
      await fetchAssignments();
      onRefresh();
    } catch (err) {
      onToast(err.response?.data?.detail || 'Failed to remove assignment.', 'error');
    } finally {
      setLoadingAssign(false);
    }
  };

  const handleAdd = async () => {
    if (toAdd.length === 0) return;
    setLoadingAssign(true);
    try {
      const res = await api.post(`/tasks/${task.id}/assign`, { trainee_ids: toAdd });
      onToast(res.data.message || 'Assigned successfully.');
      setToAdd([]);
      setAddMode(false);
      await fetchAssignments();
      onRefresh();
    } catch (err) {
      onToast(err.response?.data?.detail || 'Failed to assign.', 'error');
    } finally {
      setLoadingAssign(false);
    }
  };

  const statusColor = {
    'Completed':      'text-emerald-400',
    'In Progress':    'text-amber-400',
    'Not Started':    isDark ? 'text-gray-500' : 'text-gray-400',
    'Does Not Apply': 'text-gray-600',
  };

  return (
    <div className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
          isDark ? 'hover:bg-gray-800/40 text-gray-400' : 'hover:bg-gray-50 text-gray-500'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <UsersRound className="h-3.5 w-3.5" />
          Manage Assignments
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
            isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
          }`}>
            {assignments.length}
          </span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className={`px-4 pb-4 space-y-3 ${isDark ? 'bg-gray-950/30' : 'bg-gray-50/50'}`}>
          {/* Current assignments */}
          {assignments.length === 0 ? (
            <p className={`text-xs py-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              No trainees assigned to this task yet.
            </p>
          ) : (
            <div className="space-y-1.5 pt-2">
              {assignments.map(a => (
                <div key={a.trainee_id} className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
                  isDark ? 'bg-gray-900' : 'bg-white border border-gray-100'
                }`}>
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {a.trainee_name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold ${statusColor[a.status] || 'text-gray-400'}`}>
                      {a.status}
                    </span>
                    <button
                      onClick={() => handleRemove(a.trainee_id, a.trainee_name)}
                      disabled={loadingAssign}
                      title="Remove assignment"
                      className="text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add more trainees */}
          {unassignedTrainees.length > 0 && (
            <div>
              {!addMode ? (
                <button
                  onClick={() => setAddMode(true)}
                  className={`flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors`}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Add trainees
                </button>
              ) : (
                <div className="space-y-2">
                  <TraineeSelector
                    trainees={unassignedTrainees}
                    selected={toAdd}
                    onChange={setToAdd}
                    isDark={isDark}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={toAdd.length === 0 || loadingAssign}
                      className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      {loadingAssign ? 'Assigning...' : `Assign ${toAdd.length} Trainee${toAdd.length !== 1 ? 's' : ''}`}
                    </button>
                    <button
                      onClick={() => { setAddMode(false); setToAdd([]); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Main Tasks page ───────────────────────────────────────────────── */
export const Tasks = () => {
  const { role, theme } = useContext(AuthContext);
  const isDark = theme === 'dark';
  const isAdmin = role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // New task form state
  const [taskName, setTaskName] = useState('');
  const [platform, setPlatform] = useState('HackerRank');
  const [newPlatform, setNewPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Assignment mode: 'all' | 'select' | 'none'
  const [assignMode, setAssignMode] = useState('all');
  const [selectedTrainees, setSelectedTrainees] = useState([]);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks/');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      triggerToast('Failed to load tasks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainees = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/trainees/', { params: { status: 'active' } });
      setTrainees(res.data);
    } catch (err) {
      console.error('Failed to load trainees:', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchTasks(), fetchTrainees()]);
  }, []);

  const uniquePlatforms = Array.from(new Set([
    ...DEFAULT_PLATFORMS,
    ...tasks.map(t => normalizePlatform(t.platform)).filter(Boolean)
  ]));

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim() || !category.trim()) return;

    let finalPlatform = platform;
    if (platform === 'Other') {
      const trimmedNew = newPlatform.trim();
      if (!trimmedNew) { triggerToast('New platform name is required.', 'error'); return; }
      if (trimmedNew.length < 2) { triggerToast('Platform name must be at least 2 characters.', 'error'); return; }
      if (uniquePlatforms.some(p => p.toLowerCase() === trimmedNew.toLowerCase())) {
        triggerToast('Platform name already exists.', 'error'); return;
      }
      finalPlatform = trimmedNew;
    }

    if (assignMode === 'select' && selectedTrainees.length === 0) {
      triggerToast('Please select at least one trainee, or choose "All Users" / "No Assignment".', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        task_name: taskName.trim(),
        platform: finalPlatform,
        category: category.trim(),
        description: description.trim() || null,
        assign_to_all: assignMode === 'all',
        assign_to: assignMode === 'select' ? selectedTrainees : null,
      };
      await api.post('/tasks/', payload);

      const assignMsg =
        assignMode === 'all'    ? 'and assigned to all trainees!' :
        assignMode === 'select' ? `and assigned to ${selectedTrainees.length} trainee(s)!` :
                                  '(no assignments yet — use Manage Assignments to assign).';
      triggerToast(`Task created ${assignMsg}`);

      setTaskName(''); setCategory(''); setDescription('');
      setPlatform('HackerRank'); setNewPlatform('');
      setAssignMode('all'); setSelectedTrainees([]);
      fetchTasks();
    } catch (err) {
      triggerToast(err.response?.data?.detail || 'Failed to create task.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (id, name) => {
    if (!confirm(`Delete task "${name}"?\n\nThis will permanently remove all assignments and progress for all trainees.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/tasks/${id}`);
      triggerToast(`Task "${name}" deleted.`);
      fetchTasks();
    } catch (err) {
      triggerToast(err.response?.data?.detail || 'Failed to delete task.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = uniquePlatforms.reduce((acc, p) => {
    acc[p] = tasks.filter(t => normalizePlatform(t.platform) === p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Layout title="Task Management">
      <div className="space-y-8 max-w-7xl mx-auto pb-16">

        {/* Toast */}
        {toast.show && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-xl border z-50 flex items-center gap-3 text-sm shadow-xl ${
            toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {toast.type === 'error'
              ? <AlertCircle className="h-5 w-5 shrink-0" />
              : <CheckCircle className="h-5 w-5 shrink-0" />}
            <p className="font-semibold">{toast.message}</p>
          </div>
        )}

        <div className={`grid gap-8 ${isAdmin ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

          {/* ── Create Task Form — Admin only ── */}
          {isAdmin && (
            <div className={`p-6 rounded-2xl border space-y-5 shadow-xl ${
              isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
            }`}>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-indigo-500" />
                  Create New Task
                </h3>
                <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>
                  Create and assign tasks to specific trainees.
                </p>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">

                {/* Task Name */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Task Name *
                  </label>
                  <input
                    type="text" required placeholder="e.g. Two Sum Problem"
                    value={taskName} onChange={e => setTaskName(e.target.value)}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Platform *
                  </label>
                  <select
                    value={platform}
                    onChange={e => { setPlatform(e.target.value); if (e.target.value !== 'Other') setNewPlatform(''); }}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="Other">Other</option>
                  </select>
                  {platform === 'Other' && (
                    <div className="mt-3">
                      <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">New Platform Name *</label>
                      <input
                        type="text" required placeholder="Enter new platform name"
                        value={newPlatform} onChange={e => setNewPlatform(e.target.value)}
                        className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                          isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">Category *</label>
                  <input
                    type="text" required placeholder="e.g. Arrays, SQL, Algorithms"
                    value={category} onChange={e => setCategory(e.target.value)}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">Description</label>
                  <textarea
                    placeholder="Optional task description..."
                    value={description} onChange={e => setDescription(e.target.value)}
                    rows={2}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                {/* ── Assignment Mode ── */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-2">
                    Assign To *
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { value: 'all',    label: 'All Users',   icon: <Users className="h-3.5 w-3.5" /> },
                      { value: 'select', label: 'Select',      icon: <UserPlus className="h-3.5 w-3.5" /> },
                      { value: 'none',   label: 'None Yet',    icon: <X className="h-3.5 w-3.5" /> },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setAssignMode(opt.value); setSelectedTrainees([]); }}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all ${
                          assignMode === opt.value
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                            : isDark
                              ? 'border-gray-800 text-gray-500 hover:border-gray-700'
                              : 'border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Trainee selector shown only in 'select' mode */}
                  {assignMode === 'select' && (
                    <div className="mt-3">
                      {trainees.length === 0 ? (
                        <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          No active trainees found.
                        </p>
                      ) : (
                        <TraineeSelector
                          trainees={trainees}
                          selected={selectedTrainees}
                          onChange={setSelectedTrainees}
                          isDark={isDark}
                        />
                      )}
                    </div>
                  )}

                  {assignMode === 'none' && (
                    <p className={`mt-2 text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      Task will be created with no assignments. Assign trainees later from the task list.
                    </p>
                  )}
                </div>

                <button
                  type="submit" disabled={formLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {formLoading ? 'Creating...' : 'Create Task'}
                </button>
              </form>
            </div>
          )}

          {/* ── Task List ── */}
          <div className={`space-y-6 ${isAdmin ? 'lg:col-span-2' : ''}`}>
            <div className={`p-5 rounded-2xl border shadow-xl ${
              isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  All Tasks
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {tasks.length}
                  </span>
                </h3>
              </div>

              {tasks.length === 0 ? (
                <div className={`p-10 text-center border border-dashed rounded-2xl ${
                  isDark ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-400'
                }`}>
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No tasks yet.</p>
                  {isAdmin && <p className="text-xs mt-1 opacity-70">Use the form to create the first task.</p>}
                </div>
              ) : (
                <div className="space-y-6">
                  {uniquePlatforms.map(plat => {
                    const platTasks = grouped[plat] || [];
                    if (platTasks.length === 0) return null;
                    return (
                      <div key={plat}>
                        {/* Platform header */}
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-black uppercase tracking-wider ${getPlatformColor(plat)}`}>
                            <PlatformIcon platform={plat} className="h-3.5 w-3.5" />
                            {plat}
                          </span>
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {platTasks.length} task{platTasks.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className={`rounded-xl border overflow-hidden ${
                          isDark ? 'divide-y divide-gray-850 border-gray-850' : 'divide-y divide-gray-100 border-gray-150'
                        }`}>
                          {platTasks.map(task => (
                            <div key={task.id} className="flex flex-col">
                              <div className={`flex items-start justify-between gap-4 p-4 group transition-colors ${
                                isDark ? 'hover:bg-gray-850/30' : 'hover:bg-gray-50/80'
                              }`}>
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                    isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                                  }`}>
                                    <PlatformIcon platform={plat} className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold leading-snug">{task.task_name}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                                        isDark ? 'text-gray-550' : 'text-gray-450'
                                      }`}>
                                        {task.category}
                                      </span>
                                      {task.description && (
                                        <span className={`text-[10px] font-medium italic ${
                                          isDark ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                          {task.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Delete button — admin only */}
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteTask(task.id, task.task_name)}
                                    disabled={deletingId === task.id}
                                    title="Delete task"
                                    className={`shrink-0 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                                      isDark
                                        ? 'opacity-0 group-hover:opacity-100 bg-gray-950 border-gray-800 hover:border-red-500/40 text-gray-500 hover:text-red-400'
                                        : 'opacity-0 group-hover:opacity-100 bg-white border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500'
                                    } disabled:opacity-40`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              {/* Manage Assignments — admin only */}
                              {isAdmin && (
                                <ManageAssignmentsPanel
                                  task={task}
                                  trainees={trainees}
                                  isDark={isDark}
                                  onToast={triggerToast}
                                  onRefresh={fetchTasks}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Tasks;
