import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { CheckSquare, Trash2, PlusCircle, CheckCircle, AlertCircle, BookOpen, Code, Globe, Cpu } from 'lucide-react';

const PLATFORM_OPTIONS = ['Codechef', 'HackerRank', 'Akamai', 'Internal'];

const PLATFORM_COLORS = {
  Codechef: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HackerRank: 'bg-green-500/10 text-green-400 border-green-500/20',
  Akamai: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Internal: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const PlatformIcon = ({ platform, className }) => {
  switch (platform) {
    case 'Codechef': return <Code className={className} />;
    case 'HackerRank': return <CheckSquare className={className} />;
    case 'Akamai': return <Globe className={className} />;
    default: return <Cpu className={className} />;
  }
};

export const Tasks = () => {
  const { role, theme } = useContext(AuthContext);
  const isDark = theme === 'dark';
  const isAdmin = role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // New task form state
  const [taskName, setTaskName] = useState('');
  const [platform, setPlatform] = useState('HackerRank');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Toast state
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim() || !category.trim()) return;
    setFormLoading(true);
    try {
      await api.post('/tasks/', {
        task_name: taskName.trim(),
        platform,
        category: category.trim(),
        description: description.trim() || null,
      });
      triggerToast('Task created and assigned to all trainees!');
      setTaskName('');
      setCategory('');
      setDescription('');
      setPlatform('HackerRank');
      fetchTasks();
    } catch (err) {
      const detail = err.response?.data?.detail;
      triggerToast(detail || 'Failed to create task.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTask = async (id, name) => {
    if (!confirm(`Delete task "${name}"?\n\nThis will remove it from all trainee assignments.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/tasks/${id}`);
      triggerToast(`Task "${name}" deleted successfully.`);
      fetchTasks();
    } catch (err) {
      const detail = err.response?.data?.detail;
      triggerToast(detail || 'Failed to delete task.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Group tasks by platform
  const grouped = PLATFORM_OPTIONS.reduce((acc, p) => {
    acc[p] = tasks.filter((t) => t.platform === p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
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
              : <CheckCircle className="h-5 w-5 shrink-0" />
            }
            <p className="font-semibold">{toast.message}</p>
          </div>
        )}

        <div className={`grid gap-8 ${isAdmin ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>

          {/* Create Task Form — Admin only */}
          {isAdmin && (
            <div className={`p-6 rounded-2xl border space-y-5 shadow-xl ${
              isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
            }`}>
              <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-indigo-500" />
                Create New Task
              </h3>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-450'}`}>
                New tasks are automatically assigned to all existing trainees.
              </p>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Two Sum Problem"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Platform *
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    {PLATFORM_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arrays, SQL, Algorithms"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Optional task description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {formLoading ? 'Creating...' : 'Create & Assign Task'}
                </button>
              </form>
            </div>
          )}

          {/* Task List */}
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
                  {PLATFORM_OPTIONS.map((plat) => {
                    const platTasks = grouped[plat];
                    if (platTasks.length === 0) return null;
                    return (
                      <div key={plat}>
                        {/* Platform header */}
                        <div className={`flex items-center gap-2 mb-3 px-1`}>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-black uppercase tracking-wider ${PLATFORM_COLORS[plat]}`}>
                            <PlatformIcon platform={plat} className="h-3.5 w-3.5" />
                            {plat}
                          </span>
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            {platTasks.length} task{platTasks.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className={`divide-y rounded-xl border overflow-hidden ${
                          isDark ? 'divide-gray-850 border-gray-850' : 'divide-gray-100 border-gray-150'
                        }`}>
                          {platTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`flex items-start justify-between gap-4 p-4 group transition-colors ${
                                isDark ? 'hover:bg-gray-850/30' : 'hover:bg-gray-50/80'
                              }`}
                            >
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

                              {/* Admin delete button */}
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
