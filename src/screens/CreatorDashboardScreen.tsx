import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { getCreatorStats } from '../lib/mock/mockServices';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';

export default function CreatorDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      if (FEATURE_FLAGS.MOCK_MODE) {
        setStats(await getCreatorStats());
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 overflow-y-auto no-scrollbar bg-black">
      <header className="px-4 pb-4 border-b border-white/5 sticky top-0 bg-skrim-bg/90 backdrop-blur-md z-40">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Creator Hub</h1>
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {['Overview', 'Audience', 'Monetization'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`text-sm font-medium pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-neon-blue text-white' : 'border-transparent text-gray-500'}`}>
               {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 flex flex-col gap-6">
        {loading || !stats ? (
             <div className="flex items-center justify-center p-8"><div className="w-6 h-6 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-skrim-surface p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 text-gray-400 mb-2"><BarChart3 className="w-4 h-4"/> <span className="text-xs uppercase font-bold tracking-wider">Views</span></div>
                <div className="text-2xl font-bold">{stats.totalViews}</div>
                <div className="text-[10px] text-green-400 mt-1">+12% this week</div>
              </div>
              <div className="bg-skrim-surface p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 text-gray-400 mb-2"><TrendingUp className="w-4 h-4"/> <span className="text-xs uppercase font-bold tracking-wider">Followers</span></div>
                <div className="text-2xl font-bold">{stats.followersGrowth}</div>
                <div className="text-[10px] text-green-400 mt-1">+5.2% this week</div>
              </div>
            </div>

            <div className="bg-skrim-surface p-4 rounded-2xl border border-white/5 h-48 flex flex-col justify-end relative overflow-hidden">
               <h3 className="absolute top-4 left-4 text-xs font-bold uppercase text-gray-400">Activity Chart</h3>
               <div className="flex items-end gap-2 w-full h-24 mt-8 px-2 justify-between">
                 {stats.chartData.map((val: number, i: number) => (
                   <div key={i} className="w-8 bg-neon-blue rounded-t-sm opacity-80" style={{ height: `${val}%` }} />
                 ))}
               </div>
            </div>

            <div className="bg-gradient-to-tr from-neon-purple/20 to-transparent p-5 rounded-2xl border border-neon-purple/30">
               <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center mb-3">
                 <DollarSign className="w-5 h-5 text-neon-purple" />
               </div>
               <h3 className="font-bold text-lg mb-1">Monetization Active</h3>
               <p className="text-xs text-gray-300 mb-4">You are eligible for the Creator Fund and ad revenue sharing.</p>
               <button className="bg-neon-purple text-white font-bold text-xs px-4 py-2 rounded-xl shadow-neon-purple">Manage Payouts</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
