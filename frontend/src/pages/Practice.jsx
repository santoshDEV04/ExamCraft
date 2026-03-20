import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Zap, Sparkles, ChevronRight,
  Layers, Brain, Plus, X, PenLine, Search,
} from 'lucide-react';

/* ─── Data ─── */
const subjects = [
  { id: 'math',    name: 'Mathematics',     icon: '📐', topics: ['Integration','Differentiation','Algebra','Probability','Trigonometry'] },
  { id: 'physics', name: 'Physics',          icon: '⚡', topics: ['Mechanics','Thermodynamics','Optics','Electromagnetism','Waves'] },
  { id: 'cs',      name: 'Computer Science', icon: '💻', topics: ['Data Structures','Algorithms','DBMS','OS','Networks'] },
  { id: 'chem',    name: 'Chemistry',        icon: '🧪', topics: ['Organic','Inorganic','Physical','Analytical'] },
];

const difficulties = [
  { value: 'easy',         label: 'Basic',       desc: 'Fundamental concepts — build a strong foundation.', color: '#2ECC71', icon: BookOpen },
  { value: 'intermediate', label: 'Intermediate', desc: 'Apply knowledge and deepen understanding.',          color: '#F39C12', icon: Brain   },
  { value: 'hard',         label: 'Advanced',     desc: 'Complex problem solving — master topics.',           color: '#E74C3C', icon: Zap     },
];

