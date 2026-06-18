import { useState, useEffect } from 'react';

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = () => {
      const stored = localStorage.getItem('skrimchat_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored user", e);
        }
      }
    };
    
    fetchUser();
    
    // Listen for custom event to update when profile changes
    window.addEventListener('skrimchat_user_updated', fetchUser);
    return () => window.removeEventListener('skrimchat_user_updated', fetchUser);
  }, []);

  return currentUser;
};
