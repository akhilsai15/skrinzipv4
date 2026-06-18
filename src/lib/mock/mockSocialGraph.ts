import { useState, useEffect } from 'react';

export function getMessageRequests(): any[] {
  const data = localStorage.getItem('skrimchat_msg_requests');
  return data ? JSON.parse(data) : [];
}

export function saveMessageRequests(arr: any[]) {
  localStorage.setItem('skrimchat_msg_requests', JSON.stringify(arr));
  window.dispatchEvent(new Event('skrimchat_requests_updated'));
}

export function hasSentRequest(fromUsername: string, targetUsername: string): boolean {
  const requests = getMessageRequests();
  return requests.some((r: any) => r.fromUsername === fromUsername && r.targetUsername === targetUsername);
}

export function sendRequest(fromUsername: string, targetUsername: string, message: string = "Hey! Let's connect.", fromAvatar?: string) {
  const requests = getMessageRequests();
  // Check if request already exists
  if (!requests.some((r: any) => r.fromUsername === fromUsername && r.targetUsername === targetUsername)) {
    requests.push({
      id: Date.now().toString(),
      fromUsername,
      targetUsername,
      message,
      timestamp: Date.now(),
      status: "pending",
      fromAvatar: fromAvatar || `https://i.pravatar.cc/150?u=${fromUsername}`
    });
    saveMessageRequests(requests);
  }
}

export function acceptRequest(requestId: string) {
  let requests = getMessageRequests();
  const request = requests.find((r: any) => r.id === requestId);
  if (request) {
     requests = requests.filter((r: any) => r.id !== requestId);
     saveMessageRequests(requests);
     
     // Make them mutual
     followUser(request.fromUsername);
     followUser(request.targetUsername); // Technically targetUsername following fromUsername but our mock is single user perspective. Let's just say the current user is following the sender.
     // Also simulate sender following current user:
     const followers = getFollowersArray();
     if (!followers.includes(request.fromUsername)) {
        followers.push(request.fromUsername);
        saveFollowersArray(followers);
     }
     window.dispatchEvent(new Event('skrimchat_social_graph_updated'));

     // Save the message to mock chat messages so it shows up in ConnectScreen
     const storedChatsStr = localStorage.getItem('skrimchat_custom_chats');
     const customChats = storedChatsStr ? JSON.parse(storedChatsStr) : {};
     const chatKey = request.fromUsername.replace('@', '');
     if (!customChats[chatKey]) customChats[chatKey] = [];
     customChats[chatKey].push({
        id: Date.now().toString(),
        text: request.message,
        sender: request.fromUsername,
        timestamp: Date.now()
     });
     localStorage.setItem('skrimchat_custom_chats', JSON.stringify(customChats));
  }
}

export function declineRequest(requestId: string) {
  let requests = getMessageRequests();
  requests = requests.filter((r: any) => r.id !== requestId);
  saveMessageRequests(requests);
}

export function getFollowingArray(): string[] {
  const data = localStorage.getItem('skrimchat_following');
  return data ? JSON.parse(data) : [];
}

export function saveFollowingArray(arr: string[]) {
  localStorage.setItem('skrimchat_following', JSON.stringify(arr));
}

export function getFollowersArray(): string[] {
  const data = localStorage.getItem('skrimchat_followers');
  return data ? JSON.parse(data) : [];
}

export function saveFollowersArray(arr: string[]) {
  localStorage.setItem('skrimchat_followers', JSON.stringify(arr));
}

export function getUserCounts(): Record<string, {followers: number, following: number}> {
  const data = localStorage.getItem('skrimchat_user_counts');
  return data ? JSON.parse(data) : {};
}

export function saveUserCounts(counts: Record<string, {followers: number, following: number}>) {
  localStorage.setItem('skrimchat_user_counts', JSON.stringify(counts));
}

export function isFollowing(targetUsername: string): boolean {
  return getFollowingArray().includes(targetUsername);
}

export function isFollowedBy(targetUsername: string): boolean {
  return getFollowersArray().includes(targetUsername);
}

export function getFollowingList(): string[] {
  return getFollowingArray();
}

export function getFollowersCount(targetUsername: string, initialCount: number = 0): number {
  const counts = getUserCounts();
  if (counts[targetUsername]?.followers !== undefined) {
    return counts[targetUsername].followers;
  }
  return initialCount;
}

export function followUser(targetUsername: string, initialFollowers: number = 0) {
  const arr = getFollowingArray();
  if (!arr.includes(targetUsername)) {
    arr.push(targetUsername);
    saveFollowingArray(arr);
    
    // Update target's followers count
    const counts = getUserCounts();
    if (!counts[targetUsername]) {
      counts[targetUsername] = { followers: initialFollowers, following: 0 };
    }
    counts[targetUsername].followers += 1;
    saveUserCounts(counts);
    
    // Update current user's profile
    updateCurrentUserFollowing(1);
    
    // Dispatch event to update UI across components
    window.dispatchEvent(new Event('skrimchat_social_graph_updated'));
  }
}

export function unfollowUser(targetUsername: string, initialFollowers: number = 0) {
  let arr = getFollowingArray();
  if (arr.includes(targetUsername)) {
    arr = arr.filter(u => u !== targetUsername);
    saveFollowingArray(arr);
    
    // Update target's followers count
    const counts = getUserCounts();
    if (!counts[targetUsername]) {
      counts[targetUsername] = { followers: initialFollowers, following: 0 };
    }
    counts[targetUsername].followers = Math.max(0, counts[targetUsername].followers - 1);
    saveUserCounts(counts);
    
    // Update current user's profile
    updateCurrentUserFollowing(-1);
    
    window.dispatchEvent(new Event('skrimchat_social_graph_updated'));
  }
}

function updateCurrentUserFollowing(delta: number) {
  const userStr = localStorage.getItem('skrimchat_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      user.following = Math.max(0, (user.following || 0) + delta);
      localStorage.setItem('skrimchat_user', JSON.stringify(user));
      window.dispatchEvent(new Event('skrimchat_user_updated'));
    } catch(e) {}
  }
}

export function useFollowStatus(targetUsername: string) {
  const [status, setStatus] = useState({
    following: isFollowing(targetUsername),
    followedBy: isFollowedBy(targetUsername)
  });

  useEffect(() => {
    const handleUpdate = () => {
      setStatus({
        following: isFollowing(targetUsername),
        followedBy: isFollowedBy(targetUsername)
      });
    };
    window.addEventListener('skrimchat_social_graph_updated', handleUpdate);
    return () => window.removeEventListener('skrimchat_social_graph_updated', handleUpdate);
  }, [targetUsername]);

  return status;
}

export function useSocialCounts(targetUsername: string, initialFollowers: number, initialFollowing: number) {
  const [counts, setCounts] = useState({
    followers: getFollowersCount(targetUsername, initialFollowers),
    following: initialFollowing
  });

  useEffect(() => {
    const handleUpdate = () => {
      setCounts({
        followers: getFollowersCount(targetUsername, initialFollowers),
        following: initialFollowing // For other users this doesn't change from our perspective
      });
    };
    window.addEventListener('skrimchat_social_graph_updated', handleUpdate);
    return () => window.removeEventListener('skrimchat_social_graph_updated', handleUpdate);
  }, [targetUsername, initialFollowers, initialFollowing]);

  return counts;
}

