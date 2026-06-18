import { useState, useEffect } from 'react';

// MOCK INITIAL DATA
export const INITIAL_COMMUNITIES = [
  {
    id: "c001",
    name: "SkrimGamers",
    initials: "SG",
    atmosphere: "nebula",
    members: 14200,
    description: "India's biggest gaming world",
    category: "Gaming",
    active: true,
    joined: false
  },
  {
    id: "c002",
    name: "BeatDrop",
    initials: "BD",
    atmosphere: "solar",
    members: 8900,
    description: "Music producers & listeners",
    category: "Music",
    active: true,
    joined: true
  },
  {
    id: "c003",
    name: "PixelCraft",
    initials: "PC",
    atmosphere: "ocean",
    members: 5400,
    description: "Digital art & creators",
    category: "Art",
    active: false,
    joined: false
  },
  {
    id: "c004",
    name: "GrindMode",
    initials: "GM",
    atmosphere: "crimson",
    members: 21000,
    description: "Fitness & hustle culture",
    category: "Fitness",
    active: true,
    joined: true,
    paid: true
  }
];

export function getCommunities() {
  const allStr = localStorage.getItem('worlds_all');
  let allComms = INITIAL_COMMUNITIES;
  if (allStr) {
    allComms = JSON.parse(allStr);
  } else {
    localStorage.setItem('worlds_all', JSON.stringify(INITIAL_COMMUNITIES));
  }

  const joinedStr = localStorage.getItem('worlds_joined');
  let joinedIds: string[] = [];
  if (joinedStr) {
    joinedIds = JSON.parse(joinedStr);
  } else {
    // initialize from original mock data
    joinedIds = allComms.filter(c => c.joined).map(c => c.id);
    localStorage.setItem('worlds_joined', JSON.stringify(joinedIds));
    joinedIds.forEach(id => {
      localStorage.setItem(`worlds_level_${id}`, 'pioneer');
    });
  }

  return allComms.map(c => ({
    ...c,
    joined: joinedIds.includes(c.id),
    members: c.members + (joinedIds.includes(c.id) && !c.joined ? 1 : 0) // if we joined a new one, add 1 to mock
  }));
}

export function useWorlds() {
  const [communities, setCommunities] = useState(() => getCommunities());

  useEffect(() => {
    const handleUpdate = () => {
      setCommunities(getCommunities());
    };
    window.addEventListener('worlds_updated', handleUpdate);
    return () => window.removeEventListener('worlds_updated', handleUpdate);
  }, []);

  return communities;
}

export function useWorldMembership(worldId: string) {
  const [joined, setJoined] = useState(() => {
    const joinedStr = localStorage.getItem('worlds_joined') || '[]';
    return JSON.parse(joinedStr).includes(worldId);
  });
  
  const [level, setLevel] = useState(() => {
    return localStorage.getItem(`worlds_level_${worldId}`) || 'explorer';
  });

  const [daysActive, setDaysActive] = useState(() => {
    const joinedAt = localStorage.getItem(`worlds_joined_at_${worldId}`);
    if (joinedAt) {
      return Math.floor((Date.now() - parseInt(joinedAt)) / (1000 * 60 * 60 * 24));
    }
    return 0;
  });

  useEffect(() => {
    const handleUpdate = () => {
      const joinedStr = localStorage.getItem('worlds_joined') || '[]';
      const isJoined = JSON.parse(joinedStr).includes(worldId);
      setJoined(isJoined);
      setLevel(localStorage.getItem(`worlds_level_${worldId}`) || 'explorer');
    };
    window.addEventListener('worlds_updated', handleUpdate);
    return () => window.removeEventListener('worlds_updated', handleUpdate);
  }, [worldId]);

  const join = () => {
    const joinedStr = localStorage.getItem('worlds_joined') || '[]';
    const arr = JSON.parse(joinedStr);
    
    // Check if previously joined to restore state
    const prevStr = localStorage.getItem('worlds_prev_member') || '[]';
    const prevArr = JSON.parse(prevStr);
    const isRejoin = prevArr.includes(worldId);

    if (!arr.includes(worldId)) {
      arr.push(worldId);
      localStorage.setItem('worlds_joined', JSON.stringify(arr));
      if (!isRejoin) {
        localStorage.setItem(`worlds_level_${worldId}`, 'explorer');
        localStorage.setItem(`worlds_joined_at_${worldId}`, Date.now().toString());
      }
    }
    setJoined(true);
    window.dispatchEvent(new Event('worlds_updated'));
    return isRejoin;
  };

  const leave = () => {
    const joinedStr = localStorage.getItem('worlds_joined') || '[]';
    let arr = JSON.parse(joinedStr);
    arr = arr.filter((id: string) => id !== worldId);
    localStorage.setItem('worlds_joined', JSON.stringify(arr));
    
    // record as previous member
    const prevStr = localStorage.getItem('worlds_prev_member') || '[]';
    const prevArr = JSON.parse(prevStr);
    if (!prevArr.includes(worldId)) {
      prevArr.push(worldId);
      localStorage.setItem('worlds_prev_member', JSON.stringify(prevArr));
    }
    
    setJoined(false);
    window.dispatchEvent(new Event('worlds_updated'));
  };

  return { joined, join, leave, level, daysActive };
}
