import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar, Clock, MapPin, XCircle, ChevronRight, Activity, CheckCircle } from 'lucide-react';

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                // Fetch only the current user's bookings by backend default or explicitly
                const res = await api.get('bookings/requests/');
                // Sort by newest first
                setBookings(res.data.results || res.data);
            } catch (error) {
                console.error("Failed to load bookings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
     
        }, []);

    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await api.post(`bookings/requests/${id}/cancel/`);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
        } catch (error) { console.error(error); 
            alert('Failed to cancel booking. It may have already started.');
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            draft: 'bg-gray-500/20 text-gray-400',
            pending: 'bg-yellow-500/20 text-yellow-400',
            approved: 'bg-green-500/20 text-green-400',
            rejected: 'bg-red-500/20 text-red-400',
            cancelled: 'bg-gray-500/20 text-gray-400 line-through',
            completed: 'bg-blue-500/20 text-blue-400'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>{status}</span>;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-crrfas-light tracking-tight">My Bookings</h1>
                    <p className="text-crrfas-muted">Track the status of your facility and resource requests.</p>
                </div>
                <a href="/request" className="btn-primary flex items-center gap-2">
                    <span>+ New Request</span>
                </a>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-crrfas-cyan animate-pulse">Loading bookings...</div>
            ) : bookings.length === 0 ? (
                <div className="glass-panel text-center py-16 text-crrfas-muted">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-crrfas-light mb-2">No Bookings Yet</h3>
                    <p>You haven't made any resource or facility requests.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map(booking => (
                        <div key={booking.id} className="glass-panel p-5 flex flex-col md:flex-row gap-6 relative overflow-hidden group">

                            {/* Left Side: Core Info */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-crrfas-cyan bg-crrfas-cyan/10 px-2 py-1 rounded">
                                        {booking.booking_ref}
                                    </span>
                                    <StatusBadge status={booking.status} />
                                    {booking.auto_approved && (
                                        <span className="text-xs text-crrfas-muted flex items-center gap-1">
                                            <Activity className="w-3 h-3" /> Auto-Approved
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-crrfas-light">{booking.title}</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-crrfas-muted">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-crrfas-cyan" />
                                        <span>
                                            {new Date(booking.start_time).toLocaleString()} <br />
                                            {new Date(booking.end_time).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-crrfas-cyan" />
                                        <div className="capitalize">
                                            {booking.room ? `Room ID: ${booking.room}` : ''}
                                            {booking.resource ? `Resource Asset ID: ${booking.resource}` : ''}
                                            {booking.sub_unit ? `Sub-Unit ID: ${booking.sub_unit}` : ''}
                                            <br />
                                            <span className="text-xs opacity-75">{booking.booking_type.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Timeline & Actions */}
                            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-crrfas-surface/50 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                                {/* Simple Timeline Component */}
                                <div className="space-y-2 mb-4">
                                    <div className="text-xs font-semibold text-crrfas-muted mb-1">Request Timeline</div>

                                    <div className="flex items-center text-xs text-green-400">
                                        <CheckCircle className="w-3 h-3 mr-2" /> <span>Submitted</span>
                                    </div>

                                    {(booking.status === 'pending' || booking.status === 'approved' || booking.status === 'rejected') && (
                                        <div className="flex text-xs">
                                            <div className="w-3 flex justify-center mr-2"><div className="w-px h-full bg-crrfas-surface"></div></div>
                                        </div>
                                    )}

                                    {booking.status === 'pending' && (
                                        <div className="flex items-center text-xs text-yellow-400">
                                            <Clock className="w-3 h-3 mr-2" /> <span>Pending Review</span>
                                        </div>
                                    )}

                                    {booking.status === 'approved' && (
                                        <div className="flex items-center text-xs text-green-400">
                                            <CheckCircle className="w-3 h-3 mr-2" /> <span>Approved</span>
                                        </div>
                                    )}

                                    {booking.status === 'rejected' && (
                                        <div className="flex items-center text-xs text-red-400">
                                            <XCircle className="w-3 h-3 mr-2" /> <span>Rejected</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 justify-end">
                                    {['draft', 'pending', 'approved'].includes(booking.status) && (
                                        <button
                                            onClick={() => handleCancel(booking.id)}
                                            className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
