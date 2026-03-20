import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History, Search, Filter, BookOpen, Clock, ChevronRight, 
  Trash2, PlayCircle, CheckCircle, AlertCircle, BarChart2,
  Calendar, Layers, Target, Loader2, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import sessionService from '../services/sessionService';

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    fetchSessions();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchSessions, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await sessionService.getAllSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await sessionService.deleteSession(id);
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const filtered = sessions.filter(s => {
    const matchesSearch = s.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || s.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const getDifficultyColor = (diff) => {
    switch(diff?.toLowerCase()){
      case 'hard': return '#E74C3C';
      case 'intermediate': return '#F39C12';
      default: return '#2ECC71';
    }
  };

  return (
    <div className="page-container max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3">
            <History size={14} className="text-gold" />
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Learning History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-silk font-[var(--font-display)]">Practice Sessions</h1>
          <p className="text-silver-200/60 text-xs sm:text-sm mt-1">Review your results or resume incomplete practice sets.</p>
        </div>
        
        <div className="flex bg-dark-200 border border-white/5 rounded-2xl p-1 gap-1">
          {['all', 'active', 'completed'].map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all
                ${filterType === type ? 'bg-gold text-dark' : 'text-silver-200 hover:text-silk'}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-200/30 group-focus-within:text-gold transition-colors" size={18} />
        <input 
          type="text"
          placeholder="Search by topic, keyword, or material..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-dark-200/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-silk text-sm focus:outline-none focus:border-gold/30 transition-all placeholder-silver-200/20"
        />
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
           <Loader2 size={40} className="animate-spin text-gold mb-4" />
           <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Loading Your Progress...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((s, i) => (
              <motion.div 
                key={s._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card hover:border-gold/25 transition-all group overflow-hidden border border-white/5 p-4 sm:p-5 flex flex-col h-full"
              >
                {/* Session Header */}
                <div className="flex flex-col xs:flex-row justify-between items-start gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                      <Layers size={20} className="text-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-silk font-bold text-sm sm:text-base leading-tight group-hover:text-gold transition-colors truncate">
                        {s.topic}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-silver-200/40 uppercase tracking-widest">{new Date(s.createdAt).toLocaleDateString()}</span>
                        <div className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: getDifficultyColor(s.difficulty) }}>{s.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border shrink-0
                    ${s.status === 'active' ? 'bg-info/10 text-info border-info/20' : 'bg-success/10 text-success border-success/20'}`}>
                    {s.status}
                  </div>
                </div>

                {/* Progress Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-silver-200/50 font-bold uppercase tracking-widest">Overall Accuracy</span>
                    <span className="text-xs font-bold text-silk">
                      {Math.round(((s.solvedQuestions?.length || 0) / (s.totalQuestions || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-dark-300 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((s.solvedQuestions?.length || 0) / (s.totalQuestions || 1)) * 100}%` }}
                      className="h-full bg-gold shadow-[0_0_10px_rgba(201,168,76,0.3)]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
                    <div className="bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/5">
                      <p className="text-[8px] sm:text-[9px] text-silver-200/40 font-bold uppercase tracking-wider mb-1">Solved</p>
                      <p className="text-[10px] sm:text-xs font-bold text-silk">
                        {s.solvedQuestions?.length || 0} / {s.totalQuestions}
                      </p>
                    </div>
                    <div className="bg-white/5 p-2 sm:p-2.5 rounded-xl border border-white/5">
                      <p className="text-[8px] sm:text-[9px] text-silver-200/40 font-bold uppercase tracking-wider mb-1">Total Submits</p>
                      <p className="text-[10px] sm:text-xs font-bold text-silk">{s.submissions?.length || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col xs:flex-row gap-2 mt-auto">
                  <button 
                    onClick={() => navigate('/upload-material', { state: { sessionId: s._id, resume: true } })}
                    className="flex-1 btn-gold py-2 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 text-[10px] xs:text-xs group/btn active:scale-95 transition-all order-1 xs:order-none"
                  >
                    {(s.status === 'completed' && s.submissions?.length === s.totalQuestions) ? (
                      <><BarChart2 size={14} /> View Details</>
                    ) : (
                      <><PlayCircle size={14} className="group-hover/btn:rotate-12 transition-transform" /> Resume</>
                    )}
                  </button>
                  <button 
                    onClick={(e) => handleDelete(s._id, e)}
                    className="p-2 sm:p-2.5 rounded-xl bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white transition-all active:scale-90 flex items-center justify-center order-2 xs:order-none"
                    title="Delete Session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {/* Bottom spacer to prevent overlap with floating button */}
          <div className="h-20 sm:hidden" />
        </div>
      ) : (
        <div className="glass-card p-12 text-center border border-dashed border-white/5 bg-transparent">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap size={28} className="text-silver-200/20" />
          </div>
          <h3 className="text-silver-200 font-bold text-lg mb-2">No sessions found</h3>
          <p className="text-silver-200/40 text-sm mb-6 max-w-xs mx-auto">Start your learning journey by uploading study materials.</p>
          <Link to="/upload-material" className="btn-gold px-8 py-3 rounded-2xl text-sm inline-flex items-center gap-2">
            Start New Session <ArrowRight size={14} />
          </Link>
        </div>
      )}

    </div>
  );
}
