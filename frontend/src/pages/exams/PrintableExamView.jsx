import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';

const PrintableExamView = () => {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrintableData();
  }, [sessionId]);

  const fetchPrintableData = async () => {
    try {
      // The backend returns an array of allocations for the session
      const res = await axiosInstance.get(ENDPOINTS.exams.printableSeating(sessionId));
      setData(res.data);
    } catch (error) {
      console.error('Error fetching seating map:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8">Loading print view...</div>;
  if (!data || data.length === 0) return <div className="p-8 text-red-500">No seating data found for this session.</div>;

  return (
    <div className="bg-white min-h-screen text-black">
      {/* Hide controls when printing */}
      <div className="print:hidden p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Seating Plan Preview</h1>
          <p className="text-sm text-slate-500">Press print to generate physical handouts</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl shadow-sm"
        >
          Print Charts
        </button>
      </div>

      <div className="p-8 space-y-12">
        {data.map((hallMap, idx) => (
          <div key={idx} className="page-break-after-always">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold underline">Exam Seating Chart</h2>
              <h3 className="text-xl mt-2">Hall: {hallMap.hall} (Capacity: {hallMap.capacity})</h3>
            </div>
            
            {/* Simple Grid Layout for Seats */}
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
              {hallMap.seats.map(seat => (
                <div key={seat.seatNo} className="border-2 border-slate-800 p-3 text-center rounded-lg">
                  <div className="text-xs text-slate-500 font-bold mb-1">Seat {seat.seatNo}</div>
                  <div className="text-lg font-mono font-bold leading-tight">{seat.rollNo}</div>
                  <div className="text-sm mt-1 border-t border-slate-300 pt-1">{seat.course}</div>
                </div>
              ))}
            </div>
            
            {hallMap.seats.length === 0 && (
              <div className="text-center italic text-slate-500 mt-8">No students seated in this hall.</div>
            )}
            
            <div className="mt-12 flex justify-between px-12">
              <div className="text-center border-t border-black pt-2 w-48">Invigilator Signature</div>
              <div className="text-center border-t border-black pt-2 w-48">Chief Superintendent</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintableExamView;
