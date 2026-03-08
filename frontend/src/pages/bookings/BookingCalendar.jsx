import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function BookingCalendar() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filters
    const [statusFilter, setStatusFilter] = useState('approved_pending'); // approved, pending, all

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                // Fetch all bookings for the tenant's calendar
                const res = await api.get('bookings/requests/');
                let data = res.data.results || res.data;

                // Filter client side for simplicity based on statusFilter dropdown
                if (statusFilter === 'approved_pending') {
                    data = data.filter(b => b.status === 'approved' || b.status === 'pending');
                } else if (statusFilter !== 'all') {
                    data = data.filter(b => b.status === statusFilter);
                }

                setBookings(data);
            } catch (error) {
                console.error("Failed to load global bookings for calendar", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [currentDate, statusFilter]);

    const changeDate = (days) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + days);
        setCurrentDate(newDate);
    };

    // Filter bookings that land on the currently selected date
    const dayBookings = bookings.filter(b => {
        const dStart = new Date(b.start_time);
        const dEnd = new Date(b.end_time);

        // Ensure currentDate is start of day for comparison
        const checkDateStart = new Date(currentDate);
        checkDateStart.setHours(0, 0, 0, 0);

        const checkDateEnd = new Date(currentDate);
        checkDateEnd.setHours(23, 59, 59, 999);

        // Booking falls overlapping the current checking day
        return dEnd >= checkDateStart && dStart <= checkDateEnd;
    });

    // Sort by start time for timeline
    dayBookings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative min-h-screen pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-crrfas-light tracking-tight">Campus Calendar</h1>
                    <p className="text-crrfas-muted">View scheduled events, classes, and facility bookings across the tenant.</p>
                </div>

                <div className="flex bg-crrfas-surface p-1 flex-wrap gap-2 items-center rounded-lg border border-crrfas-surface/50">
                    <Filter className="w-4 h-4 text-crrfas-muted ml-2" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-transparent border-none text-sm text-crrfas-light focus:ring-0 outline-none w-auto pr-8"
                    >
                        <option value="approved_pending">Approved & Pending</option>
                        <option value="approved">Approved Only</option>
                        <option value="all">All Statuses</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                {/* Header Controls */}
                <div className="bg-crrfas-surface/30 p-4 border-b border-crrfas-surface/50 flex justify-between items-center">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-crrfas-bg rounded-lg transition-colors border-2 border-transparent hover:border-crrfas-surface">
                        <ChevronLeft className="w-5 h-5 text-crrfas-light" />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="text-xl font-bold flex items-center gap-2 text-crrfas-cyan">
                            <CalendarIcon className="w-5 h-5" />
                            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <button onClick={() => setCurrentDate(new Date())} className="text-xs text-crrfas-muted hover:text-crrfas-light mt-1 uppercase tracking-wider font-semibold">
                            Today
                        </button>
                    </div>

                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-crrfas-bg rounded-lg transition-colors border-2 border-transparent hover:border-crrfas-surface">
                        <ChevronRight className="w-5 h-5 text-crrfas-light" />
                    </button>
                </div>

                {/* Timeline Body */}
                <div className="p-6 relative">
                    {loading ? (
                        <div className="py-20 text-center text-crrfas-cyan animate-pulse">Syncing calendar data...</div>
                    ) : dayBookings.length === 0 ? (
                        <div className="py-20 text-center text-crrfas-muted">
                            <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                            <p className="text-lg">No active facility bookings found for this date.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-crrfas-surface before:to-transparent">

                            {dayBookings.map((req) => {
                                const sTime = new Date(req.start_time);
                                const eTime = new Date(req.end_time);
                                const isApproved = req.status === 'approved';
                                const isPending = req.status === 'pending';

                                return (
                                    <div key={req.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-crrfas-surface bg-crrfas-bg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                            <div className={`w-3 h-3 rounded-full ${isApproved ? 'bg-green-400' : isPending ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
                                        </div>

                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel border border-crrfas-surface/50 p-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 hover:border-crrfas-cyan/30">
                                            <div className="flex items-center justify-between mb-1">
                                                <time className={`font-mono text-sm font-bold ${isApproved ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {sTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  — {eTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </time>
                                                <span className="text-xs font-semibold text-crrfas-muted bg-crrfas-bg px-2 py-0.5 rounded capitalize">
                                                    {req.booking_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="text-crrfas-light font-bold text-lg mb-1">{req.title}</div>
                                            <div className="text-sm text-crrfas-muted flex flex-col gap-1">
                                                <span>Location: <strong className="text-crrfas-light">
                                                    {req.room ? `Room #${req.room}` : req.resource ? `Resource #${req.resource}` : `Sub-Unit #${req.sub_unit}`}
                                                </strong></span>
                                                <span className="text-xs opacity-75 mt-1">Ref: {req.booking_ref}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
