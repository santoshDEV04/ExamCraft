import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import {
  User,
  Mail,
  BookOpen,
  Target,
  GraduationCap,
  Calendar,
  Award,
  ArrowLeft,
  Briefcase,
  Layers,
  Camera,
  Check,
  X,
  Loader2,
  Edit2,
  Brain,
  Zap,
  Clock,
  Activity,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { compressImage } from '../utils/imageCompression';
import sessionService from '../services/sessionService';
import submissionService from '../services/submissionService';
import { Target as LucideTarget } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    branch: user?.branch || '',
    exam_target: user?.exam_target || '',
    subjects: user?.subjects?.join(', ') || '',
  });
  const [newAvatar, setNewAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setStatsLoading(true);
      const [sessionsRes, analyticsRes] = await Promise.all([
        sessionService.getAllSessions(),
        submissionService.getAnalytics()
      ]);
      setSessions(sessionsRes.data || []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      console.error("Failed to fetch profile stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Snappy preview first
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Compress in background
        const compressed = await compressImage(file, { maxWidth: 500, maxHeight: 500, quality: 0.8 });
        setNewAvatar(compressed);
      } catch (err) {
        console.error("Image compression failed", err);
        setNewAvatar(file); // Fallback to original
      }
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Prepare data for optimistic UI
    const optimisticUser = {
      ...user,
      name: formData.name,
      branch: formData.branch,
      exam_target: formData.exam_target,
      subjects: formData.subjects.split(',').map(s => s.trim()).filter(Boolean),
      avatar: avatarPreview // Use the preview as the new avatar optimistically
    };

    // Store original state for rollback
    const originalUser = { ...user };

    try {
      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('branch', formData.branch);
      formDataToSend.append('exam_target', formData.exam_target);
      formDataToSend.append('subjects', formData.subjects);
      
      if (newAvatar) {
        formDataToSend.append('avatar', newAvatar);
      }

      // Snappy UI: close editing immediately and show success "optimistically"
      setIsEditing(false);
      
      // Update via context with optimistic flag to avoid global loading state
      const promise = updateProfile(formDataToSend, true);
      
      // Show success snappy
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      await promise;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setIsEditing(true); 
    } finally {
      setLoading(false);
    }
  };

  const profileStats = [
    { label: 'Questions Solved', value: analytics?.totalAttempts?.toString() || '0', icon: BookOpen },
    { label: 'Overall Accuracy', value: `${analytics?.overallAccuracy || 0}%`, icon: LucideTarget },
    { label: 'Active Sessions', value: sessions.filter(s => s.status === 'active').length.toString(), icon: Zap },
    { label: 'Readiness Rank', value: analytics?.readinessIndex ? (analytics.readinessIndex >= 80 ? 'Elite' : analytics.readinessIndex >= 60 ? 'Pro' : 'Starter') : 'N/A', icon: Award },
  ];

  const formatUserValue = (val) => {
    if (!val || val.toLowerCase() === 'nan' || val.toLowerCase() === 'undefined') return 'Not Specified';
    return val;
  };

  return (
    <div className="page-container max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-silver-200 hover:text-gold transition-all mb-6 group px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-gold/30"
          id="back-to-home-profile"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold uppercase tracking-wider">Back to Home</span>
        </Link>

        {/* Profile Header Card */}
        <div className="glass-card p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent" />
          <div className="absolute top-10 right-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-dark text-3xl sm:text-4xl font-bold font-[var(--font-display)] shadow-lg shadow-gold/20 overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              {isEditing && (
                <label 
                  htmlFor="profile-avatar-upload"
                  className="absolute inset-0 bg-dark/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
                >
                  <Camera size={24} className="text-gold mb-1" />
                  <span className="text-[10px] font-bold text-silk uppercase">Change</span>
                </label>
              )}
              <input 
                type="file" 
                id="profile-avatar-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={!isEditing}
              />
            </div>

            <div className="flex-1 text-center sm:text-left pt-2">
              {isEditing ? (
                <div className="space-y-3 max-w-xs mx-auto sm:mx-0">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-dark py-1.5 px-3 text-lg font-bold"
                    placeholder="Full Name"
                  />
                  <p className="text-sm text-silver-300">{user?.email}</p>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-silk font-[var(--font-display)] mb-1">
                    {user?.name}
                  </h1>
                  <p className="text-sm text-silver-200 mb-1">{user?.email}</p>
                </>
              )}
              
              {!isEditing && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                    <GraduationCap size={10} className="inline mr-1" />
                    {formatUserValue(user?.branch)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-info/10 text-info border border-info/20">
                    <Target size={10} className="inline mr-1" />
                    {formatUserValue(user?.exam_target)}
                  </span>
                </div>
              )}
            </div>

            <div className="sm:ml-auto pt-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-silver-100 hover:bg-white/10 hover:border-gold/30 hover:text-gold transition-all text-sm font-semibold flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setAvatarPreview(user?.avatar);
                      setFormData({
                        name: user?.name || '',
                        branch: user?.branch || '',
                        exam_target: user?.exam_target || '',
                        subjects: user?.subjects?.join(', ') || '',
                      });
                    }}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-silver-200 hover:bg-danger/10 hover:text-danger transition-all"
                    title="Cancel"
                  >
                    <X size={20} />
                  </button>
                  <button
                    onClick={handleUpdateAccount}
                    disabled={loading}
                    className="p-2 rounded-xl bg-gold/10 border border-gold/20 text-gold hover:bg-gold hover:text-dark transition-all"
                    title="Save Changes"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 relative">
            {profileStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="text-center p-3 rounded-xl bg-dark-200/50 border border-white/5"
                >
                  <Icon size={18} className="text-gold mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-silk font-[var(--font-display)]">{stat.value}</p>
                  <p className="text-[11px] text-dark-700 font-medium uppercase truncate">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Learning Insights Section */}
        <div className="glass-card p-6 sm:p-8 mt-6">
          <h2 className="text-xl font-bold text-silk font-[var(--font-display)] mb-8 flex items-center gap-2 border-b border-white/5 pb-4">
            <Activity size={22} className="text-gold" />
            Learning Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Readiness Gauge */}
            <div className="bg-dark-200/50 rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-6">Exam Readiness</p>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={364.4}
                    initial={{ strokeDashoffset: 364.4 }}
                    animate={{ strokeDashoffset: 364.4 - (364.4 * (analytics?.readinessIndex || 0)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="text-gold"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-silk">{analytics?.readinessIndex || 0}%</span>
                  <span className="text-[8px] font-bold text-silver-200 uppercase tracking-widest mt-1">Ready</span>
                </div>
              </div>
              <p className="text-sm text-silver-200 mt-6 max-w-[200px]">
                {analytics?.readinessIndex >= 80 
                  ? "Outstanding! You're fully prepared for the exam." 
                  : analytics?.readinessIndex >= 50 
                  ? "On track. Focus on weak topics to reach 80%." 
                  : "Keep going! Upload more materials to boost readiness."}
              </p>
            </div>

            {/* Session Summary */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4">Activity Summary</p>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Check size={18} className="text-success" />
                    </div>
                    <div>
                      <p className="text-silk font-bold text-sm">Completed Sessions</p>
                      <p className="text-xs text-silver-200">{sessions.filter(s => s.status === 'completed').length} Sets Finished</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-silver-200/20" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                      <Clock size={18} className="text-info" />
                    </div>
                    <div>
                      <p className="text-silk font-bold text-sm">Active Sessions</p>
                      <p className="text-xs text-silver-200">{sessions.filter(s => s.status === 'active').length} Sets in Progress</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-silver-200/20" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Brain size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-silk font-bold text-sm">Topic Mastery</p>
                      <p className="text-xs text-silver-200">{analytics?.strongTopics?.length || 0} Strong Topics Found</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-silver-200/20" />
                </div>
              </div>
              
              <Link to="/analytics" className="btn-premium w-full mt-4 text-xs py-3 flex items-center justify-center gap-2">
                View Full Analysis <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Details — Read Only */}
        <div className="glass-card p-6 sm:p-8 mt-6">
          <h2 className="text-xl font-bold text-silk font-[var(--font-display)] mb-8 flex items-center gap-2 border-b border-white/5 pb-4">
            <User size={22} className="text-gold" />
            Overview
          </h2>
          
          <div className="space-y-8">
            {/* Academic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                   <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Briefcase size={14} />
                        Academic Branch
                    </h3>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.branch}
                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                        className="input-dark py-2 px-3 text-sm"
                        placeholder="e.g. Computer Science"
                      />
                    ) : (
                      <p className="text-silk font-medium pl-1">{formatUserValue(user?.branch)}</p>
                    )}
                </div>
                <div>
                    <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Target size={14} />
                        Active Goal
                    </h3>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.exam_target}
                        onChange={(e) => setFormData({...formData, exam_target: e.target.value})}
                        className="input-dark py-2 px-3 text-sm"
                        placeholder="e.g. GATE 2025"
                      />
                    ) : (
                      <p className="text-silk font-medium pl-1">{formatUserValue(user?.exam_target)}</p>
                    )}
                </div>
            </div>

            {/* Subjects Section */}
            <div>
                <h3 className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Layers size={14} />
                    Enrolled Subjects
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                    className="input-dark py-2 px-3 text-sm w-full"
                    placeholder="Mathematics, Physics, etc."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                      {user?.subjects && user.subjects.length > 0 ? (
                          user.subjects.map((subject, index) => (
                              <motion.span
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-silk text-sm font-medium hover:border-gold/30 hover:bg-white/10 transition-all"
                              >
                                  {subject}
                              </motion.span>
                          ))
                      ) : (
                          <p className="text-dark-700 italic">No subjects listed.</p>
                      )}
                  </div>
                )}
            </div>

            {/* Notifications */}
            {error && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
                <Check size={16} />
                Profile updated successfully!
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
