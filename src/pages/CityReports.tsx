import { MapPin, Clock, Plus, ExternalLink, Image as ImageIcon, ArrowLeft, Lock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReportModal from "../mod/RepotModal";
import AdminDashboard from "./AdminDashboard";
import { supabase } from '../utils/supabase';

export default function CityReportsPage() {
  const reportsPerPage = 7;
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Secret Easter Egg Admin & Auth State
  const [clickCount, setClickCount] = useState<number>(0);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const totalPages = Math.ceil(totalReports / reportsPerPage);

  // Fetch one page of reports while keeping the total count for pagination.
  const fetchReports = async (page: number = currentPage) => {
    setLoading(true);
    const start = (page - 1) * reportsPerPage;
    const end = start + reportsPerPage - 1;
    const { data, error, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data || []);
      setTotalReports(count ?? 0);
      setCurrentPage(page);
    }
    setLoading(false);
  };

  // Check existing session on load
  useEffect(() => {
    fetchReports();

    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAdmin(true);
      }
    }
    checkSession();
  }, []);

  // Handle secret 7-click trigger on MapPin button to show Login Modal
  const handleMapPinClick = () => {
    if (isAdmin) return;
    const nextCount = clickCount + 1;
    if (nextCount >= 7) {
      setIsLoginOpen(true);
      setClickCount(0);
    } else {
      setClickCount(nextCount);
    }
  };

  // Authenticate Admin Credentials against Supabase
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('Invalid admin credentials.');
    } else {
      setIsAdmin(true);
      setIsLoginOpen(false);
      setPassword('');
    }
    setAuthLoading(false);
  };

  // Handle Sign Out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  const getStatusBadgeClass = (status: string | undefined): string => {
    switch (status) {
      case 'In Review':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper to format ISO timestamps
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render Admin Dashboard when authenticated
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBF9F3]">
        <div className="bg-[#111814] text-white px-4 py-2.5 flex justify-between items-center text-xs sticky top-0 z-50 shadow-md">
          <span className="font-medium tracking-wide">
            Authenticated as <strong className="text-[#00684A]">Admin</strong>
          </span>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-white font-semibold active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit / Sign Out</span>
          </button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F3] text-[#1E2923] font-sans px-4 py-8 md:py-12 relative">
      <div className="max-w-2xl mx-auto">
        
        {/* Top Header */}
        <header className="mb-8 flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-[#00684A] uppercase block mb-1">
              CIVIC SIGNAL
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#111814] tracking-tight mb-2">
              City reports
            </h1>
            <p className="text-sm text-[#5C6A60]">
              See what your neighbors are reporting and help keep the city moving.
            </p>
          </div>

          <button 
            onClick={handleMapPinClick}
            aria-label="Map view"
            className="w-10 h-10 rounded-full bg-[#00684A] hover:bg-[#00523A] active:scale-90 text-white flex items-center justify-center transition-all shadow-sm shrink-0 select-none"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </header>

        {/* Feed Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#6B7970] uppercase block">
              LIVE FEED
            </span>
            <h2 className="text-lg font-bold text-[#111814]">Newest reports</h2>
          </div>
          <span className="text-xs font-semibold bg-[#EFECE3] text-[#4A574E] px-3 py-1 rounded-full">
            {totalReports} total
          </span>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center bg-white/60 rounded-2xl border border-[#EBE8DF]">
              <p className="text-sm text-[#5C6A60]">Loading latest city signals...</p>
            </div>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <article
                key={report.id}
                className="bg-white rounded-2xl p-4 md:p-5 border border-[#EBE8DF] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#DED9CB] transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  
                  {/* Thumbnail / Image Section */}
                  {report.image_url ? (
                    <a 
                      href={report.image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full sm:w-24 h-36 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 group relative block"
                    >
                      <img
                        src={report.image_url}
                        alt={report.category || 'Report image'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </a>
                  ) : (
                    <div className="w-full sm:w-24 h-20 sm:h-24 rounded-xl flex-shrink-0 bg-[#F7F5EE] border border-[#EBE8DF] flex flex-col items-center justify-center text-[#8A988E] gap-1">
                      <ImageIcon className="w-5 h-5 stroke-[1.5]" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">No photo</span>
                    </div>
                  )}

                  {/* Content Section */}
                  <div className="flex-1 w-full flex flex-col justify-between self-stretch">
                    <div>
                      {/* Category & Status Header Row */}
                      <div className="flex justify-between items-center gap-2 mb-2">
                        <span className="bg-[#EFECE3] text-[#2D3931] text-xs font-semibold px-2.5 py-0.5 rounded-md">
                          {report.category || 'General'}
                        </span>
                        
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                            report.status
                          )}`}
                        >
                          {report.status || 'Pending'}
                        </span>
                      </div>

                      {/* Title (if provided) */}
                      {report.title ? (
                        <h3 className="text-lg font-semibold text-[#111814] mb-1">{report.title}</h3>
                      ) : null}

                      {/* Description Body */}
                      <p className="text-sm font-normal text-[#111814] leading-relaxed mb-3">
                        {report.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Meta Info Footer (Location & Date) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F4F1E8] text-xs text-[#5C6A60]">
                      
                      {/* Location Coordinates / Map Link */}
                      {report.location_name ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            report.location_name
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#00684A] hover:underline font-medium"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{report.location_name}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : report.latitude && report.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#00684A] hover:underline font-medium"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-1 text-[#8A988E]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Location not specified</span>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-[#8A988E]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>

                    </div>
                  </div>

                </div>
              </article>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#EBE8DF]">
              <p className="text-sm text-[#5C6A60]">No reports logged yet. Be the first to signal an issue!</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#EBE8DF] pt-4">
            <button
              type="button"
              onClick={() => fetchReports(currentPage - 1)}
              disabled={loading || currentPage === 1}
              aria-label="Previous page"
              className="flex items-center gap-1 text-xs font-semibold text-[#00684A] disabled:text-[#A7B0A9] disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-xs font-semibold text-[#5C6A60]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => fetchReports(currentPage + 1)}
              disabled={loading || currentPage === totalPages}
              aria-label="Next page"
              className="flex items-center gap-1 text-xs font-semibold text-[#00684A] disabled:text-[#A7B0A9] disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}      
        aria-label="Add Report"
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#00684A] hover:bg-[#00523A] active:scale-95 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      <ReportModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchReports(1);
        }} 
      />

      {/* Secret Admin Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-[#EBE8DF] shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-[#00684A]">
              <Lock className="w-5 h-5" />
              <h2 className="text-lg font-bold text-[#111814]">Admin Access</h2>
            </div>
            <p className="text-xs text-[#5C6A60]">
              Enter owner credentials to manage incoming city reports.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#111814] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E1DDCF] bg-[#F7F5EE] focus:outline-none focus:border-[#00684A]"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111814] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E1DDCF] bg-[#F7F5EE] focus:outline-none focus:border-[#00684A]"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {authError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-[#EBE8DF] text-[#5C6A60] hover:bg-[#F7F5EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#00684A] text-white hover:bg-[#00523A] flex items-center gap-1.5"
                >
                  {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}