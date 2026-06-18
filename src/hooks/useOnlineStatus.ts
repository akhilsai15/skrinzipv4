import { useState, useEffect } from 'react';

const ONLINE_TIMEOUT = 5 * 60 * 1000;

export function initOnlineTracking() {
  if (typeof window === 'undefined') return;

  const updateLastActive = () => {
    localStorage.setItem('skrimchat_last_active', Date.now().toString());
    window.dispatchEvent(new Event('skrimchat_online_status'));
  };

  document.addEventListener('click', updateLastActive);
  document.addEventListener('scroll', updateLastActive, { passive: true });
  document.addEventListener('keypress', updateLastActive);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.dispatchEvent(new Event('skrimchat_online_status'));
    } else {
      updateLastActive();
    }
  });

  // initial ping
  updateLastActive();

  setInterval(() => {
    window.dispatchEvent(new Event('skrimchat_online_status'));
  }, 60000);
}

export function initMockUsersOnlineToggle() {
  if (typeof window === 'undefined') return;
  setInterval(() => {
    const statusesStr = localStorage.getItem('skrimchat_mock_online_statuses');
    if (statusesStr) {
      const statuses: Record<string, boolean> = JSON.parse(statusesStr);
      let changed = false;
      Object.keys(statuses).forEach(key => {
        if (Math.random() < 0.2) {
          statuses[key] = !statuses[key];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('skrimchat_mock_online_statuses', JSON.stringify(statuses));
        window.dispatchEvent(new Event('skrimchat_mock_online_updated'));
      }
    }
  }, 5 * 60 * 1000);
}

export function useIsOnline(username?: string) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!username) return;

    const currentUserStr = localStorage.getItem('skrimchat_mock_user');
    let currentUsername = '';
    if (currentUserStr) {
       try {
         const cu = JSON.parse(currentUserStr);
         currentUsername = cu.username || '';
       } catch (e) {}
    }
    
    // Normalize usernames (remove @ if present)
    const normUser = username.replace('@', '').toLowerCase();
    const isCurrentUser = normUser === currentUsername.replace('@', '').toLowerCase();

    if (isCurrentUser) {
      const checkCurrentUser = () => {
        const lastActive = parseInt(localStorage.getItem('skrimchat_last_active') || '0', 10);
        const now = Date.now();
        if (document.hidden) {
          setIsOnline(false);
        } else {
          setIsOnline(now - lastActive < ONLINE_TIMEOUT);
        }
      };

      checkCurrentUser();
      window.addEventListener('skrimchat_online_status', checkCurrentUser);
      return () => window.removeEventListener('skrimchat_online_status', checkCurrentUser);
    } else {
      // Mock user logic
      const getMockStatus = () => {
        const statusesStr = localStorage.getItem('skrimchat_mock_online_statuses');
        let statuses: Record<string, boolean> = {};
        if (statusesStr) {
          statuses = JSON.parse(statusesStr);
        }
        
        if (statuses[normUser] !== undefined) {
          setIsOnline(statuses[normUser]);
        } else {
          // Initialize randomly (60% online)
          const online = Math.random() > 0.4;
          statuses[normUser] = online;
          localStorage.setItem('skrimchat_mock_online_statuses', JSON.stringify(statuses));
          setIsOnline(online);
        }
      };

      getMockStatus();
      window.addEventListener('skrimchat_mock_online_updated', getMockStatus);
      return () => window.removeEventListener('skrimchat_mock_online_updated', getMockStatus);
    }
  }, [username]);

  return isOnline;
}
