import { useEffect, useState } from 'react';
import { MapPin, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../utils/supabase';

type ReportStatus = 'Pending' | 'In Review' | 'Resolved';

type Report = {
  id: string;
  status: ReportStatus | null;
  image_url: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'All'>('All');

  // Fetch all reports for administration
  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin reports:', error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Update status directly in Supabase database
  const handleStatusChange = async (id: string, newStatus: ReportStatus) => {
    setUpdatingId(id);

    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Failed to update status in database: ' + error.message);
    } else {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    }

    setUpdatingId(null);
  };

  // Helper for dynamic status select box colors
  const getSelectBadgeClass = (status: ReportStatus | null): string => {
    switch (status) {
      case 'In Review':
        return 'bg-blue-50 text-blue-900 border-blue-300 focus:border-blue-600';
      case 'Pending':
        return 'bg-amber-50 text-amber-900 border-amber-300 focus:border-amber-600';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:border-emerald-600';
      default:
        return 'bg-[#F7F5EE] text-[#111814] border-[#E1DDCF] focus:border-[#00684A]';
    }
  };

  // Filtered dataset
  const filteredReports = filterStatus === 'All'
    ? reports
    : reports.filter((r) => r.status === filterStatus);

  // Calculated Metrics
  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    inReview: reports.filter((r) => r.status === 'In Review').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
  };

  return (
    <div className="min-h-screen bg-[#FBF9F3] text-[#1E2923] p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-[#00684A] uppercase block mb-1">
              CITY ADMIN CONSOLE
            </span>
            <h1 className="text-3xl font-extrabold text-[#111814]">Reports Management</h1>
          </div>
          <button
            onClick={fetchReports}
            className="text-xs font-semibold bg-[#EFECE3] hover:bg-[#E5E1D5] text-[#111814] px-4 py-2.5 rounded-xl transition-all"
          >
            Refresh Data
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#EBE8DF]">
            <p className="text-xs font-semibold text-[#5C6A60] mb-1">Total Signals</p>
            <p className="text-2xl font-bold text-[#111814]">{stats.total}</p>
          </div>
          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/60">
            <p className="text-xs font-semibold text-amber-800 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
          </div>
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200/60">
            <p className="text-xs font-semibold text-blue-800 mb-1">In Review</p>
            <p className="text-2xl font-bold text-blue-900">{stats.inReview}</p>
          </div>
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/60">
            <p className="text-xs font-semibold text-emerald-800 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-emerald-900">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(['All', 'Pending', 'In Review', 'Resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                filterStatus === status
                  ? 'bg-[#00684A] text-white shadow-sm'
                  : 'bg-white text-[#5C6A60] border border-[#EBE8DF] hover:bg-[#F7F5EE]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Reports Table / List */}
        {loading ? (
          <div className="flex justify-center p-12 bg-white rounded-2xl border border-[#EBE8DF]">
            <Loader2 className="w-6 h-6 animate-spin text-[#00684A]" />
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="bg-white rounded-2xl border border-[#EBE8DF] overflow-hidden shadow-xs">
            <div className="divide-y divide-[#F4F1E8]">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:bg-[#FAF9F5] transition-colors">
                  
                  {/* Left: Thumbnail + Details */}
                  <div className="flex items-start gap-4 flex-1">
                    {report.image_url ? (
                      <a href={report.image_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                        <img src={report.image_url} alt="Issue" className="w-full h-full object-cover" />
                      </a>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#F7F5EE] border border-[#EBE8DF] flex items-center justify-center text-[#8A988E] shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#EFECE3] text-[#2D3931] text-[11px] font-semibold px-2 py-0.5 rounded">
                          {report.category || 'General'}
                        </span>
                        {report.latitude && report.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#00684A] hover:underline flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Location</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm font-medium text-[#111814]">{report.description || 'No description'}</p>
                      <p className="text-xs text-[#8A988E]">{new Date(report.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Right: Status Selector */}
                  <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#F4F1E8]">
                    <span className="text-xs font-semibold text-[#5C6A60] md:hidden">Status:</span>
                    
                    <div className="relative flex items-center">
                      {updatingId === report.id && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00684A] absolute left-2.5 pointer-events-none" />
                      )}
                      <select
                        disabled={updatingId === report.id}
                        value={report.status || 'Pending'}
                        onChange={(e) => handleStatusChange(report.id, e.target.value as ReportStatus)}
                        className={`border rounded-xl text-xs font-semibold px-3 py-2 transition-all cursor-pointer focus:outline-none disabled:opacity-50 ${
                          updatingId === report.id ? 'pl-8' : ''
                        } ${getSelectBadgeClass(report.status)}`}
                      >
                        <option value="Pending" className="bg-white text-gray-900">Pending</option>
                        <option value="In Review" className="bg-white text-gray-900">In Review</option>
                        <option value="Resolved" className="bg-white text-gray-900">Resolved</option>
                      </select>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-2xl border border-[#EBE8DF]">
            <p className="text-sm text-[#5C6A60]">No reports match the selected status filter.</p>
          </div>
        )}

      </div>
    </div>
  );
}