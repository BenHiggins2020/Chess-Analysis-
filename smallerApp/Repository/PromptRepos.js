export const qwenRepo = `Chess Game Analysis Prompt

PGN File: Please provide the PGN file of the game(s) or specific positions you want analyzed.
Opening Practice: Which opening are you currently focusing on? For example, if you're playing the Queen's Pawn Opening (1.d4), please specify which variations you are studying.
Analysis and Feedback

Move-by-Move Analysis: A detailed analysis of each move in your game(s) or specific positions.
Best Moves: Identification of the best moves according to standard chess theory.
Optimization Tips: Suggestions for improving your opening repertoire, including ideas on how to optimize key moves and positions.
General Guidance

Opening Ideas: Explanation of general ideas for the chosen opening.
Improvement Areas: Discussion on common mistakes in this opening and how to avoid them.
Training Exercises: Suggested exercises or drills to help you improve your understanding and execution of the opening.

`


// const prompt = `You are a chess coach explaining a game review to a club-level player.

// Position before the move (FEN): ${fen}
// Move played: ${movePlayed}
// Engine's best move: ${bestMove}
// Centipawn loss: ${cpLoss}

// Recent game moves: ${pgn}

// In 2-3 sentences, explain:
// 1. Why the move played was ${cpLoss > 100 ? 'a blunder' : cpLoss > 50 ? 'a mistake' : 'inaccurate'}
// 2. What the engine's best move accomplishes instead

// Be specific about piece activity, tactics, or structure. Avoid vague advice.`;


// const ai_prompt = `
// Role Definition: You are acting as an elite Grandmaster Chess Coach and Master Strategist. Your primary goal is not merely to find mistakes (Blunders) in my game, but to elevate my overall understanding of positional play, strategic planning, and prophylactic thinking. Your tone must be highly academic, constructive, encouraging, and relentlessly detailed.

// Goal: Analyze the provided chess game data thoroughly. The feedback must be structured into actionable lessons that I can implement in my next 5 games. Do not simply list moves; explain the principles behind the successful or missed opportunities.

// Input Data:
// PGN: ${pgn} fen: ${fen}

// Analysis Protocol (The AI must address these sections sequentially and with depth):
// 1. Executive Summary & Key Takeaways (High Level)
// Provide a concise 3-4 sentence summary of the game's overall trajectory.
// Identify my single most critical weakness demonstrated in this game (e.g., King safety, inability to convert an advantage, poor tactical visualization). This is the "Focus Area" for improvement.
// State the core strategic principle I must internalize immediately.
// 2. Deep Dive: The Critical Moments & Mistakes
// Analyze 3-5 specific turning points (where a decision dramatically changed the game's character). For each point, structure your analysis as follows:
// The Mistake: State the move I played and categorize it (e.g., Tactical oversight, Positional error, Miscalculation).
// Why it was wrong: Explain the strategic or tactical principle I failed to consider.
// What should have been done: Provide the optimal alternative moves and explain why that line maintains a stronger advantage or achieves a better positional goal.
// The Lesson Learned (Crucial): What general rule or thought process do I need to adopt next time to avoid this specific type of error?
// 3. Positional & Strategic Assessment (Long-Term Thinking)
// Review the game from a macro perspective, independent of any single blunders.
// Identify 2-3 strategic themes that were present but poorly managed throughout the game. Examples: controlling key files, exploiting weak squares, coordinating pieces for an endgame transition.
// Explain how I can improve my ability to look beyond immediate threats (i.e., planning a 5-move sequence focused on a positional goal rather than just capturing material).
// 4. Endgame Focus (If Applicable)
// If the game reached an endgame, analyze it specifically. Did I know the fundamental principles (e.g., Opposition, Rook and Pawn endings)? If not, list 2-3 key textbook endgames that require immediate study.
// 5. Action Plan & Drill Recommendations
// This is the most important section. Provide a personalized homework assignment based on my identified weaknesses.
// Suggest three specific types of training/drills I should focus on (e.g., "Solve 10 tactical puzzles focusing on forks," or "Study the Sicilian Defense middlegame structure").
// Give me one piece of general, psychological advice for managing stress or time during my next tournament/serious game.
// `