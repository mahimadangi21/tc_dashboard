import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Save, ShieldAlert, Award, Calendar, Mail, Trophy, Code, Cpu, Globe, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const TraineeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, trainee_id: loggedInTraineeId, theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Inline editing state per task
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingTaskId, setSavingTaskId] = useState(null);

  // Security gate: Trainee can only view their own detail page
  const isAuthorized = role === 'admin' || String(loggedInTraineeId) === String(id);
  const canEdit = role === 'admin' || String(loggedInTraineeId) === String(id);

  const fetchDetails = async () => {
    if (!isAuthorized) {
      setError("Access Denied. You are not authorized to view other trainees' progress logs.");
      setLoading(false);
      return;
    }
    setError('');
    try {
      const res = await api.get(`/trainees/${id}`);
      setTrainee(res.data);
    } catch (err) {
      console.error('Failed to load trainee profile log details:', err);
      setError('Failed to fetch trainee details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

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
          {role === 'trainee' && (
            <Link
              to={`/trainees/${loggedInTraineeId}`}
              className="inline-block px-4 py-2.5 rounded-xl bg-indigo-650 text-white text-xs font-bold hover:bg-indigo-750 transition-all"
            >
              Go to My Profile
            </Link>
          )}
        </div>
      </Layout>
    );
  }

  if (!trainee) {
    return (
      <Layout title="Trainee Profile">
        <div className="max-w-md mx-auto mt-20 text-center space-y-3 text-gray-500">
          <h4 className="text-lg font-bold text-white">Trainee Not Found</h4>
          <p className="text-xs">No profile could be resolved for this ID.</p>
        </div>
      </Layout>
    );
  }

  // Calculate platform aggregates from tasks array
  const platformAggs = {
    Codechef: { completed: 0, total: 0 },
    HackerRank: { completed: 0, total: 0 },
    Akamai: { completed: 0, total: 0 }
  };

  trainee.trainee_tasks?.forEach((st) => {
    const platform = st.task?.platform || 'Akamai';
    if (platformAggs[platform] !== undefined) {
      platformAggs[platform].total += 1;
      if (st.status === 'Completed') {
        platformAggs[platform].completed += 1;
      }
    }
  });

  const totalCompleted = trainee.trainee_tasks?.filter(st => st.status === 'Completed').length || 0;
  const totalTasks = trainee.trainee_tasks?.length || 0;
  const progress = trainee.overall_progress ?? 0;

  // Group tasks by platform
  const groupedTasks = {
    Codechef: [],
    HackerRank: [],
    Akamai: []
  };

  trainee.trainee_tasks?.forEach((st) => {
    const platform = st.task?.platform || 'Akamai';
    if (groupedTasks[platform]) {
      groupedTasks[platform].push(st);
    } else {
      groupedTasks['Akamai'].push(st);
    }
  });

  const getInitials = (name) => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleStartEdit = (st) => {
    setEditingTaskId(st.task_id);
    setEditStatus(st.status);
    setEditNotes(st.notes || '');
  };

  const handleSaveEdit = async (taskId) => {
    setSavingTaskId(taskId);
    try {
      await api.put(`/trainees/${id}/tasks/${taskId}`, {
        status: editStatus,
        notes: editNotes || undefined
      });
      setEditingTaskId(null);
      await fetchDetails();
    } catch (err) {
      console.error('Failed to update task status inline:', err);
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

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this specific task assignment for this trainee?')) return;
    try {
      await api.delete(`/trainees/${id}/tasks/${taskId}`);
      await fetchDetails();
    } catch (err) {
      console.error('Failed to delete task assignment:', err);
      alert('Error deleting task assignment.');
    }
  };

  return (
    <Layout title={`${trainee.trainee_name}'s Profile`}>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Header Block — Back Navigation + Avatar + Name + Progress Donut */}
        <div className={`p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border transition-all ${
          isDark 
            ? 'bg-gray-900 border-gray-800 text-white shadow-2xl' 
            : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}>
          <div className="flex items-start gap-4 min-w-0">
            {role === 'admin' && (
              <button
                onClick={() => navigate('/trainees')}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isDark ? 'bg-gray-950 border-gray-850 text-gray-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-indigo-600'
                }`}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              {/* Large Initials Avatar */}
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black border shrink-0 ${
                isDark ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
              }`}>
                {getInitials(trainee.trainee_name)}
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="text-xl font-extrabold truncate leading-snug">
                  {trainee.trainee_name}
                </h3>
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-gray-450 font-semibold">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> {trainee.email}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> Joined {formatDate(trainee.joining_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Donut inside Header */}
          <div className={`flex items-center gap-4 shrink-0 px-5 py-3 rounded-2xl border ${
            isDark ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-right">
              <span className="text-[10px] font-black text-gray-550 uppercase tracking-widest block">Overall Progress</span>
              <span className="text-lg font-black block mt-0.5">{Math.round(progress)}%</span>
            </div>
            <div className="relative flex items-center justify-center">
              <svg className="w-14 h-14">
                <circle
                  className={isDark ? 'text-gray-800' : 'text-gray-250'}
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="22"
                  cx="28"
                  cy="28"
                />
                <circle
                  className="text-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="4"
                  strokeDasharray={138}
                  strokeDashoffset={138 - (138 * progress) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="22"
                  cx="28"
                  cy="28"
                  transform="rotate(-90 28 28)"
                />
              </svg>
              <span className="absolute text-[10px] font-extrabold">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>

        {/* Dynamic Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Task list (all 13 tasks) — 2 Columns wide */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`border rounded-2xl overflow-hidden shadow-2xl transition-all ${
              isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
            }`}>
              <div className={`p-5 border-b ${isDark ? 'border-gray-850 bg-gray-950/40' : 'border-gray-150 bg-gray-50'}`}>
                <h4 className="text-base font-extrabold tracking-tight">Milestone Roadmap Logs</h4>
              </div>

              <div className={`divide-y ${isDark ? 'divide-gray-850/60' : 'divide-gray-150'}`}>
                {['Codechef', 'HackerRank', 'Akamai'].map(platform => {
                  const tasksInPlatform = groupedTasks[platform] || [];
                  if (tasksInPlatform.length === 0) return null;

                  return (
                    <div key={platform} className="space-y-0">
                      {/* Platform Spacer Subheader */}
                      <div className={`px-5 py-3 border-y text-xs font-black uppercase tracking-widest ${
                        isDark ? 'bg-indigo-950/15 border-gray-850/80 text-indigo-400' : 'bg-indigo-50/50 border-gray-150 text-indigo-600'
                      }`}>
                        ── {platform} Tasks ──
                      </div>

                      {tasksInPlatform.map((st) => {
                        const isEditingThis = editingTaskId === st.task_id;
                        const isAkamai = platform === 'Akamai';
                        const PlatformIcon = isAkamai ? Globe : Cpu;

                        return (
                          <div key={st.task_id} className={`p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                            isDark ? 'hover:bg-gray-850/20' : 'hover:bg-gray-50/80'
                          }`}>
                            {/* Icon + Task Name */}
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-650'
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
                                    <span className={`text-[10px] font-medium block italic ${isDark ? 'text-indigo-400/80' : 'text-indigo-650/80'}`}>
                                      Notes: {st.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Editor or Status elements */}
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
                                      className="p-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white transition-colors cursor-pointer"
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
                                    {role === 'admin' && (
                                      <button
                                        onClick={() => handleDeleteTask(st.task_id)}
                                        className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-750 text-white transition-colors cursor-pointer"
                                        title="Delete Task Assignment"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
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
                                  {canEdit && (
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
                                  )}
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

          {/* Progress summary section — 1 Column wide */}
          <div className="space-y-6">

            {/* Curriculum Breakdown */}
            <div className={`p-6 rounded-2xl border space-y-6 shadow-2xl ${
              isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
            }`}>
              <h4 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-500 shrink-0" />
                Curriculum Breakdown
              </h4>

              <div className="space-y-5">
                {/* Codechef */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-450">
                    <span>Codechef Challenges</span>
                    <span className={isDark ? 'text-white' : 'text-gray-905'}>{platformAggs.Codechef.completed}/3 completed</span>
                  </div>
                  <ProgressBar
                    progress={(platformAggs.Codechef.completed / 3) * 100}
                    label=""
                    color="bg-blue-500"
                  />
                </div>

                {/* HackerRank */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-450">
                    <span>HackerRank Challenges</span>
                    <span className={isDark ? 'text-white' : 'text-gray-905'}>{platformAggs.HackerRank.completed}/9 completed</span>
                  </div>
                  <ProgressBar
                    progress={(platformAggs.HackerRank.completed / 9) * 100}
                    label=""
                    color="bg-green-500"
                  />
                </div>

                {/* Akamai */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-450">
                    <span>Akamai Challenges</span>
                    <span className={isDark ? 'text-white' : 'text-gray-905'}>{platformAggs.Akamai.completed}/1 completed</span>
                  </div>
                  <ProgressBar
                    progress={(platformAggs.Akamai.completed / 1) * 100}
                    label=""
                    color="bg-purple-500"
                  />
                </div>

                <div className="border-t border-gray-150 dark:border-gray-850 pt-5">
                  {/* Overall */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm font-extrabold">
                      <span>Overall Milestones</span>
                      <span>{totalCompleted}/{totalTasks} completed</span>
                    </div>
                    <ProgressBar
                      progress={progress}
                      label=""
                      color="bg-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TraineeDetail;
