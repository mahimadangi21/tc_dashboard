import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import SummaryCard from '../components/SummaryCard';
import ProgressBar from '../components/ProgressBar';
import AuthContext from '../context/AuthContext';
import { Users, ListChecks, TrendingUp, Clock, RefreshCw, BarChart3, Trophy, Flame } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <div role="alert" className="p-6 bg-red-500/10 border border-red-500 rounded-xl text-red-500">
      <p className="font-bold">Dashboard rendering crashed:</p>
      <pre className="text-xs mt-2 overflow-auto">{error.message}</pre>
    </div>
  );
}

export const Dashboard = () => {
  const { theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  const [summary, setSummary] = useState(null);
  const [traineeWise, setTraineeWise] = useState([]);
  const [taskWise, setTaskWise] = useState([]);
  const [platformWise, setPlatformWise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');



  const fetchAllDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, traineeRes, taskRes, platformRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/student-wise'), // returns trainee dataset
        api.get('/analytics/task-wise'),
        api.get('/analytics/platform-wise'),
      ]);
      setSummary(summaryRes.data);
      const traineeData = Array.isArray(traineeRes.data) ? traineeRes.data : [];
      setTraineeWise(traineeData.map(t => ({
        ...t,
        trainee_name: t.student_name || t.trainee_name // ensure name is unified
      })));
      setTaskWise(Array.isArray(taskRes.data) ? taskRes.data : []);
      setPlatformWise(Array.isArray(platformRes.data) ? platformRes.data : []);
    } catch (err) {
      console.error('Failed to load administrative dashboard overview:', err);
      setError('Error loading administrative metrics. Please check connection and permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, []);



  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const shortenTaskName = (name) => {
    if (!name) return '';
    return name
      .replace(/Hackerrank/gi, 'HK')
      .replace(/Codechef/gi, 'CC')
      .replace(/Akamai/gi, 'AK')
      .replace(/Interview/gi, 'Int')
      .substring(0, 15);
  };

  return (
    <Layout title="Administrative Dashboard">
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Flame className="text-indigo-500 h-6 w-6" />
              Operational Intelligence
            </h3>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Curriculum analytics overview, platform completions, and trainee performance rankings.
            </p>
          </div>
          
          <div className="flex items-center gap-3">

            <button
              onClick={fetchAllDashboardData}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-md ${
                isDark 
                  ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Section 1 — Summary Cards (4 columns) */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Trainees"
            value={summary?.total_students || 0}
            icon={Users}
            description="Active trainees enrolled"
            trendColor="text-blue-500"
          />
          <SummaryCard
            title="Total Tasks"
            value={summary?.total_tasks || 0}
            icon={ListChecks}
            description="Challenges in roadmap"
            trendColor="text-purple-500"
          />
          <SummaryCard
            title="Overall Completion Rate"
            value={`${summary?.overall_completion_rate?.toFixed(1) || 0}%`}
            icon={TrendingUp}
            description="Average curriculum health"
            trendColor="text-green-500"
          />
          <SummaryCard
            title="In Progress"
            value={summary?.total_in_progress || 0}
            icon={Clock}
            description="Assignments currently active"
            trendColor="text-amber-500"
          />
        </div>

        {/* Section 2 — Two charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Chart — Trainee-wise Progress */}
          <div className={`border p-6 rounded-2xl flex flex-col justify-between shadow-2xl transition-all ${
            isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
          }`}>
            <div>
              <h4 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Trainee-wise Progress
              </h4>
              <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Completed, active, and unstarted challenges breakdown per trainee.
              </p>
            </div>

            <div className="h-[340px] w-full mt-6">
              {traineeWise.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-semibold">
                  No trainee records available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={traineeWise}
                    layout="vertical"
                    margin={{ left: 20, right: 10, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222530' : '#e5e7eb'} horizontal={false} />
                    <XAxis type="number" stroke="#888888" fontSize={10} tickLine={false} domain={[0, 13]} />
                    <YAxis dataKey="trainee_name" type="category" stroke="#888888" fontSize={10} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ 
                      backgroundColor: isDark ? '#11131c' : '#ffffff', 
                      border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#000000'
                    }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#0ea5e9" />
                    <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#8b5cf6" />
                    <Bar dataKey="not_started" name="Not Started" stackId="a" fill="#64748b" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right Chart — Task Completion Rates */}
          <div className={`border p-6 rounded-2xl flex flex-col justify-between shadow-2xl transition-all ${
            isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
          }`}>
            <div>
              <h4 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Task Completion Rates
              </h4>
              <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Average completion rate for each challenge milestone colored by host platform.
              </p>
            </div>

            <div className="h-[340px] w-full mt-6">
              {taskWise.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm font-semibold">
                  No task milestone records available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskWise} margin={{ top: 20, right: 10, left: -20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222530' : '#e5e7eb'} vertical={false} />
                    <XAxis
                      dataKey="task_name"
                      tickFormatter={shortenTaskName}
                      stroke="#888888"
                      fontSize={8}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ 
                      backgroundColor: isDark ? '#11131c' : '#ffffff', 
                      border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#000000'
                    }} />
                    <Bar dataKey="completion_rate" name="Completion Rate">
                      {taskWise.map((entry, index) => {
                        let color = '#d946ef'; // Fuchsia
                        const platformLower = (entry.platform || '').toLowerCase();
                        if (platformLower.includes('codechef')) color = '#6366f1';
                        else if (platformLower.includes('hackerrank')) color = '#14b8a6';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                      <LabelList
                        dataKey="completion_rate"
                        position="top"
                        formatter={(val) => `${Math.round(val)}%`}
                        fill="#888888"
                        fontSize={9}
                        fontWeight="bold"
                        offset={6}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Custom Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-wider text-gray-500 shrink-0 mt-2">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#6366f1]"></span>Codechef</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#14b8a6]"></span>HackerRank</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#d946ef]"></span>Akamai</span>
            </div>
          </div>
        </div>

        {/* Section 3 — Platform Summary Cards (3 columns) */}
        <div className="space-y-4">
          <h4 className="text-lg font-black tracking-tight">Platform Aggregations</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platformWise.map((platform, idx) => {
              let platformColor = 'bg-fuchsia-500';
              const nameLower = (platform.platform || '').toLowerCase();
              if (nameLower.includes('codechef')) platformColor = 'bg-indigo-500';
              else if (nameLower.includes('hackerrank')) platformColor = 'bg-teal-500';
              else if (nameLower.includes('akamai')) platformColor = 'bg-fuchsia-500';

              return (
                <div key={idx} className={`p-6 rounded-2xl border space-y-4 shadow-xl transition-all ${
                  isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center">
                    <h5 className="font-extrabold text-base">{platform.platform}</h5>
                    <span className="text-xs text-gray-400 font-semibold">{platform.total_tasks} Challenges</span>
                  </div>
                  <div className="pt-2">
                    <ProgressBar
                      progress={platform.avg_completion_rate}
                      label="Avg Completion Rate"
                      color={platformColor}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4 — Leaderboard */}
        <div className={`border rounded-2xl overflow-hidden shadow-2xl transition-all ${
          isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-sm'
        }`}>
          <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
            <h4 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-500" />
              Trainee Learning Leaderboard
            </h4>
            <span className="text-xs text-gray-450 font-bold uppercase tracking-wider">Ranked by Completion</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs font-bold text-gray-500 uppercase tracking-wider ${isDark ? 'border-gray-800 bg-gray-900/20' : 'border-gray-200 bg-gray-50'}`}>
                  <th className="p-4 text-center w-16">Rank</th>
                  <th className="p-4">Developer Name</th>
                  <th className="p-4 text-center">Completed</th>
                  <th className="p-4 text-center">In Progress</th>
                  <th className="p-4 text-center">Not Started</th>
                  <th className="p-4 min-w-[200px]">Overall Progress</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-800/50' : 'divide-gray-150'}`}>
                {traineeWise
                  .slice().sort((a, b) => b.overall_progress - a.overall_progress)
                  .map((student, idx) => (
                    <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-gray-800/10' : 'hover:bg-gray-50'}`}>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                          idx === 0 
                            ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' 
                            : idx === 1 
                            ? 'bg-gray-305 text-gray-500 border border-gray-400/30' 
                            : idx === 2 
                            ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30' 
                            : 'bg-gray-800/40 text-gray-450'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold">
                        {student.trainee_name}
                      </td>
                      <td className="p-4 text-center text-sm font-bold text-sky-500">
                        {student.completed}
                      </td>
                      <td className="p-4 text-center text-sm font-bold text-violet-500">
                        {student.in_progress}
                      </td>
                      <td className="p-4 text-center text-sm font-bold text-slate-500">
                        {student.not_started}
                      </td>
                      <td className="p-4">
                        <ProgressBar
                          progress={student.overall_progress}
                          label=""
                          color="bg-indigo-600"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        </ErrorBoundary>
      </div>


    </Layout>
  );
};

export default Dashboard;
