import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import Layout from '../components/Layout';
import TraineeCard from '../components/TraineeCard';
import { Users, Search, Plus, X } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const AVAILABLE_TECHS = ['Python', 'PHP', 'QA', 'FastAPI', 'React'];

export const Trainees = () => {
  const { theme, role } = useContext(AuthContext);
  const isDark = theme === 'dark';
  const isAdmin = role === 'admin';

  const [trainees, setTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDept, setFormDept] = useState('Development');
  const [formDeptOther, setFormDeptOther] = useState('');
  const [showDeptOther, setShowDeptOther] = useState(false);
  const [formTechs, setFormTechs] = useState([]);
  const [formError, setFormError] = useState('');

  const fetchTraineesWithPlatformStats = async () => {
    setLoading(true);
    try {
      const [swRes, gridRes, tasksRes, rawTraineesRes] = await Promise.all([
        api.get('/analytics/student-wise'),
        api.get('/analytics/grid'),
        api.get('/tasks/'),
        api.get('/trainees/')
      ]);

      const swData = swRes.data;
      const gridData = gridRes.data;
      const tasksData = tasksRes.data;
      const rawTrainees = rawTraineesRes.data;

      // Mappings
      const taskPlatformMap = {};
      tasksData.forEach(t => {
        taskPlatformMap[t.task_name] = t.platform;
      });

      const traineeDataMap = {};
      rawTrainees.forEach(t => {
        traineeDataMap[t.trainee_name] = t;
      });

      // Combine
      const combined = swData.map(sw => {
        const gridEntry = gridData.students.find(s => s.student_name === sw.student_name);
        const rawT = traineeDataMap[sw.student_name] || {};
        
        // Build dynamic platform totals from all tasks
        const platformProgress = {};
        gridData.tasks.forEach((taskName) => {
          const rawPlatform = taskPlatformMap[taskName] || 'Akamai';
          let displayName = rawPlatform;
          const lower = rawPlatform.toLowerCase();
          if (lower === 'codechef') displayName = 'Codechef';
          else if (lower === 'hackerrank') displayName = 'HackerRank';
          else if (lower === 'akamai') displayName = 'Akamai';
          else displayName = rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1);

          if (!platformProgress[displayName]) {
            platformProgress[displayName] = { completed: 0, total: 0 };
          }
          platformProgress[displayName].total += 1;
        });

        if (gridEntry) {
          gridEntry.statuses.forEach((status, idx) => {
            const taskName = gridData.tasks[idx];
            const rawPlatform = taskPlatformMap[taskName] || 'Akamai';
            let displayName = rawPlatform;
            const lower = rawPlatform.toLowerCase();
            if (lower === 'codechef') displayName = 'Codechef';
            else if (lower === 'hackerrank') displayName = 'HackerRank';
            else if (lower === 'akamai') displayName = 'Akamai';
            else displayName = rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1);

            if (status === 'Completed' && platformProgress[displayName]) {
              platformProgress[displayName].completed += 1;
            }
          });
        }


        return {
          ...sw,
          id: rawT.id || sw.student_id,
          trainee_name: sw.student_name,
          joiningDate: rawT.joining_date || rawT.created_at,
          technologies: rawT.technologies || [],
          hackerrank_username: rawT.hackerrank_username || '',
          hackerrank_score: rawT.hackerrank_score || 0,
          hackerrank_solved: rawT.hackerrank_solved || 0,
          platformProgress
        };
      });

      setTrainees(combined);
    } catch (err) {
      console.error('Failed to load comprehensive trainees profile catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraineesWithPlatformStats();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedTraineeId(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormDept('Development');
    setFormDeptOther('');
    setShowDeptOther(false);
    setFormTechs([]);
    setFormError('');
    setShowModal(true);
  };

  const PRESET_DEPTS = ['Development', 'QA Testing', 'Management'];

  const openEditModal = (trainee) => {
    setModalMode('edit');
    setSelectedTraineeId(trainee.id);
    setFormName(trainee.trainee_name);
    setFormEmail(trainee.email || `${trainee.trainee_name.toLowerCase()}@tckade.com`);
    setFormPassword('');
    const dept = trainee.department || 'Development';
    if (PRESET_DEPTS.includes(dept)) {
      setFormDept(dept);
      setFormDeptOther('');
      setShowDeptOther(false);
    } else {
      setFormDept('Other');
      setFormDeptOther(dept);
      setShowDeptOther(true);
    }
    setFormTechs(trainee.technologies || []);
    setFormError('');
    setShowModal(true);
  };

  const handleTechCheckbox = (tech) => {
    setFormTechs((prev) => 
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const finalDept = formDept === 'Other' ? formDeptOther.trim() : formDept;
    if (formDept === 'Other' && !formDeptOther.trim()) {
      setFormError('Please enter a department name.');
      return;
    }

    const payload = {
      trainee_name: formName,
      email: formEmail,
      department: finalDept,
      technologies: formTechs,
      hackerrank_username: null,
      hackerrank_score: 0,
      hackerrank_solved: 0
    };

    try {
      if (modalMode === 'add') {
        if (!formPassword) {
          setFormError('Password is required when creating a new trainee.');
          return;
        }
        await api.post('/trainees/', { ...payload, password: formPassword });
      } else {
        const editPayload = { ...payload };
        if (formPassword) editPayload.password = formPassword;
        await api.put(`/trainees/${selectedTraineeId}`, editPayload);
      }
      setShowModal(false);
      fetchTraineesWithPlatformStats();
    } catch (err) {
      console.error('Failed to submit trainee profile:', err);
      setFormError(err.response?.data?.detail || 'Failed to save trainee record. Check inputs.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/trainees/${id}`);
      fetchTraineesWithPlatformStats();
    } catch (err) {
      console.error('Failed to delete trainee:', err);
      alert('Unable to delete trainee records.');
    }
  };

  const filteredTrainees = trainees.filter(
    (trainee) =>
      (trainee.trainee_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Layout title="Trainees Directory">
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Users className="text-indigo-500 h-6 w-6" />
              Trainees Dashboard
            </h3>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              View and administer the development activity and skills of assigned trainees.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search trainees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-indigo-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-450 focus:border-indigo-500 shadow-sm'
                }`}
              />
            </div>

            {/* Admin Add Trainee Button */}
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-lg shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Trainee
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : filteredTrainees.length === 0 ? (
          <div className={`border p-12 rounded-2xl flex flex-col items-center justify-center text-center ${
            isDark ? 'bg-gray-900/30 border-gray-800 text-gray-500' : 'bg-white border-gray-200 text-gray-400 shadow-sm'
          }`}>
            <Users className="h-12 w-12 mb-3 text-gray-400" />
            <h4 className="font-extrabold text-lg">No Trainees Found</h4>
            <p className="text-sm mt-1 max-w-sm font-medium">
              No trainee records match your query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainees.map((trainee) => (
              <TraineeCard
                key={trainee.id}
                trainee={trainee}
                joiningDate={trainee.joiningDate}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>

    {/* glassmorphic Modal Form */}
    {showModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-lg overflow-y-auto">
            <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-205 text-gray-900'
            }`}>
              <button
                onClick={() => setShowModal(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-xl border cursor-pointer hover:scale-105 transition-all ${
                  isDark ? 'bg-gray-950 border-gray-850 text-gray-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>

              <h4 className="text-lg font-black tracking-tight mb-5">
                {modalMode === 'add' ? 'Add New Trainee' : `Edit ${formName}`}
              </h4>

              {formError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Trainee Name */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Trainee Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahima, Dhanesh"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@tckade.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className={`w-full border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Password {modalMode === 'edit' && <span className="text-gray-500 normal-case font-semibold">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    required={modalMode === 'add'}
                    placeholder={modalMode === 'add' ? 'e.g. Welcome@123' : 'Enter new password to change'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className={`w-full border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>

                {/* Department Selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-indigo-500 mb-1.5">
                    Department
                  </label>
                  <select
                    value={formDept}
                    onChange={(e) => {
                      setFormDept(e.target.value);
                      const isOther = e.target.value === 'Other';
                      setShowDeptOther(isOther);
                      if (!isOther) setFormDeptOther('');
                    }}
                    className={`w-full border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-950 border-gray-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="Development">Development</option>
                    <option value="QA Testing">QA Testing</option>
                    <option value="Management">Management</option>
                    <option value="Other">Other</option>
                  </select>

                  {/* Custom department name input — shown when Other is selected */}
                  {showDeptOther && (
                    <input
                      type="text"
                      required
                      placeholder="Enter department name..."
                      value={formDeptOther}
                      onChange={(e) => setFormDeptOther(e.target.value)}
                      autoFocus
                      className={`mt-2 w-full border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 ${
                        isDark ? 'bg-gray-950 border-gray-850 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  )}
                </div>


                {/* Save Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
                  >
                    {modalMode === 'add' ? 'Create Trainee Profile' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );
};

export default Trainees;
