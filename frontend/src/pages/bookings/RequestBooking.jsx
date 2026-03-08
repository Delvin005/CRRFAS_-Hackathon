import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { CheckCircle, Clock } from 'lucide-react';

export default function RequestBooking() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        booking_type: 'student_event',
        expected_attendees: 10,
        department: '',
        start_time: '',
        end_time: '',
        targetCategory: 'room', // room, resource, sub_unit
        targetId: '',
    });

    // Reference Data
    const [rooms, setRooms] = useState([]);
    const [resources, setResources] = useState([]);
    const [subUnits, setSubUnits] = useState([]);
    const [campuses, setCampuses] = useState([]);

    // UI State
    const [selectedCampus, setSelectedCampus] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingConflict, setCheckingConflict] = useState(false);
    const [conflictResult, setConflictResult] = useState(null);
    const [error, setError] = useState('');
    const [successPayload, setSuccessPayload] = useState(null);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    const BOOKING_TYPES = [
        { id: 'student_event', label: 'Student Event/Festival' },
        { id: 'academic_workshop', label: 'Academic Workshop' },
        { id: 'seminar', label: 'Seminar' },
        { id: 'guest_lecture', label: 'Guest Lecture' },
        { id: 'admin_meeting', label: 'Admin/Staff Meeting' },
        { id: 'external_conference', label: 'External Conference' },
        { id: 'sports_booking', label: 'Sports Practice/Match' },
        { id: 'research_access_request', label: 'Research Access Request' },
        { id: 'club_activity', label: 'Club/Society Activity' },
        { id: 'examination', label: 'Examination / Invigilation' },
        { id: 'interview_drive', label: 'Placement/Interview Drive' },
        { id: 'rehearsal', label: 'Cultural Rehearsal' },
        { id: 'maintenance', label: 'Facility Maintenance' },
    ];

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await api.get('facilities/campuses/');
                setCampuses(res.data.results || res.data);
                if (res.data.results?.length > 0) {
                    setSelectedCampus(res.data.results[0].id);
                }
            } catch (error) {
                console.error('Failed to load campuses', error);
            }
        };
        loadInitialData();
     
        }, []);

    useEffect(() => {
        // Load target options based on selected category and campus
        const loadTargets = async () => {
            try {
                if (formData.targetCategory === 'room') {
                    const res = await api.get('facilities/rooms/');
                    let filtered = res.data.results || res.data;
                    if (selectedCampus) {
                        filtered = filtered.filter(r => r.campus_id === selectedCampus || r.campus === selectedCampus);
                    }
                    setRooms(filtered);
                } else if (formData.targetCategory === 'resource') {
                    const res = await api.get('resources/assets/');
                    setResources(res.data.results || res.data);
                } else if (formData.targetCategory === 'sub_unit') {
                    const res = await api.get('resources/items/');
                    setSubUnits(res.data.results || res.data);
                }
            } catch (error) {
                console.error('Failed to load targets', error);
            }
        };

        if (step === 2) loadTargets();
    }, [formData.targetCategory, selectedCampus, step]);


    const handleCheckAndProceed = async () => {
        setError('');
        if (!formData.title || !formData.start_time || !formData.end_time || !formData.department) {
            return setError('Please fill all required basic details, including Department.');
        }
        if (new Date(formData.start_time) >= new Date(formData.end_time)) {
            return setError('End time must be after start time.');
        }
        setStep(2);
    };

    const handleFinalCheckAndSubmit = async () => {
        setError('');
        setConflictResult(null);
        if (!formData.targetId) {
            return setError('Please select a specific facility or resource to book.');
        }

        setCheckingConflict(true);
        try {
            // Check Conflict
            const conflictPayload = {
                start_time: formData.start_time,
                end_time: formData.end_time,
                [formData.targetCategory]: formData.targetId
            };

            const conflictRes = await api.post('bookings/requests/check_conflict/', conflictPayload);

            if (conflictRes.data.conflict) {
                setConflictResult(conflictRes.data.conflicting_booking);
                setCheckingConflict(false);
                return;
            }

            // No conflict -> Submit Request
            submitBooking();

        } catch (error) {
            setError(error.response?.data?.error || 'Failed to verify availability.');
            setCheckingConflict(false);
        }
    };

    const submitBooking = async () => {
        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                booking_type: formData.booking_type,
                expected_attendees: formData.expected_attendees,
                department: formData.department,
                start_time: formData.start_time,
                end_time: formData.end_time,
                [formData.targetCategory]: formData.targetId
            };

            const res = await api.post('bookings/requests/', payload);
            setSuccessPayload(res.data);
            setStep(3);
        } catch (error) {
            setError(error.response?.data?.detail || 'Failed to submit booking request.');
        } finally {
            setLoading(false);
            setCheckingConflict(false);
        }
    };

    if (step === 3 && successPayload) {
        return (
            <div className="max-w-2xl mx-auto mt-12 glass-panel p-8 text-center space-y-6">
                <div className="flex justify-center">
                    {successPayload.status === 'approved'
                        ? <CheckCircle className="w-20 h-20 text-green-400" />
                        : <Clock className="w-20 h-20 text-yellow-400" />
                    }
                </div>
                <h2 className="text-3xl font-bold text-crrfas-light">Request Submitted</h2>
                <div className="text-crrfas-muted text-lg">
                    Booking Ref: <span className="font-mono text-crrfas-cyan">{successPayload.booking_ref}</span>
                </div>

                <div className="bg-crrfas-surface/50 rounded-lg p-6 inline-block text-left w-full space-y-3">
                    <p><strong>Status:</strong> {
                        successPayload.status === 'approved'
                            ? <span className="text-green-400">Auto-Approved (Policy)</span>
                            : <span className="text-yellow-400">Pending Approval</span>
                    }</p>
                    <p><strong>Title:</strong> {successPayload.title}</p>
                    <p><strong>Time:</strong> {new Date(successPayload.start_time).toLocaleString()} — {new Date(successPayload.end_time).toLocaleString()}</p>
                </div>

                <button onClick={() => navigate('/bookings')} className="btn-primary mt-4">
                    View My Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <h1 className="text-3xl font-black text-crrfas-light tracking-tight">New Booking Request</h1>

            {/* Stepper */}
            <div className="flex gap-4 mb-8">
                <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-crrfas-cyan' : 'bg-crrfas-surface border border-crrfas-bg'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-crrfas-cyan' : 'bg-crrfas-surface border border-crrfas-bg'}`}></div>
                <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-crrfas-cyan' : 'bg-crrfas-surface border border-crrfas-bg'}`}></div>
            </div>

            <div className="glass-panel p-6">
                {error && <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-6 text-red-400">{error}</div>}

                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-crrfas-cyan border-b border-crrfas-surface/50 pb-2">1. Event Details & Time</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-crrfas-muted uppercase tracking-wider">Event Title *</label>
                                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field w-full" placeholder="e.g. Annual Tech Symposium" />
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-sm font-semibold text-crrfas-muted uppercase tracking-wider">Booking Type *</label>
                                <div
                                    className="input-field w-full cursor-pointer flex justify-between items-center bg-crrfas-bg"
                                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                >
                                    {BOOKING_TYPES.find(t => t.id === formData.booking_type)?.label || 'Select Type'}
                                    <span className="text-xs">▼</span>
                                </div>
                                {showTypeDropdown && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-crrfas-bg border border-crrfas-surface rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                        {BOOKING_TYPES.map(t => (
                                            <div
                                                key={t.id}
                                                className={`p-3 cursor-pointer hover:bg-crrfas-surface/50 transition-colors ${formData.booking_type === t.id ? 'text-crrfas-cyan bg-crrfas-cyan/10 font-bold' : 'text-crrfas-light'}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, booking_type: t.id });
                                                    setShowTypeDropdown(false);
                                                }}
                                            >
                                                {t.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-crrfas-muted uppercase tracking-wider">Start Time *</label>
                                <input type="datetime-local" required value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="input-field w-full" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-crrfas-muted uppercase tracking-wider">End Time *</label>
                                <input type="datetime-local" required value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="input-field w-full" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-crrfas-muted uppercase tracking-wider">Expected Attendees</label>
                                <input type="number" min="1" value={formData.expected_attendees} onChange={e => setFormData({ ...formData, expected_attendees: e.target.value })} className="input-field w-full" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-crrfas-muted uppercase tracking-wider">Department *</label>
                                <input required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="input-field w-full" placeholder="e.g. Computer Science" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-crrfas-muted uppercase tracking-wider">Description / Purpose</label>
                            <textarea rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field w-full" placeholder="Additional details..." />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button onClick={handleCheckAndProceed} className="btn-primary">Next: Select Facility / Resource →</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-crrfas-cyan border-b border-crrfas-surface/50 pb-2">2. What do you want to book?</h2>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {['room', 'resource', 'sub_unit'].map(cat => (
                                <button key={cat} onClick={() => { setFormData({ ...formData, targetCategory: cat, targetId: '' }); setConflictResult(null); }}
                                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${formData.targetCategory === cat ? 'border-crrfas-cyan bg-crrfas-cyan/10' : 'border-crrfas-surface bg-crrfas-bg hover:border-crrfas-cyan/50 text-crrfas-muted'}`}>
                                    <div className="font-bold capitalize">{cat.replace('_', ' ')}</div>
                                </button>
                            ))}
                        </div>

                        {formData.targetCategory === 'room' && (
                            <div className="space-y-4 bg-crrfas-surface/30 p-4 rounded-xl">
                                <div className="flex gap-4">
                                    <select value={selectedCampus} onChange={e => setSelectedCampus(e.target.value)} className="input-field max-w-xs">
                                        <option value="">Filter by Campus...</option>
                                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {rooms.map(r => (
                                        <div key={r.id} onClick={() => setFormData({ ...formData, targetId: r.id })}
                                            className={`p-3 rounded-lg border cursor-pointer ${formData.targetId === r.id ? 'border-crrfas-cyan bg-crrfas-cyan/10' : 'border-crrfas-surface bg-crrfas-bg'}`}>
                                            <div className="font-bold">{r.room_number}</div>
                                            <div className="text-xs text-crrfas-muted">{r.name}</div>
                                        </div>
                                    ))}
                                    {rooms.length === 0 && <div className="text-crrfas-muted col-span-3 py-4">No rooms found.</div>}
                                </div>
                            </div>
                        )}

                        {formData.targetCategory === 'resource' && (
                            <div className="space-y-4 bg-crrfas-surface/30 p-4 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {resources.map(r => (
                                        <div key={r.id} onClick={() => setFormData({ ...formData, targetId: r.id })}
                                            className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${formData.targetId === r.id ? 'border-crrfas-cyan bg-crrfas-cyan/10' : 'border-crrfas-surface bg-crrfas-bg'}`}>
                                            <div>
                                                <div className="font-bold text-sm">{r.name}</div>
                                                <div className="text-xs text-crrfas-muted">{r.resource_code}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.targetCategory === 'sub_unit' && (
                            <div className="space-y-4 bg-crrfas-surface/30 p-4 rounded-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {subUnits.map(su => (
                                        <div key={su.id} onClick={() => setFormData({ ...formData, targetId: su.id })}
                                            className={`p-3 rounded-lg border cursor-pointer ${formData.targetId === su.id ? 'border-crrfas-cyan bg-crrfas-cyan/10' : 'border-crrfas-surface bg-crrfas-bg'}`}>
                                            <div className="font-bold text-sm">{su.unit_identifier}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selected Target Summary */}
                        {formData.targetId && (
                            <div className="bg-crrfas-surface/20 border border-crrfas-cyan/30 rounded-xl p-5 mt-6 relative overflow-hidden animate-fade-in flex flex-col gap-3">
                                <div className="absolute top-0 left-0 w-1 h-full bg-crrfas-cyan"></div>
                                <h3 className="text-crrfas-cyan font-bold mb-1">Confirmation Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-crrfas-bg p-3 rounded border border-crrfas-surface">
                                        <span className="text-crrfas-muted block text-xs uppercase mb-1">Event</span>
                                        <div className="font-semibold text-crrfas-light">{formData.title}</div>
                                        <div className="text-crrfas-muted text-xs">{BOOKING_TYPES.find(t => t.id === formData.booking_type)?.label}</div>
                                    </div>
                                    <div className="bg-crrfas-bg p-3 rounded border border-crrfas-surface">
                                        <span className="text-crrfas-muted block text-xs uppercase mb-1">Date & Time</span>
                                        <div className="text-crrfas-light flex items-start gap-2">
                                            <Clock className="w-4 h-4 text-crrfas-cyan shrink-0 mt-0.5" />
                                            <div>
                                                <div>{new Date(formData.start_time).toLocaleString()}</div>
                                                <div className="text-crrfas-muted text-xs">to {new Date(formData.end_time).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-crrfas-bg p-3 rounded border border-crrfas-surface md:col-span-2">
                                        <span className="text-crrfas-muted block text-xs uppercase mb-1">Department & Attendees</span>
                                        <div className="text-crrfas-light">{formData.department} <span className="text-crrfas-muted">({formData.expected_attendees} expected attendees)</span></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Conflict Warning Banner */}
                        {conflictResult && (
                            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                                <h3 className="font-bold text-red-500 flex items-center gap-2">⚠️ Slot Unavailable</h3>
                                <p className="text-crrfas-light mt-1">
                                    Conflicts with: <span className="font-bold">{conflictResult.title}</span> ({conflictResult.status})<br />
                                    From: {new Date(conflictResult.start_time).toLocaleString()}<br />
                                    To: {new Date(conflictResult.end_time).toLocaleString()}
                                </p>
                                <p className="text-sm text-red-400 mt-2">Please select a different time or facility.</p>
                            </div>
                        )}

                        <div className="pt-8 flex flex-col-reverse sm:flex-row justify-between gap-4">
                            <button onClick={() => setStep(1)} className="btn-secondary w-full sm:w-auto">← Back</button>
                            <button onClick={handleFinalCheckAndSubmit} disabled={checkingConflict || loading || !formData.targetId} className="btn-primary w-full sm:w-auto">
                                {checkingConflict ? 'Verifying Availability...' : loading ? 'Submitting...' : 'Confirm Request & Submit'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
