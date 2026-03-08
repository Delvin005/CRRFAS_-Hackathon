import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';

const ExamEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlanData();
  }, [id]);

  const fetchPlanData = async () => {
    try {
      const planRes = await axiosInstance.get(`${ENDPOINTS.exams.plans}${id}/`);
      setPlan(planRes.data);
      
      const sessionRes = await axiosInstance.get(`${ENDPOINTS.exams.sessions}?plan=${id}`);
      setSessions(sessionRes.data);
    } catch (error) {
      console.error('Error fetching plan/sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionUrl, actionName) => {
    if (!window.confirm(`Are you sure you want to ${actionName}?`)) return;
    setProcessing(true);
    try {
      const res = await axiosInstance.post(actionUrl);
      if (res.data.success) {
        alert(`${actionName} completed successfully.\nStats: ${JSON.stringify(res.data.stats || res.data)}`);
        fetchPlanData();
      }
    } catch (error) {
      console.error(`Error during ${actionName}:`, error);
      alert(`Failed to ${actionName}: ${error.response?.data?.error || error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const publishAction = async (actionStr) => {
    if (!window.confirm(`Are you sure you want to ${actionStr}?`)) return;
    setProcessing(true);
    try {
      const res = await axiosInstance.post(ENDPOINTS.exams.publish(id), { action: actionStr });
      if (res.data.success) {
        alert(`Plan ${actionStr} successful.`);
        fetchPlanData();
      }
    } catch (error) {
      console.error(`Error during ${actionStr}:`, error);
      alert(`Failed to ${actionStr}.`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-6">Loading Exam Plan...</div>;
  if (!plan) return <div className="p-6 text-red-500">Plan not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{plan.name} - Actions</h1>
          <p className="text-slate-500">
            {plan.academic_year_label} • Sem {plan.semester_label} • Status: {plan.status}
          </p>
        </div>
        <div className="space-x-3">
          <button onClick={() => navigate('/exams/plans')} className="text-slate-600 hover:text-slate-800 font-medium">
            Back to Plans
          </button>
          {!plan.is_published ? (
            <button
              onClick={() => publishAction('publish')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-sm"
              disabled={processing}
            >
              Requirements Met? Publish
            </button>
          ) : (
            <button
              onClick={() => publishAction('unpublish')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl shadow-sm"
              disabled={processing}
            >
              Unpublish to Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">1</div>
          <h3 className="font-bold text-slate-800 mb-2">Auto-Allocate Halls</h3>
          <p className="text-sm text-slate-500 mb-4 h-10">Assigns rooms fitting capacities required per session.</p>
          <button
            onClick={() => handleAction(ENDPOINTS.exams.autoAllocate(id), 'Auto-Allocate Halls')}
            disabled={processing || plan.is_published}
            className="w-full bg-slate-800 text-white py-2 rounded-xl disabled:opacity-50"
          >
            Run Hall Allocator
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">2</div>
          <h3 className="font-bold text-slate-800 mb-2">Generate Seating</h3>
          <p className="text-sm text-slate-500 mb-4 h-10">Creates seat plans by roll number for allocated halls.</p>
          <button
            onClick={() => handleAction(ENDPOINTS.exams.generateSeating(id), 'Generate Seating Plans')}
            disabled={processing || plan.is_published}
            className="w-full bg-slate-800 text-white py-2 rounded-xl disabled:opacity-50"
          >
            Run Seat Generator
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="h-12 w-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">3</div>
          <h3 className="font-bold text-slate-800 mb-2">Assign Invigilators</h3>
          <p className="text-sm text-slate-500 mb-4 h-10">Maps available faculty to halls without conflicts.</p>
          <button
            onClick={() => handleAction(ENDPOINTS.exams.assignInvigilators(id), 'Assign Invigilators')}
            disabled={processing || plan.is_published}
            className="w-full bg-slate-800 text-white py-2 rounded-xl disabled:opacity-50"
          >
            Assign Invigilators
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Exam Sessions Preview</h2>
        {sessions.length === 0 ? (
          <p className="text-slate-500 italic">No sessions found. Make sure you seeded exam session data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 font-semibold text-slate-700">Date</th>
                  <th className="py-3 font-semibold text-slate-700">Time</th>
                  <th className="py-3 font-semibold text-slate-700">Type</th>
                  <th className="py-3 font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 text-slate-800">{s.date}</td>
                    <td className="py-3 text-slate-600">{s.start_time} - {s.end_time}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                        {s.session_type}
                      </span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => window.open(`/exams/printable/${s.id}`, '_blank')} className="text-primary hover:text-primary-dark font-medium text-sm">
                        🖨️ Printable View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ExamEditorPage;
