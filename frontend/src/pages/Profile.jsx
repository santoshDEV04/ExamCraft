import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import {
  User,
  Mail,
  BookOpen,
  Target,
  Edit3,
  Save,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Calendar,
  Award,
  Loader2,
  Camera,
  Shield,
  Bell,
  Globe,
  ArrowLeft,
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    branch: user?.branch || '',
    exam_target: user?.exam_target || '',
    subjects: user?.subjects?.join(', ') || '',
    bio: user?.bio || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepared for actual API call
      // const response = await api.put('/auth/profile', { ...formData, subjects: formData.subjects.split(',').map(s => s.trim()) });
      // updateUser?.(response.data.user);
      
      // Temporary state update for UI feedback during dev
      updateUser?.({ ...user, ...formData, subjects: formData.subjects.split(',').map((s) => s.trim()) });
      setEditing(false);
    } catch (error) {
      console.error("Profile update failed", error);
    } finally {
      setLoading(false);
    }
  };



  const profileStats = [
    { label: 'Questions Solved', value: '0', icon: BookOpen },
    { label: 'Average Score', value: '0%', icon: Target },
    { label: 'Days Active', value: '1', icon: Calendar },
    { label: 'Achievements', value: '0', icon: Award },
  ];

  return (
    <div className="page-container max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-silver-200 hover:text-gold transition-all mb-4 group px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-gold/30"
          id="back-to-home-profile"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-semibold uppercase tracking-wider">Back to Home</span>
        </Link>
        {/* Profile Header Card */}
        <div className="glass-card p-6 sm:p-8 mb-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent" />
          <div className="absolute top-10 right-10 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-dark text-3xl sm:text-4xl font-bold font-[var(--font-display)] shadow-lg shadow-gold/20">
                {getInitials(formData.name)}
              </div>
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-xl bg-dark-300 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" id="change-avatar-btn">
                <Camera size={14} className="text-silk" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-silk font-[var(--font-display)] mb-1">
                {formData.name}
              </h1>
              <p className="text-sm text-silver-200 mb-1">{formData.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                  <GraduationCap size={10} className="inline mr-1" />
                  {formData.branch}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-info/10 text-info border border-info/20">
                  <Target size={10} className="inline mr-1" />
                  {formData.exam_target}
                </span>
              </div>
              {formData.bio && (
                <p className="text-sm text-dark-700 mt-3 max-w-md">{formData.bio}</p>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setEditing(!editing)}
              className={`${editing ? 'btn-dark' : 'btn-outline-gold'} text-sm py-2 px-4 flex items-center gap-2 shrink-0`}
              id="edit-profile-btn"
            >
              <Edit3 size={14} />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 relative">
            {profileStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="text-center p-3 rounded-xl bg-dark-200/50"
                >
                  <Icon size={18} className="text-gold mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-silk font-[var(--font-display)]">{stat.value}</p>
                  <p className="text-[11px] text-dark-700">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-silk font-[var(--font-display)] mb-5">
              Edit Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver mb-2" htmlFor="profile-name">
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-700" />
                  <input
                    type="text"
                    id="profile-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-dark pl-11"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-silver mb-2" htmlFor="profile-email">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-700" />
                  <input
                    type="email"
                    id="profile-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-dark pl-11"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-silver mb-2" htmlFor="profile-branch">
                  Branch
                </label>
                <input
                  type="text"
                  id="profile-branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver mb-2" htmlFor="profile-exam-target">
                  Exam Target
                </label>
                <input
                  type="text"
                  id="profile-exam-target"
                  name="exam_target"
                  value={formData.exam_target}
                  onChange={handleChange}
                  className="input-dark"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-silver mb-2" htmlFor="profile-subjects">
                  Subjects
                </label>
                <input
                  type="text"
                  id="profile-subjects"
                  name="subjects"
                  value={formData.subjects}
                  onChange={handleChange}
                  placeholder="Comma separated subjects"
                  className="input-dark"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-silver mb-2" htmlFor="profile-bio">
                  Bio
                </label>
                <textarea
                  id="profile-bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  className="input-dark resize-none"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSave}
              disabled={loading}
              className="btn-gold mt-5 py-3 px-8 flex items-center gap-2"
              id="save-profile-btn"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </motion.button>
          </motion.div>
        )}



          {/* Preferences */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell size={18} className="text-gold" />
              <h2 className="text-lg font-semibold text-silk font-[var(--font-display)]">Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Get practice reminders', checked: true },
                { label: 'Performance Alerts', desc: 'Weak topic notifications', checked: true },
                { label: 'Study Reminders', desc: 'Daily study plan alerts', checked: false },
                { label: 'Public Profile', desc: 'Show stats on leaderboard', checked: false },
              ].map((pref, i) => (
                <label key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-silk">{pref.label}</p>
                    <p className="text-xs text-dark-700">{pref.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={pref.checked}
                    className="w-5 h-5 rounded accent-[#C9A84C] bg-dark-300 border-dark-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default Profile;
