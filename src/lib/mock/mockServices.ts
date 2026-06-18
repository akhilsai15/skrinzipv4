import { FEATURE_FLAGS } from '../config/featureFlags';
import { 
  mockPosts, mockSparks, mockReels, mockChats, 
  mockMessages, mockNotifications, mockCommunities, 
  mockCreatorStats, mockUsers, mockAds, mockAdminData 
} from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPosts = async () => {
  await delay(500);
  return [...mockPosts];
};

export const getSparks = async () => {
  await delay(500);
  return [...mockSparks];
};

export const getReels = async () => {
  await delay(500);
  return [...mockReels];
};

export const getChats = async () => {
  await delay(500);
  return [...mockChats];
};

export const getMessages = async (chatId: string) => {
  await delay(500);
  return [...mockMessages];
};

export const getNotifications = async () => {
  await delay(500);
  return [...mockNotifications];
};


export const getCreatorStats = async () => {
  await delay(500);
  return mockCreatorStats;
};

export const likePost = async (postId: string) => {
  await delay(50);
  // Real persistence is handled in the component; this stub is kept for API-shape compatibility
  return { success: true, postId };
};

export const shareSpark = async (sparkId: string, targetUsername: string, message?: string) => {
  await delay(100);
  try {
    const key = 'skrimchat_custom_chats';
    const chats = JSON.parse(localStorage.getItem(key) || '{}');
    if (!chats[targetUsername]) chats[targetUsername] = [];
    chats[targetUsername].push({
      id: Date.now().toString() + Math.random(),
      text: message || `Check out this Spark ⚡ skrim.chat/spark/${sparkId}`,
      sender: 'me',
      timestamp: Date.now(),
    });
    localStorage.setItem(key, JSON.stringify(chats));
  } catch (e) {}
  return { success: true };
};

export const followUser = async (userId: string) => {
  await delay(200);
  return { success: true };
};

export const sendMessage = async (chatId: string, message: any) => {
  await delay(300);
  return { success: true, message: { id: `msg_new_${Date.now()}`, ...message } };
};

export const searchUsers = async (query: string) => {
  await delay(500);
  if (!query) return [];
  return mockUsers.filter(u => u.username.toLowerCase().includes(query.toLowerCase()) || u.displayName.toLowerCase().includes(query.toLowerCase()));
};

export const getAds = async () => {
  await delay(500);
  return [...mockAds];
};

export const getAdminData = async () => {
  await delay(500);
  return mockAdminData;
};
