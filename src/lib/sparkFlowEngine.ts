export interface SparkFlowData {
  count: number;
  bestSparkFlow: number;
  lastDate: string;
  startDate: string;
  freezesLeft: number;
  isFrozen: boolean;
  atRisk?: boolean;
}

export const MOCK_SPARK_FLOWS: Record<string, SparkFlowData> = {
  "1": { // Priya Sharma
    count: 7,
    bestSparkFlow: 14,
    lastDate: new Date().toDateString(),
    startDate: "June 10, 2025",
    freezesLeft: 1,
    isFrozen: false
  },
  "2": { // Rahul Verma
    count: 14,
    bestSparkFlow: 14,
    lastDate: new Date().toDateString(),
    startDate: "June 3, 2025",
    freezesLeft: 1,
    isFrozen: false
  },
  "5": { // Kiran Reddy
    count: 30,
    bestSparkFlow: 30,
    lastDate: new Date(Date.now() - 86400000).toDateString(),
    startDate: "May 15, 2025",
    freezesLeft: 1,
    isFrozen: false,
    atRisk: true
  }
};

export function getSparkFlow(chatId: string): SparkFlowData | null {
  const stored = localStorage.getItem(`skrimchat_sparkflow_${chatId}`);
  if (stored) return JSON.parse(stored);
  return MOCK_SPARK_FLOWS[chatId] || null;
}

export function saveSparkFlow(chatId: string, data: SparkFlowData) {
  localStorage.setItem(`skrimchat_sparkflow_${chatId}`, JSON.stringify(data));
}

export function updateSparkFlow(chatId: string): { sparkFlow: SparkFlowData; milestoneReached?: number } {
  let flow = getSparkFlow(chatId);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (!flow) {
    flow = {
      count: 1,
      bestSparkFlow: 1,
      lastDate: today,
      startDate: today,
      freezesLeft: 1,
      isFrozen: false
    };
    saveSparkFlow(chatId, flow);
    return { sparkFlow: flow };
  }

  if (flow.lastDate === today) {
    return { sparkFlow: flow }; // already updated
  }

  let milestoneReached: number | undefined;

  if (flow.lastDate === yesterday || flow.isFrozen) {
    // Continue
    flow.count += 1;
    flow.lastDate = today;
    flow.bestSparkFlow = Math.max(flow.count, flow.bestSparkFlow);
    flow.isFrozen = false; // Unfreeze
    flow.atRisk = false;
    
    const milestones = [3, 7, 14, 30, 60, 100, 365];
    if (milestones.includes(flow.count)) {
      milestoneReached = flow.count;
    }
  } else {
    // Broken
    flow.count = 1;
    flow.lastDate = today;
    flow.startDate = today;
    flow.isFrozen = false;
    flow.atRisk = false;
  }

  saveSparkFlow(chatId, flow);
  return { sparkFlow: flow, milestoneReached };
}

export function getTierInfo(count: number) {
  if (count >= 100) return { emojis: '💎🔥', name: 'LEGENDARY', iconSize: 28, cssClass: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse', shadow: 'drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' };
  if (count >= 30) return { emojis: '👑🔥', name: 'Inferno', iconSize: 24, cssClass: 'text-yellow-400', shadow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' };
  if (count >= 14) return { emojis: '🔥🔥🔥', name: 'Blazing', iconSize: 22, cssClass: 'text-orange-500', shadow: 'drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]' };
  if (count >= 7) return { emojis: '🔥🔥', name: 'On Fire', iconSize: 20, cssClass: 'text-red-500', shadow: 'drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]' };
  if (count >= 4) return { emojis: '🔥', name: 'Heating Up', iconSize: 18, cssClass: 'text-[#FF4500]', shadow: 'drop-shadow-[0_0_2px_rgba(255,69,0,0.4)]' };
  if (count >= 1) return { emojis: '🔥', name: 'New Spark', iconSize: 16, cssClass: 'text-[#FF6B35]', shadow: '' };
  return { emojis: '', name: 'None', iconSize: 16, cssClass: 'text-transparent', shadow: '' };
}
