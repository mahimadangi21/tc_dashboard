import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/Layout';
import ProgressBar from '../components/ProgressBar';
import { ShieldAlert, Award, Calendar, Mail, Trophy } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const MyProgress = () => {
  const navigate = useNavigate();
  const { role, trainee_id: loggedInTraineeId, theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.error('Failed to load trainee profile:', err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(`Failed to fetch progress details. ${detail || `(HTTP ${status || 'network error'})`}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [role, loggedInTraineeId]);

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
      <Layout title="My Progress">
        <div className="max-w-md mx-auto mt-20 text-center space-y-3 text-gray-500">
          <h4 className="text-lg font-bold text-white">Not Found</h4>
          <p className="text-xs">No profile could be resolved.</p>
        </div>
      </Layout>
    );
  }

  const platformAggs = {};

  trainee.trainee_tasks?.forEach((st) => {
    const rawPlatform = st.task?.platform || 'Akamai';
    let displayName = rawPlatform;
    const lower = rawPlatform.toLowerCase();
    if (lower === 'codechef') displayName = 'Codechef';
    else if (lower === 'hackerrank') displayName = 'HackerRank';
    else if (lower === 'akamai') displayName = 'Akamai';
    else displayName = rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1);

    if (!platformAggs[displayName]) {
      platformAggs[displayName] = { completed: 0, total: 0 };
    }
    platformAggs[displayName].total += 1;
    if (st.status === 'Completed') {
      platformAggs[displayName].completed += 1;
    }
  });

  const totalCompleted = trainee.trainee_tasks?.filter(st => st.status === 'Completed').length || 0;
  const totalTasks = trainee.trainee_tasks?.length || 0;
  const progress = trainee.overall_progress ?? 0;

  const getInitials = (name) => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Layout title="My Progress">
      <div className="space-y-8 max-w-4xl mx-auto pb-16">
        <div className={`p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border transition-all ${
          isDark 
            ? 'bg-gray-900 border-gray-800 text-white shadow-2xl' 
            : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}>
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
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

        <div className={`p-6 rounded-2xl border space-y-6 shadow-2xl ${
          isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}>
          <h4 className="text-base font-extrabold tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-500 shrink-0" />
            Curriculum Breakdown
          </h4>

          <div className="space-y-5">
            {Object.entries(platformAggs).map(([platformName, agg], idx) => {
              const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-teal-500"];
              const color = colors[idx % colors.length];
              const pct = agg.total > 0 ? (agg.completed / agg.total) * 100 : 0;
              return (
                <div key={platformName} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-450">
                    <span>{platformName} Challenges</span>
                    <span className={isDark ? 'text-white' : 'text-gray-905'}>
                      {agg.completed}/{agg.total} completed
                    </span>
                  </div>
                  <ProgressBar
                    progress={pct}
                    label=""
                    color={color}
                  />
                </div>
              );
            })}

            <div className="border-t border-gray-150 dark:border-gray-850 pt-5">
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
    </Layout>
  );
};

export default MyProgress;
