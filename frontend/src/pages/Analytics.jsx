import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { BarChart3, Flame, PieChart as PieIcon, Download, RefreshCw } from 'lucide-react';

export const Analytics = () => {
  const { theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  const [traineeWise, setTraineeWise] = useState([]);
  const [taskWise, setTaskWise] = useState([]);
  const [platformWise, setPlatformWise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError('');
    try {
      const [traineeRes, taskRes, platformRes] = await Promise.all([
        api.get('/analytics/student-wise'), // returns trainee dataset
        api.get('/analytics/task-wise'),
        api.get('/analytics/platform-wise')
      ]);

      setTraineeWise(traineeRes.data.map(t => ({
        ...t,
        trainee_name: t.student_name // ensure name field is normalized
      })));
      setTaskWise(taskRes.data);
      setPlatformWise(platformRes.data);
    } catch (err) {
      console.error('Failed to load administrative analytics charts:', err);
      setError('Failed to fetch analytics statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  const pieData = platformWise.map((p) => {
    let color = '#d946ef'; // Fuchsia 500 (Akamai)
    if (p.platform.toLowerCase().includes('codechef')) color = '#6366f1'; // Indigo 500
    else if (p.platform.toLowerCase().includes('hackerrank')) color = '#14b8a6'; // Teal 500

    return {
      name: p.platform,
      value: p.total_tasks,
      avgCompletion: p.avg_completion_rate,
      color
    };
  });

  const shortenTaskName = (name) => {
    if (!name) return '';
    return name
      .replace(/Hackerrank/gi, 'HK')
      .replace(/Codechef/gi, 'CC')
      .replace(/Akamai/gi, 'AK')
      .replace(/Interview/gi, 'Int')
      .substring(0, 15);
  };

  const handleExportCSV = () => {
    const headers = ['Task Name', 'Platform', 'Completed Count', 'In Progress Count', 'Not Started Count', 'Completion Rate (%)'];
    const rows = taskWise.map(t => [
      t.task_name,
      t.platform,
      t.completed_count,
      t.in_progress_count,
      t.not_started_count,
      `${t.completion_rate.toFixed(1)}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tc_analytics_breakdown_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title="Analytical Intelligence">
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-500" />
              Analytical Reports
            </h3>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-550'}`}>
              Visual drilldown reporting on trainee progress, completion levels, and task distributions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Export Reports
            </button>
            <button
              onClick={fetchAnalyticsData}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                isDark 
                  ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' 
                  : 'bg-white border-gray-200 text-gray-650 hover:bg-gray-50'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Sync
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Section 1 — Trainee Comparison (Recharts BarChart stacked) */}
        <div className={`border p-6 rounded-2xl shadow-2xl space-y-6 transition-all ${
          isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}>
          <div>
            <h4 className="text-lg font-extrabold tracking-tight">Trainee Task Breakdown</h4>
            <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-550'}`}>
              Completion distribution mapping all 13 milestone statuses per trainee.
            </p>
          </div>

          <div className="h-80 w-full">
            {traineeWise.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 font-semibold">
                No trainee comparison records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key={isDark ? 'dark' : 'light'}>
                <BarChart data={traineeWise} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222530' : '#e5e7eb'} vertical={false} />
                  <XAxis dataKey="trainee_name" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} domain={[0, 13]} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: isDark ? '#11131c' : '#ffffff', 
                      border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#0ea5e9" />
                  <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="not_started" name="Not Started" stackId="a" fill="#64748b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Dynamic Section 2 & 3 Row Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section 2 — Task Difficulty Heatmap (Hardest first at top) */}
          <div className={`lg:col-span-2 border p-6 rounded-2xl shadow-2xl flex flex-col justify-between space-y-6 transition-all ${
            isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
          }`}>
            <div>
              <h4 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                Task Difficulty Heatmap
              </h4>
              <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-550'}`}>
                Completed vs uncompleted tasks sorted from hardest (lowest completion rate) to easiest.
              </p>
            </div>

            <div className={`overflow-y-auto max-h-[350px] border rounded-xl ${isDark ? 'border-gray-850' : 'border-gray-150'}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b sticky top-0 z-10 ${
                    isDark ? 'border-gray-850 bg-gray-900' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <th className="p-3 text-[10px] font-black uppercase tracking-widest pl-4">Task Name</th>
                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center">Completed</th>
                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-center">Struggled</th>
                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-right pr-4">Rate</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-850/40' : 'divide-gray-150'}`}>
                  {taskWise
                    .slice().sort((a, b) => a.completion_rate - b.completion_rate)
                    .map((task, idx) => {
                      const compRate = task.completion_rate;
                      const completed = task.completed_count;
                      const struggled = 7 - completed;

                      let rowStyle = isDark ? 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20' : 'bg-slate-50 text-slate-700 hover:bg-slate-100';
                      if (compRate >= 80) rowStyle = isDark ? 'bg-sky-500/5 text-sky-400 hover:bg-sky-500/10' : 'bg-sky-50/50 text-sky-700 hover:bg-sky-100/50';
                      else if (compRate >= 50) rowStyle = isDark ? 'bg-violet-500/5 text-violet-400 hover:bg-violet-500/10' : 'bg-violet-50/50 text-violet-700 hover:bg-violet-100/50';

                      return (
                        <tr key={idx} className={`${rowStyle} transition-colors`}>
                          <td className="p-3 pl-4 text-xs font-bold leading-normal">
                            {task.task_name}
                            <span className="block text-[8px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{task.platform}</span>
                          </td>
                          <td className="p-3 text-center text-xs font-bold">{completed}</td>
                          <td className="p-3 text-center text-xs font-bold">{struggled}</td>
                          <td className="p-3 text-right text-xs font-black pr-4">{compRate.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 — Platform Breakdown (Recharts PieChart) */}
          <div className={`border p-6 rounded-2xl shadow-2xl flex flex-col justify-between space-y-6 transition-all ${
            isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
          }`}>
            <div>
              <h4 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-indigo-500" />
                Platform-wise Distribution
              </h4>
              <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-550'}`}>
                Roadmap volume division alongside average completion stats per platform.
              </p>
            </div>

            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%" key={isDark ? 'dark' : 'light'}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                            <p className="font-extrabold text-white">{data.name}</p>
                            <p className="text-gray-400 font-semibold">{data.value} Challenges</p>
                            <p className="text-indigo-400 font-bold">Avg Completed: {data.avgCompletion.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-black">{taskWise.length}</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Total Tasks</span>
              </div>
            </div>

            {/* Platform legend items */}
            <div className={`space-y-2 pt-2 border-t shrink-0 ${isDark ? 'border-gray-850' : 'border-gray-150'}`}>
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-semibold text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span>{item.name} ({item.value})</span>
                  </div>
                  <span className="font-black text-gray-800 dark:text-white">{item.avgCompletion.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4 — Individual Task Bars (Recharts BarChart) */}
        <div className={`border p-6 rounded-2xl shadow-2xl space-y-6 transition-all ${
          isDark ? 'bg-gray-900/60 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-md'
        }`}>
          <div>
            <h4 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Per-Task Completion Rates
            </h4>
            <p className={`text-xs font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-550'}`}>
              Exact completion percentages for each individual learning milestone.
            </p>
          </div>

          <div className="h-[340px] w-full">
            {taskWise.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 font-semibold">
                No task milestone completion statistics available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" key={isDark ? 'dark' : 'light'}>
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
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: isDark ? '#11131c' : '#ffffff', 
                      border: isDark ? '1px solid #1f2937' : '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="completion_rate" name="Completion Rate">
                    {taskWise.map((entry, index) => {
                      let color = '#d946ef'; // Fuchsia 500
                      const platformLower = (entry.platform || '').toLowerCase();
                      if (platformLower.includes('codechef')) color = '#6366f1'; // Indigo 500
                      else if (platformLower.includes('hackerrank')) color = '#14b8a6'; // Teal 500
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                    <LabelList
                      dataKey="completion_rate"
                      position="top"
                      formatter={(val) => `${Math.round(val)}%`}
                      fill="#888888"
                      fontSize={8}
                      fontWeight="bold"
                      offset={6}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
