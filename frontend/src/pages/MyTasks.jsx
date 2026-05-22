import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { ShieldAlert, Save, Trash2, Cpu, Globe } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const MyTasks = () => {
  const navigate = useNavigate();
  const { role, trainee_id: loggedInTraineeId, theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingTaskId, setSavingTaskId] = useState(null);

  const fetchDetails = async () => {
    if (!role) return;

    if (role !== 'trainee' && role !== 'student') {
      setError("Access Denied.");
      setLoading(false);
      return;
    }

    setError('');
    try {
      const res = await api.get(`/trainees/${loggedInTraineeId}`);
      setTrainee(res.data);
    } catch (err) {
      console.error('Failed to load trainee tasks:', err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(`Failed to fetch tasks. ${detail || `(HTTP ${status || 'network error'})`}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [role, loggedInTraineeId]);

  const handleStartEdit = (st) => {
    setEditingTaskId(st.task_id);
    setEditStatus(st.status);
    setEditNotes(st.notes || '');
  };

  const handleSaveEdit = async (taskId) => {
    setSavingTaskId(taskId);
    try {
      await api.put(`/trainees/${loggedInTraineeId}/tasks/${taskId}`, {
        status: editStatus,
        notes: editNotes || undefined
      });
      setEditingTaskId(null);
      await fetchDetails();
    } catch (err) {
      console.error('Failed to update task status:', err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403) {
        alert('Error updating status. Please verify permissions.');
      } else if (detail) {
        alert(`Error updating status: ${detail}`);
      } else {
        alert('Error updating status. Please try again.');
      }
    } finally {
      setSavingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Layout title="Access Restricted">
        <div className="max-w-md mx-auto mt-20 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 mx-auto" />
          <h4 className="text-lg font-black text-white">Security Block</h4>
          <p className="text-xs text-gray-400 font-medium">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!trainee) {
    return (
      <Layout title="My Tasks">
        <div className="max-w-md mx-auto mt-20 text-center space-y-3 text-gray-500">
          <h4 className="text-lg font-bold text-white">Not Found</h4>
          <p className="text-xs">No profile could be resolved.</p>
        </div>
      </Layout>
    );
  }

  const groupedTasks = {};

  trainee.trainee_tasks?.forEach((st) => {
    const rawPlatform = st.task?.platform || 'Akamai';
    let displayName = rawPlatform;
    const lower = rawPlatform.toLowerCase();
    if (lower === 'codechef') displayName = 'Codechef';
    else if (lower === 'hackerrank') displayName = 'HackerRank';
    else if (lower === 'akamai') displayName = 'Akamai';
    else displayName = rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1);

    if (!groupedTasks[displayName]) {
      groupedTasks[displayName] = [];
    }
    groupedTasks[displayName].push(st);
  });

  return (
    <Layout title="My Tasks">
      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        <div className={`border rounded-2xl overflow-hidden shadow-2xl transition-all ${
          isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
        }`}>
          <div className={`p-5 border-b ${isDark ? 'border-gray-850 bg-gray-950/40' : 'border-gray-150 bg-gray-50'}`}>
            <h4 className="text-base font-extrabold tracking-tight">Milestone Roadmap Logs</h4>
          </div>

          <div className={`divide-y ${isDark ? 'divide-gray-850/60' : 'divide-gray-150'}`}>
            {Object.keys(groupedTasks).map(platform => {
              const tasksInPlatform = groupedTasks[platform] || [];
              if (tasksInPlatform.length === 0) return null;

              return (
                <div key={platform} className="space-y-0">
                  <div className={`px-5 py-3 border-y text-xs font-black uppercase tracking-widest ${
                    isDark ? 'bg-indigo-950/15 border-gray-850/80 text-indigo-400' : 'bg-indigo-50/50 border-gray-150 text-indigo-600'
                  }`}>
                    ── {platform} Tasks ──
                  </div>

                  {tasksInPlatform.map((st) => {
                    const isEditingThis = editingTaskId === st.task_id;
                    const isAkamai = platform.toLowerCase() === 'akamai';
                    const PlatformIcon = isAkamai ? Globe : Cpu;

                    return (
                      <div key={st.task_id} className={`p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isDark ? 'hover:bg-gray-850/20' : 'hover:bg-gray-50/80'
                      }`}>
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            <PlatformIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-snug">{st.task?.task_name}</p>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className={`text-[9px] font-semibold uppercase tracking-wider block ${isDark ? 'text-gray-550' : 'text-gray-450'}`}>
                                {st.task?.category}
                              </span>
                              {st.notes && (
                                <span className={`text-[10px] font-medium block italic ${isDark ? 'text-indigo-400/80' : 'text-indigo-600/80'}`}>
                                  Notes: {st.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {isEditingThis ? (
                            <div className="flex flex-col gap-2 items-end">
                              <div className="flex items-center gap-2">
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-bold ${
                                    isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                                  }`}
                                >
                                  <option value="Not Started">Not Started</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Does Not Apply">Does Not Apply</option>
                                </select>
                                <button
                                  onClick={() => handleSaveEdit(st.task_id)}
                                  disabled={savingTaskId === st.task_id}
                                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingTaskId(null)}
                                  className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                    isDark ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800' : 'border-gray-200 text-gray-550 hover:bg-gray-100'
                                  }`}
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="Add/edit notes..."
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  className={`w-56 border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 ${
                                    isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm'
                                  }`}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <StatusBadge status={st.status} />
                              {st.completion_date && (
                                <span className="text-[10px] text-gray-500 font-medium shrink-0">
                                  {formatDate(st.completion_date)}
                                </span>
                              )}
                              <button
                                onClick={() => handleStartEdit(st)}
                                className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                                  isDark 
                                    ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800' 
                                    : 'border-gray-200 text-gray-550 hover:text-indigo-600 hover:bg-indigo-50/30'
                                }`}
                              >
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyTasks;