/* ─── Component ─── */
const Practice = () => {
  const navigate = useNavigate();

  const [step,            setStep]            = useState('topic'); // topic | difficulty
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic,   setSelectedTopic]   = useState('');
  const [customInput,     setCustomInput]     = useState('');
  const [filterQuery,     setFilterQuery]     = useState('');

  const inputRef = useRef(null);

  const resetToTopic = () => {
    setStep('topic');
    setSelectedSubject(null);
    setSelectedTopic('');
    setCustomInput('');
    setFilterQuery('');
  };

  const handleTopicSelect = (subject, topic) => {
    setSelectedSubject(subject);
    setSelectedTopic(topic);
    setStep('difficulty');
  };

  const handleCustomSubmit = () => {
    const t = customInput.trim();
    if (!t) return;
    handleTopicSelect({ name: 'Custom', id: 'custom', icon: '✨' }, t);
    setCustomInput('');
  };

  /* When difficulty is chosen → hand off to upload-material for
     the full practice+solution workflow (questions, timer, submit, results) */
  const handleDifficultySelect = (diff) => {
    navigate('/upload-material', {
      state: { skipToQuestions: true, topic: selectedTopic, difficulty: diff },
    });
  };

  const filteredSubjects = subjects
    .map(s => ({
      ...s,
      topics: s.topics.filter(t =>
        !filterQuery || t.toLowerCase().includes(filterQuery.toLowerCase())
      ),
    }))
    .filter(s =>
      !filterQuery ||
      s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      s.topics.length > 0
    );

  const hasAnyTopics = filteredSubjects.some(s => s.topics.length > 0);

  /* ── render ── */
  return (
    <div className="page-container">
      <AnimatePresence mode="wait">

        {/* ══════════════════════════
            STEP 1 — Topic Selection
        ══════════════════════════ */}
        {step === 'topic' && (
          <motion.div key="topic"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>

            {/* Header */}
            <div className="text-center mb-7 sm:mb-10 px-2">
              <motion.h1
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-4xl lg:text-5xl font-bold text-silk font-[var(--font-display)] mb-3 leading-tight">
                Which topic do you want to
                <br className="hidden sm:block" />
                {' '}<span className="text-gradient-gold">practice now?</span>
              </motion.h1>
              <p className="text-silver-200 text-xs sm:text-sm">
                Choose a predefined topic or type your own
              </p>
            </div>

            {/* ── Custom topic input ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="max-w-2xl mx-auto mb-6 sm:mb-8 px-1">
              <div className="glass-card p-3 sm:p-4 border border-gold/25 hover:border-gold/45 transition-all shadow-[0_8px_32px_rgba(201,168,76,0.07)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                    <PenLine size={15} className="text-gold" />
                  </div>
                  <p className="text-xs font-bold text-gold uppercase tracking-[0.15em]">Custom Topic</p>
                </div>
                <div className="relative mb-3">
                  <input ref={inputRef} type="text" value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
                    placeholder="e.g. Machine Learning, Thermodynamics, Black Holes…"
                    className="w-full bg-dark-200/60 border border-white/8 rounded-xl px-4 py-3 text-silk text-sm placeholder-silver-200/30 outline-none focus:border-gold/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.10)] transition-all pr-8"
                    id="custom-topic-input" />
                  {customInput && (
                    <button onClick={() => setCustomInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-200/40 hover:text-silver-200 transition-colors p-0.5">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button onClick={handleCustomSubmit} disabled={!customInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gold text-dark font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold/90 active:scale-[0.98] transition-all"
                  id="custom-topic-submit">
                  <Plus size={15} /> Start Practice
                </button>
                <p className="text-center text-[10px] text-silver-200/40 mt-2.5">
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">Enter</kbd>
                  {' '}or click <strong className="text-gold">Start Practice</strong>
                </p>
              </div>
            </motion.div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 max-w-2xl mx-auto mb-5 px-1">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] sm:text-xs text-silver-200/35 uppercase tracking-widest font-semibold whitespace-nowrap">
                or browse subjects
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* ── Filter bar ── */}
            <div className="max-w-2xl mx-auto mb-4 sm:mb-5 px-1">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-dark-100/60 border border-white/5 backdrop-blur">
                <Search size={14} className="text-silver-200/35 shrink-0" />
                <input type="text" value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Filter topics…"
                  className="flex-1 bg-transparent text-sm text-silk placeholder-silver-200/30 outline-none min-w-0"
                  id="topic-filter-input" />
                {filterQuery && (
                  <button onClick={() => setFilterQuery('')}
                    className="text-silver-200/40 hover:text-silver-200 transition-colors shrink-0">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Subject grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto pb-10 px-1">
              {hasAnyTopics ? (
                filteredSubjects.filter(s => s.topics.length > 0).map((subject, si) => (
                  <motion.div key={subject.id}
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.07 }}
                    className="glass-card p-4 sm:p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 sm:mb-5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl sm:text-2xl border border-white/5 shrink-0">
                        {subject.icon}
                      </div>
                      <h3 className="text-base sm:text-xl font-bold text-silk font-[var(--font-display)]">
                        {subject.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {subject.topics.map(topic => (
                        <button key={topic} onClick={() => handleTopicSelect(subject, topic)}
                          className="text-left p-2.5 sm:p-3.5 rounded-xl bg-dark-200/50 hover:bg-gold/10 border border-white/5 hover:border-gold/30 transition-all text-xs sm:text-sm text-silver-200 hover:text-silk group flex items-center justify-between gap-1 active:scale-95"
                          id={`topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}>
                          <span className="flex items-center gap-2 truncate">
                            <Layers size={11} className="text-gold/40 group-hover:text-gold transition-colors shrink-0" />
                            <span className="truncate">{topic}</span>
                          </span>
                          <ChevronRight size={11} className="opacity-0 group-hover:opacity-40 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center px-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Search size={26} className="text-silver-200 opacity-20" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-silk mb-2 font-[var(--font-display)]">
                    No matching topics
                  </h3>
                  <p className="text-silver-200 text-sm max-w-xs mx-auto">
                    Type your topic above and tap <strong className="text-gold">Start Practice</strong>.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════
            STEP 2 — Difficulty
        ══════════════════════════ */}
        {step === 'difficulty' && (
          <motion.div key="difficulty"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>

            {/* Context badge */}
            <div className="text-center mb-8 sm:mb-10 px-2">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 mb-4 px-3 sm:px-4 py-2 rounded-full bg-gold/10 border border-gold/20 max-w-full">
                <span className="text-lg">{selectedSubject?.icon}</span>
                <span className="text-xs sm:text-sm font-bold text-gold truncate">{selectedSubject?.name}</span>
                <span className="text-silver-200/40 mx-0.5">•</span>
                <span className="text-xs sm:text-sm text-silk font-semibold truncate max-w-[140px] sm:max-w-none">{selectedTopic}</span>
              </motion.div>
              <h2 className="text-xl sm:text-3xl font-bold text-silk font-[var(--font-display)] mb-2">
                Select Difficulty Level
              </h2>
              <p className="text-silver-200 text-xs sm:text-sm">
                Choose your comfort level — AI will generate matching questions
              </p>
            </div>

            {/* Difficulty cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 max-w-3xl mx-auto px-1">
              {difficulties.map((d, i) => {
                const DIcon = d.icon;
                return (
                  <motion.button key={d.value}
                    initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.11 }}
                    whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleDifficultySelect(d.value)}
                    className="glass-card p-4 sm:p-6 group cursor-pointer border border-transparent hover:border-gold/30 transition-all flex sm:flex-col items-center gap-4 sm:gap-0 text-left sm:text-center"
                    id={`difficulty-${d.value}`}>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 sm:mx-auto rounded-2xl flex items-center justify-center shrink-0 sm:mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${d.color}18` }}>
                      <DIcon size={22} style={{ color: d.color }} />
                    </div>
                    <div className="flex-1 sm:flex-none">
                      <h3 className="text-base sm:text-lg font-bold text-silk font-[var(--font-display)] group-hover:text-gold transition-colors sm:mb-1.5">
                        {d.label}
                      </h3>
                      <p className="text-xs text-silver-200/70 leading-relaxed">{d.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-silver-200/20 group-hover:text-gold sm:hidden shrink-0" />
                    <div className="mt-4 py-2 rounded-lg bg-dark-300 group-hover:bg-gold group-hover:text-dark transition-all w-full hidden sm:block">
                      <span className="text-sm font-semibold">Select</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Info note */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="max-w-3xl mx-auto mt-5 px-1">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gold/5 border border-gold/15">
                <Sparkles size={14} className="text-gold shrink-0 mt-0.5" />
                <p className="text-xs text-silver-200/70 leading-relaxed">
                  After selecting difficulty, you'll be taken to the <strong className="text-gold">full practice workspace</strong> — AI generates questions, you solve them, upload your answer, and get instant feedback & ranking.
                </p>
              </div>
            </motion.div>

            <div className="text-center mt-5 sm:mt-6">
              <button onClick={resetToTopic}
                className="text-sm text-silver-200 hover:text-gold transition-colors">
                ← Back to topic selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Practice;
