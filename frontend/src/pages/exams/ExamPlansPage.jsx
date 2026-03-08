import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';

const STATUS_STYLES = {
  published: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  review:    { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  draft:     { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
  archived:  { bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

const INPUT_CLS = {
  style: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }
};

const ExamPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', academic_year: '', semester: '', start_date: '', end_date: '' });

  useEffect(() => { fetchPlans(); fetchDropdownData(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get(ENDPOINTS.exams.plans);
      setPlans(res.data.results || res.data || []);
    } catch (error) { console.error('Error fetching plans:', error); }
    finally { setLoading(false); }
  };

  const fetchDropdownData = async () => {
    try {
      const [ayRes, semRes] = await Promise.all([
        axiosInstance.get(ENDPOINTS.academics.academicYears),
        axiosInstance.get('/academics/semesters/')
      ]);
      setAcademicYears(ayRes.data.results || ayRes.data || []);
      setSemesters(semRes.data.results || semRes.data || []);
    } catch (error) { console.error('Error fetching dropdowns:', error); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        academic_year: parseInt(formData.academic_year, 10),
        semester: parseInt(formData.semester, 10),
      };
      await axiosInstance.post(ENDPOINTS.exams.plans, payload);
      setIsModalOpen(false);
      setFormData({ name: '', academic_year: '', semester: '', start_date: '', end_date: '' });
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan: ' + (error.response?.data ? JSON.stringify(error.response.data) : error.message));
    }
  };

  if (loading) return (
    <div className="p-6 text-slate-400 animate-pulse">Loading exam plans…</div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center rounded-2xl px-6 py-5 border"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <div>
          <h1 className="text-2xl font-bold text-white">Exam Plans</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Manage institutional examination cycles</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition-colors"
          style={{ backgroundColor: '#3b82f6' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          + New Exam Phase
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map(plan => {
          const s = STATUS_STYLES[plan.status] || STATUS_STYLES.draft;
          return (
            <div
              key={plan.id}
              className="rounded-2xl border overflow-hidden transition-all hover:scale-[1.01]"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
            >
              {/* Accent top strip */}
              <div className="h-1" style={{ backgroundColor: s.text }} />

              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {plan.academic_year_label} • Sem {plan.semester_label}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-0.5 text-xs font-semibold rounded-full border"
                    style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                  >
                    {plan.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5 mb-5 text-sm" style={{ color: '#94a3b8' }}>
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="font-medium text-white">{plan.start_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span className="font-medium text-white">{plan.end_date}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/exams/editor/${plan.id}`}
                    className="flex-1 text-center py-2 rounded-xl text-sm font-medium border transition-colors text-slate-300 hover:text-white"
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  >
                    Manage Sessions
                  </Link>
                  <Link
                    to={`/exams/allocations/${plan.id}`}
                    className="flex-1 text-center py-2 rounded-xl text-sm font-medium border transition-colors text-slate-300 hover:text-white"
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  >
                    Allocations
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {plans.length === 0 && (
          <div className="col-span-full py-16 text-center rounded-2xl border border-dashed text-slate-500"
            style={{ borderColor: '#334155', backgroundColor: '#0f172a' }}>
            No exam plans created yet. Click <strong className="text-white">+ New Exam Phase</strong> to start.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
            {/* Modal header */}
            <div className="px-6 py-4 border-b flex justify-between items-center"
              style={{ borderColor: '#334155', backgroundColor: '#0f172a' }}>
              <h2 className="text-base font-bold text-white">New Exam Plan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Plan Name</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2"
                  style={{ ...INPUT_CLS.style, '--tw-ring-color': '#3b82f6' }}
                  placeholder="e.g. Fall 2024 Midterms"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Academic Year</label>
                  <select required value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none"
                    style={INPUT_CLS.style}>
                    <option value="">Select AY</option>
                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Semester</label>
                  <select required value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none"
                    style={INPUT_CLS.style}>
                    <option value="">Select Sem</option>
                    {semesters.map(sem => <option key={sem.id} value={sem.id}>Sem {sem.number}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Start Date</label>
                  <input type="date" required value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none"
                    style={INPUT_CLS.style} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">End Date</label>
                  <input type="date" required value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none"
                    style={INPUT_CLS.style} />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border text-slate-300 hover:text-white transition-colors"
                  style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: '#3b82f6' }}>
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPlansPage;
