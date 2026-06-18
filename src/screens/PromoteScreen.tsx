import React, { useState } from 'react';
import { Target, CreditCard, CheckCircle } from 'lucide-react';
import { mockPayment } from '../lib/mock/mockPayments';
import { FEATURE_FLAGS } from '../lib/config/featureFlags';

export default function PromoteScreen() {
  const [budget, setBudget] = useState(50);
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePromote = async () => {
    setLoading(true);
    setError('');
    try {
      if (FEATURE_FLAGS.MOCK_MODE) {
        const res = await mockPayment(budget * 100, `Promote campaign for ${duration} days`);
        if (res.success) {
           setSuccess(true);
        } else {
           setError(res.error || "Payment failed");
        }
      }
    } catch (e: any) {
       setError(e.message);
    } finally {
       setLoading(false);
    }
  };

  if (success) {
     return (
       <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-black text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Campaign Active!</h2>
          <p className="text-gray-400 text-sm">Your content is now being promoted to your targeted audience.</p>
          <button onClick={() => setSuccess(false)} className="mt-8 px-6 py-2 bg-white/10 rounded-xl text-sm font-semibold">Done</button>
       </div>
     )
  }

  return (
    <div className="w-full h-full flex flex-col pt-6 pb-24 overflow-y-auto no-scrollbar bg-black">
      <header className="px-4 pb-4 border-b border-white/5 sticky top-0 bg-skrim-bg/90 backdrop-blur-md z-40">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1 flex items-center gap-2"><Target className="w-6 h-6 text-neon-blue"/> Promote</h1>
        <p className="text-xs text-gray-500">Boost your best content</p>
      </header>

      <div className="p-4 flex flex-col gap-6">
        {/* Mock Post Preview */}
        <div className="bg-skrim-surface rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
           <img src="https://picsum.photos/400/400?random=888" className="w-16 h-16 rounded-xl object-cover" alt="post" />
           <div>
              <p className="text-xs text-gray-400 mb-1">Selected Post</p>
              <p className="text-sm font-semibold truncate w-48">Checking out the mountains today...</p>
           </div>
        </div>

        <div className="bg-skrim-surface rounded-2xl p-5 border border-white/5">
           <h3 className="font-bold mb-4">Budget & Duration</h3>
           
           <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                 <span className="text-gray-400">Total Budget</span>
                 <span className="font-bold">${budget}</span>
              </div>
              <input type="range" min="10" max="1000" step="10" value={budget} onChange={(e) => setBudget(parseInt(e.target.value))} className="w-full accent-neon-blue" />
           </div>

           <div>
              <div className="flex justify-between text-sm mb-2">
                 <span className="text-gray-400">Duration</span>
                 <span className="font-bold">{duration} Days</span>
              </div>
              <div className="flex gap-2">
                  {[1, 3, 7, 30].map(d => (
                     <button key={d} onClick={() => setDuration(d)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${duration === d ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' : 'border-white/10 text-gray-400'}`}>
                        {d}d
                     </button>
                  ))}
              </div>
           </div>
        </div>

        <div className="bg-skrim-surface rounded-2xl p-5 border border-white/5">
           <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold">Estimated Reach</h3>
              <span className="text-neon-blue font-bold tracking-tight">{(budget * 15.2).toFixed(0)} - {(budget * 25.4).toFixed(0)}</span>
           </div>
           <p className="text-[10px] text-gray-500">People per day based on your budget</p>
        </div>

        {error && <p className="text-xs text-red-500 px-2">{error}</p>}

        <button onClick={handlePromote} disabled={loading} className="w-full py-4 bg-neon-blue text-black font-bold rounded-2xl shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 mt-4 transition-transform active:scale-95">
           {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><CreditCard className="w-5 h-5"/> Pay ${budget}</>}
        </button>
      </div>
    </div>
  );
}
