import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import AuthContext from '../context/AuthContext';
import { FileSpreadsheet, Download, RefreshCw, X, Save, AlertCircle, Plus } from 'lucide-react';

export const GridView = () => {
  const { theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  const [gridData, setGridData] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Filtering state
  const [activePlatform, setActivePlatform] = useState('All');

  // Modal / Popover state
  const [selectedCell, setSelectedCell] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Add Task Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [platform, setPlatform] = useState('Codechef');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  // Mappings
  const [traineeNameToId, setTraineeNameToId] = useState({});
  const [taskNameToId, setTaskNameToId] = useState({});
  const [taskNameToPlatform, setTaskNameToPlatform] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [gridRes, traineesRes, tasksRes] = await Promise.all([
        api.get('/analytics/grid'),
        api.get('/trainees/'),
        api.get('/tasks/')
      ]);

      setGridData(gridRes.data);
      setTrainees(traineesRes.data);
      setTasks(tasksRes.data);

      const sMap = {};
      traineesRes.data.forEach(s => {
        sMap[s.trainee_name] = s.id;
      });
      setTraineeNameToId(sMap);

      const tMap = {};
      const pMap = {};
      tasksRes.data.forEach(t => {
        tMap[t.task_name] = t.id;
        pMap[t.task_name] = t.platform;
      });
      setTaskNameToId(tMap);
      setTaskNameToPlatform(pMap);

      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to load grid matrix data:', err);
      setError('Failed to fetch operational grid logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim() || !category.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    setCreatingTask(true);
    try {
      await api.post('/tasks', {
        task_name: taskName,
        platform,
        category,
        description: description || undefined
      });
      setTaskName('');
      setPlatform('Codechef');
      setCategory('');
      setDescription('');
      setTaskModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to create new task:', err);
      alert('Error creating task. Please make sure the task name is unique.');
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const filteredTasks = gridData?.tasks.filter(tName => {
    const tPlatform = taskNameToPlatform[tName] || 'Other';
    return activePlatform === 'All' || tPlatform === activePlatform;
  }) || [];

  const groupTasksByPlatform = () => {
    const groups = {
      Codechef: [],
      HackerRank: [],
      Akamai: []
    };

    filteredTasks.forEach(tName => {
      const tPlatform = taskNameToPlatform[tName] || 'Akamai';
      if (groups[tPlatform]) {
        groups[tPlatform].push(tName);
      } else {
        groups['Akamai'].push(tName);
      }
    });

    return groups;
  };

  const taskGroups = groupTasksByPlatform();

  const handleExportCSV = () => {
    if (!gridData) return;

    const headers = ['Task Name', 'Platform', ...gridData.students.map(s => s.student_name)];

    const rows = filteredTasks.map(tName => {
      const tPlatform = taskNameToPlatform[tName] || '';
      const taskIdx = gridData.tasks.indexOf(tName);
      const statuses = gridData.students.map(s => s.statuses[taskIdx] || '—');
      return [tName, tPlatform, ...statuses];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tc_trainee_tracker_grid_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCellClick = (student, tName, currentStatus) => {
    const traineeId = traineeNameToId[student.student_name];
    const taskId = taskNameToId[tName];

    setSelectedCell({
      traineeName: student.student_name,
      traineeId,
      taskName: tName,
      taskId,
      status: currentStatus
    });
    setNewStatus(currentStatus || 'Not Started');
    setNewNotes('');
    setModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedCell) return;
    setSaving(true);
    try {
      await api.put(`/trainees/${selectedCell.traineeId}/tasks/${selectedCell.taskId}`, {
        status: newStatus,
        notes: newNotes || undefined
      });
      setModalOpen(false);
      setSelectedCell(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to save status update:', err.response?.data || err);
      alert(`Error updating status: ${err.response?.data?.detail || err.message || 'Please verify permissions.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task? This will also remove it from all trainees.')) return;
    setDeletingTaskId(taskId);
    try {
      await api.delete(`/tasks/${taskId}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete task:', err);
      const detail = err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Error deleting task: ${detail}`);
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <>
      <Layout title="Spreadsheet Tracking Grid">
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-500 h-6 w-6" />
              Spreadsheet Tracking Grid
            </h3>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sticky matrix detailing challenge milestones across trainees. Click any cell to update status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Task Course
            </button>
            <button
              onClick={handleExportCSV}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={fetchData}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-gray-900 border-gray-800 text-gray-350 hover:bg-gray-800'
                  : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Sync
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Platform Filtering Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${
            isDark ? 'bg-gray-900 border-gray-850' : 'bg-gray-100 border-gray-205'
          }`}>
            {['All', 'Codechef', 'HackerRank', 'Akamai'].map(p => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePlatform === p
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
            Last synced: {lastUpdated || 'Loading'}
          </span>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Codechef', 'HackerRank', 'Akamai'].map(grpPlatform => {
            const tasksInGroup = taskGroups[grpPlatform] || [];
            if (tasksInGroup.length === 0) return null;

            return tasksInGroup.map((tName, tIdx) => {
              const originalTaskIdx = gridData.tasks.indexOf(tName);
              const taskObj = tasks.find(t => t.task_name === tName) || {};

              return (
                <div
                  key={`${grpPlatform}-${tIdx}`}
                  className={`p-6 rounded-2xl border flex flex-col justify-between space-y-5 transition-all duration-300 hover:-translate-y-1 ${
                    isDark
                      ? 'bg-gray-900/60 backdrop-blur border-gray-800 hover:border-gray-700 text-white shadow-2xl'
                      : 'bg-white border-gray-205 hover:border-indigo-300 text-gray-900 shadow-xl'
                  }`}
                >
                  <div>
                    {/* Platform Badge & Delete Button */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        grpPlatform === 'HackerRank'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : grpPlatform === 'Codechef'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {grpPlatform}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(taskObj.id);
                        }}
                        disabled={deletingTaskId === taskObj.id}
                        title="Delete task"
                        className={`p-1 rounded-lg border transition-all cursor-pointer ${
                          isDark
                            ? 'border-gray-800 text-gray-600 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                            : 'border-gray-200 text-gray-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-300'
                        } disabled:opacity-40`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" x2="10" y1="11" y2="17"></line>
                          <line x1="14" x2="14" y1="11" y2="17"></line>
                        </svg>
                      </button>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-sm font-black tracking-tight leading-snug break-words">
                      {tName}
                    </h4>

                    {taskObj.description && (
                      <p className={`text-[10px] font-medium mt-1.5 leading-normal line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {taskObj.description}
                      </p>
                    )}
                  </div>

                  {/* Trainees Progress Rows */}
                  <div className={`pt-4 border-t space-y-2.5 ${isDark ? 'border-gray-800' : 'border-gray-150'}`}>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-2">Trainee Progress</span>
                    {gridData.students.map((student, sIdx) => {
                      const cellStatus = student.statuses[originalTaskIdx] || '—';
                      const initials = student.student_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

                      return (
                        <div
                          key={sIdx}
                          onClick={() => handleCellClick(student, tName, cellStatus)}
                          className={`flex items-center justify-between p-2 rounded-xl border text-[10px] cursor-pointer transition-all ${
                            isDark
                              ? 'bg-gray-950/40 border-gray-850/60 hover:bg-indigo-500/5 hover:border-indigo-500/30 text-gray-300'
                              : 'bg-gray-50 border-gray-150 hover:bg-indigo-50/30 hover:border-indigo-300 text-gray-600'
                          }`}
                          title="Click to view details or add notes"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-md bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-extrabold text-[8px] text-indigo-400 shrink-0">
                              {initials}
                            </div>
                            <span className="font-extrabold truncate">{student.student_name}</span>
                          </div>
                          <div className="shrink-0 scale-90 origin-right">
                            <StatusBadge status={cellStatus} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
      </Layout>

      {/* Status Update Modal */}
      {modalOpen && selectedCell && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-lg flex items-center justify-center p-4 z-[100]">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 relative ${
            isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <button
              onClick={() => setModalOpen(false)}
              className={`absolute top-4 right-4 p-1 rounded-lg cursor-pointer ${
                isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Update Cell Status</h4>
              <h3 className="text-lg font-black mt-1 leading-snug">{selectedCell.traineeName}</h3>
              <p className="text-xs text-indigo-500 font-semibold mt-0.5">{selectedCell.taskName}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">
                  Task Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 font-bold ${
                    isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                  }`}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Does Not Apply">Does Not Apply</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">
                  Trainee Notes (Optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add details, links, or progress notes..."
                  rows={3}
                  className={`w-full border rounded-xl p-3.5 text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                  }`}
                />
              </div>
            </div>

            <div className={`flex items-center justify-end gap-3 mt-6 pt-4 border-t ${isDark ? 'border-gray-850' : 'border-gray-150'}`}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isDark ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800' : 'border-gray-200 text-gray-650 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {saving ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-lg flex items-center justify-center p-4 z-[100]">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 relative ${
            isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <button
              onClick={() => setTaskModalOpen(false)}
              className={`absolute top-4 right-4 p-1 rounded-lg cursor-pointer ${
                isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-800'
              }`}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Curriculum Builder</h4>
              <h3 className="text-lg font-black mt-1 leading-snug">Add Task Course</h3>
              <p className="text-xs text-indigo-500 font-semibold mt-0.5">Create a new coding challenge for all trainees</p>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">
                  Task / Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HK Problem Solving Intermediate"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-500 font-medium ${
                    isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">
                    Coding Platform *
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 font-bold ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                    }`}
                  >
                    <option value="Codechef">Codechef</option>
                    <option value="HackerRank">HackerRank</option>
                    <option value="Akamai">Akamai</option>
                    <option value="Internal">Internal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Basic Coding"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 placeholder-gray-500 font-medium ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter challenge details or reference URLs..."
                  rows={3}
                  className={`w-full border rounded-xl p-3.5 text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
                    isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-gray-850' : 'border-gray-150'}`}>
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800' : 'border-gray-200 text-gray-650 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {creatingTask ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GridView;
