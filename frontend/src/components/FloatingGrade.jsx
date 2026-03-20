import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import submissionService from '../services/submissionService';

const FloatingGrade = () => {
    const [analytics, setAnalytics] = useState(null);
    const location = useLocation();

    // Don't show on login/register/landing if not authenticated
    // But caller will handle inclusion in AppLayout (protected)
    
    useEffect(() => {
        fetchAnalytics();
    }, [location.pathname]); // Refresh on route change

    const fetchAnalytics = async () => {
        try {
            const res = await submissionService.getAnalytics();
            setAnalytics(res.data);
        } catch (err) {
            console.error("Floating grade fetch failed", err);
        }
    };

    // ONLY SHOW ON HOME PAGE
    if (location.pathname !== '/' || !analytics) return null;

    return (
        <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            drag
            dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
            className="fixed bottom-24 right-8 z-50 cursor-grab active:cursor-grabbing hidden sm:block"
        >
            <div className="floating-grade-card p-4 flex flex-col items-center gap-1 group">
                <div className="grade-circle">
                    {analytics.overallAccuracy}%
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-silver-200 mt-2">Ready Status</p>
                <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(i => {
                        const filled = Math.ceil(analytics.readinessIndex / 20);
                        return (
                            <div 
                                key={i} 
                                className={`w-1.5 h-3 rounded-full border border-black ${i <= filled ? 'bg-gold' : 'bg-dark-300'}`} 
                            />
                        );
                    })}
                </div>
                <Link to="/analytics" className="mt-2 text-[8px] font-bold text-gold uppercase hover:underline">Analysis</Link>
            </div>
        </motion.div>
    );
};

export default FloatingGrade;
