import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import { Cpu, Terminal, ShieldCheck, Database, Layers, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const TECHS = ['Python', 'PHP', 'QA', 'FastAPI', 'React'];

const TECH_METADATA = {
  Python: {
    color: 'from-blue-500 to-amber-500',
    icon: Terminal,
    desc: 'General purpose coding, scripting, and data pipelines.',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  PHP: {
    color: 'from-indigo-500 to-indigo-750',
    icon: Layers,
    desc: 'Legacy web application platforms and server modules.',
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  },
  QA: {
    color: 'from-emerald-500 to-teal-500',
    icon: ShieldCheck,
    desc: 'Quality assurance, functional automation, and testing suites.',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  FastAPI: {
    color: 'from-teal-500 to-cyan-500',
    icon: Database,
    desc: 'Modern, high-performance async REST API endpoints.',
    bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
  },
  React: {
    color: 'from-cyan-500 to-blue-500',
    icon: Cpu,
    desc: 'Rich interactive frontend responsive components and state.',
    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  }
};

export const Technologies = () => {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        const response = await api.get('/trainees/');
        setTrainees(response.data);
      } catch (err) {
        console.error('Failed to load trainee technology allocations:', err);
        setError('Unable to load skills matrix. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrainees();
  }, []);

  if (loading) {
    return (
      <Layout title="Technologies Allocation">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  // Group trainees by technology
  const groupings = TECHS.reduce((acc, tech) => {
    acc[tech] = trainees.filter(t => t.technologies?.includes(tech));
    return acc;
  }, {});

  return (
    <Layout title="Technologies Allocation">
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* Header Block */}
        <div className={`p-6 rounded-2xl border transition-all ${
          isDark 
            ? 'bg-gray-900/40 border-gray-800 text-white' 
            : 'bg-white border-gray-200 text-gray-900 shadow-sm'
        }`}>
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-500" /> Technology Skill Allocations
          </h3>
          <p className={`text-xs mt-2 font-medium leading-relaxed max-w-2xl ${
            isDark ? 'text-gray-400' : 'text-gray-650'
          }`}>
            Allocate, track, and compare curriculum milestones for our trainees grouped by their core technical stacks. 
            Trainees can be assigned to multiple technologies depending on their active learning paths.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Technology Allocation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TECHS.map((tech) => {
            const meta = TECH_METADATA[tech];
            const Icon = meta.icon;
            const assignedList = groupings[tech] || [];
            
            return (
              <div
                key={tech}
                className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 transition-all duration-300 ${
                  isDark
                    ? 'bg-gray-900/60 hover:bg-gray-900 border-gray-800 text-white hover:border-gray-700 shadow-2xl'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900 hover:border-indigo-200 shadow-md'
                }`}
              >
                {/* Tech Header Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-extrabold border ${meta.bg}`}>
                      <Icon className="h-5 w-5 shrink-0" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                      assignedList.length > 0
                        ? isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : isDark ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>
                      {assignedList.length} {assignedList.length === 1 ? 'Trainee' : 'Trainees'}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-base font-extrabold">{tech}</h4>
                    <p className={`text-xs mt-1 leading-snug font-medium ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {meta.desc}
                    </p>
                  </div>
                </div>

                {/* Assigned Trainees List */}
                <div className="space-y-3 flex-1">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Assigned Trainees</h5>
                  
                  {assignedList.length === 0 ? (
                    <div className={`p-4 rounded-xl border border-dashed text-center text-xs font-semibold ${
                      isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'
                    }`}>
                      No trainees assigned
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {assignedList.map((trainee) => {
                        const progressVal = trainee.overall_progress ?? 0;
                        return (
                          <div 
                            key={trainee.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              isDark ? 'bg-gray-950/40 border-gray-850/50 hover:bg-gray-950' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-extrabold truncate ${isDark ? 'text-white' : 'text-gray-850'}`}>
                                  {trainee.trainee_name}
                                </span>
                                <span className={`text-[9px] font-black ${
                                  progressVal >= 80 ? 'text-green-500' : progressVal >= 50 ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                  {Math.round(progressVal)}%
                                </span>
                              </div>
                              {/* Progress bar */}
                              <div className="w-full h-1 bg-gray-300 dark:bg-gray-800 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progressVal >= 80 ? 'bg-green-500' : progressVal >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${progressVal}%` }}
                                />
                              </div>
                            </div>

                            <Link
                              to={`/trainees/${trainee.id}`}
                              className={`p-1.5 rounded-lg border hover:scale-105 transition-all shrink-0 ${
                                isDark 
                                  ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white' 
                                  : 'bg-white border-gray-200 text-gray-500 hover:text-indigo-600'
                              }`}
                              title="View Detail"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Technologies;
