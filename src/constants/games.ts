export const AVAILABLE_GAMES = [
  { id: 'snake', label: 'Snake', emoji: '🐍', tagline: 'Beat my score! Fast reflexes', isMultiplayer: false, defaultScore: 580 },
  { id: 'tic_tac_toe', label: 'Tic Tac Toe', emoji: '⭕', tagline: 'Classic battle of minds!', isMultiplayer: true },
  { id: 'emoji_guess', label: 'Emoji Guess', emoji: '🎯', tagline: 'Can you beat my emoji score?', isMultiplayer: false, defaultScore: 850 },
  { id: 'quiz', label: 'Quiz Battle', emoji: '📚', tagline: "Who knows more? Let's find out", isMultiplayer: true },
  { id: 'snakes_ladders', label: 'Snakes & Ladders', emoji: '🎲', tagline: 'Roll dice, climb ladders!', isMultiplayer: true },
  { id: 'kabaddi', label: 'Kabaddi', emoji: '🏏', tagline: 'Traditional tag battle!', isMultiplayer: true },
];

export const CHALLENGE_MESSAGES: Record<string, string[]> = {
  snake: [
    "Beat my 580 if you can! 🐍",
    "Think you're faster? 😏",
    "Snake master here! 🐍👑"
  ],
  emoji_guess: [
    "Bet you can't beat 850! 🎯",
    "Emoji genius right here 😎",
    "Try to match my score! 🏆"
  ],
  quiz: [
    "Who's smarter? Let's find out!",
    "Quiz battle — you scared? 😏",
    "Knowledge fight! Come on 📚"
  ],
  tic_tac_toe: [
    "I never lose at this 😏",
    "X's and O's — you dare? ⭕",
    "Classic game, classic winner 👑"
  ]
};
