import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Check, X, Users, MapPin, Clock, MessageSquare } from 'lucide-react';

export default function ApprovalInbox() {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [comments, setComments] = useState('');
    const [decisionLoading, setDecisionLoading] = useState(false);

    const fetchPending = async () => {
        try {
            const res = await api.get('bookings/requests/?status=pending');
            setPendingRequests(res.data.results || res.data);
        } catch (err) {
            console.error('Failed to load pending requests', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleDecision = async (decision) => {
        if (!selectedRequest) return;
        setDecisionLoading(true);
        try {
            await api.post(`bookings/requests/${selectedRequest.id}/decide/`, {
                decision,
                comments
            });
            // Refresh list & reset modal
            setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setSelectedRequest(null);
            setComments('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to submit decision.');
        } finally {
            setDecisionLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-crrfas-light tracking-tight">Approval Inbox</h1>
                    <p className="text-crrfas-muted">Review pending facility and resource requests routed to you.</p>
                </div>
                <div className="bg-crrfas-cyan/20 text-crrfas-cyan font-bold px-4 py-2 rounded-lg break-keep">
                    {pendingRequests.length} Pending
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-crrfas-cyan animate-pulse">Loading inbox...</div>
            ) : pendingRequests.length === 0 ? (
                <div className="glass-panel text-center py-20 text-crrfas-muted">
                    <Check className="w-16 h-16 mx-auto mb-4 opacity-50 text-green-400" />
                    <h3 className="text-xl font-bold text-crrfas-light mb-2">You're all caught up!</h3>
                    <p>No pending booking requests require your approval right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Inbox List */}
                    <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {pendingRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => { setSelectedRequest(req); setComments(''); }}
                                className={`p-4 rounded-xl cursor-pointer transition-all border-l-4 ${selectedRequest?.id === req.id ? 'bg-crrfas-cyan/10 border-crrfas-cyan shadow-lg shadow-crrfas-cyan/5' : 'glass-panel border-transparent hover:border-crrfas-cyan/50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-mono text-crrfas-cyan bg-crrfas-surface px-2 py-0.5 rounded">
                                        {req.booking_ref}
                                    </span>
                                    <span className="text-xs font-semibold text-crrfas-muted bg-crrfas-bg px-2 py-0.5 rounded uppercase">
                                        {req.booking_type.replace('_', ' ')}
                                    </span>
                                </div>
                                <h4 className="font-bold text-crrfas-light truncate">{req.title}</h4>
                                <div className="text-sm text-crrfas-muted mt-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    {new Date(req.start_time).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:col-span-2">
                        {selectedRequest ? (
                            <div className="glass-panel p-6 lg:p-8 flex flex-col h-full sticky top-6">
                                <div className="border-b border-crrfas-surface/50 pb-4 mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-crrfas-light">{selectedRequest.title}</h2>
                                    </div>
                                    <div className="text-sm text-crrfas-muted">Requested by: <strong>{selectedRequest.requester}</strong></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 flex-1 content-start">
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs text-crrfas-muted uppercase tracking-wider mb-1">Schedule</div>
                                            <div className="bg-crrfas-bg p-3 rounded-lg border border-crrfas-surface flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                <Clock className="w-5 h-5 text-crrfas-cyan shrink-0 hidden sm:block" />
                                                <div className="text-sm">
                                                    <div>From: <span className="text-crrfas-light font-medium">{new Date(selectedRequest.start_time).toLocaleString()}</span></div>
                                                    <div>To: <span className="text-crrfas-light font-medium">{new Date(selectedRequest.end_time).toLocaleString()}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-crrfas-muted uppercase tracking-wider mb-1">Location / Target</div>
                                            <div className="bg-crrfas-bg p-3 rounded-lg border border-crrfas-surface flex items-center gap-3">
                                                <MapPin className="w-5 h-5 text-crrfas-cyan shrink-0" />
                                                <div className="text-sm font-medium text-crrfas-light">
                                                    {selectedRequest.room ? `Room #${selectedRequest.room}` : ''}
                                                    {selectedRequest.resource ? `Resource #${selectedRequest.resource}` : ''}
                                                    {selectedRequest.sub_unit ? `Sub-Unit #${selectedRequest.sub_unit}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-xs text-crrfas-muted uppercase tracking-wider mb-1">Details</div>
                                            <div className="bg-crrfas-bg p-3 rounded-lg border border-crrfas-surface space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Users className="w-4 h-4 text-crrfas-muted shrink-0" />
                                                    <span>Attendees: {selectedRequest.expected_attendees || 'N/A'}</span>
                                                </div>
                                                <div className="text-sm border-t border-crrfas-surface pt-2">
                                                    <span className="text-crrfas-muted block mb-1">Description:</span>
                                                    {selectedRequest.description || <span className="italic opacity-50">No description provided.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="mt-auto bg-crrfas-bg/50 p-4 rounded-xl border border-crrfas-surface">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-crrfas-light mb-2">
                                        <MessageSquare className="w-4 h-4" /> Reviewer Comments
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="Add comments before approving/rejecting (optional)..."
                                        value={comments}
                                        onChange={e => setComments(e.target.value)}
                                        className="input-field w-full mb-4 bg-crrfas-surface/30 focus:bg-crrfas-bg"
                                    />
                                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                                        <button
                                            onClick={() => handleDecision('approved')}
                                            disabled={decisionLoading}
                                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all"
                                        >
                                            <Check className="w-5 h-5" /> {decisionLoading ? '...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleDecision('rejected')}
                                            disabled={decisionLoading}
                                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all"
                                        >
                                            <X className="w-5 h-5" /> {decisionLoading ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] glass-panel flex flex-col items-center justify-center text-crrfas-muted">
                                <MessageSquare className="w-12 h-12 opacity-20 mb-4" />
                                <p>Select a request from the inbox to review details.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
