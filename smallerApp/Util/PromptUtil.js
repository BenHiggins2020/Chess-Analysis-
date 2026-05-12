import { LMStudioClient } from "../Repository/LMStudioClient.js";

const models = {
    gemma4: 'google/gemma-4-e4b',
    qwen3_5: 'qwen/qwen3.5-9b'

}

export function buildCoachPrompt(fen, movePlayed, bestMove, cpLoss, pgn, onChunk) {

    const prompt = `You are a chess coach explaining a game review to a club-level player.

Position before the move (FEN): ${fen}
Move played: ${movePlayed}
Engine's best move: ${bestMove}
Centipawn loss: ${cpLoss}

Recent game moves: ${pgn}

In 2-3 sentences, explain:
1. Why the move played was ${cpLoss > 100 ? 'a blunder' : cpLoss > 50 ? 'a mistake' : 'inaccurate'}
2. What the engine's best move accomplishes instead

Be specific about piece activity, tactics, or structure. Avoid vague advice.`;


    const ai_prompt = ` 
Role Definition: You are acting as an elite Grandmaster Chess Coach and Master Strategist. Your primary goal is not merely to find mistakes (Blunders) in my game, but to elevate my overall understanding of positional play, strategic planning, and prophylactic thinking. Your tone must be highly academic, constructive, encouraging, and relentlessly detailed.

Goal: Analyze the provided chess game data thoroughly. The feedback must be structured into actionable lessons that I can implement in my next 5 games. Do not simply list moves; explain the principles behind the successful or missed opportunities.

Input Data:
PGN: ${pgn} fen: ${fen} 

Analysis Protocol (The AI must address these sections sequentially and with depth):
1. Executive Summary & Key Takeaways (High Level)
Provide a concise 3-4 sentence summary of the game's overall trajectory.
Identify my single most critical weakness demonstrated in this game (e.g., King safety, inability to convert an advantage, poor tactical visualization). This is the "Focus Area" for improvement.
State the core strategic principle I must internalize immediately.
2. Deep Dive: The Critical Moments & Mistakes
Analyze 3-5 specific turning points (where a decision dramatically changed the game's character). For each point, structure your analysis as follows:
The Mistake: State the move I played and categorize it (e.g., Tactical oversight, Positional error, Miscalculation).
Why it was wrong: Explain the strategic or tactical principle I failed to consider.
What should have been done: Provide the optimal alternative moves and explain why that line maintains a stronger advantage or achieves a better positional goal.
The Lesson Learned (Crucial): What general rule or thought process do I need to adopt next time to avoid this specific type of error?
3. Positional & Strategic Assessment (Long-Term Thinking)
Review the game from a macro perspective, independent of any single blunders.
Identify 2-3 strategic themes that were present but poorly managed throughout the game. Examples: controlling key files, exploiting weak squares, coordinating pieces for an endgame transition.
Explain how I can improve my ability to look beyond immediate threats (i.e., planning a 5-move sequence focused on a positional goal rather than just capturing material).
4. Endgame Focus (If Applicable)
If the game reached an endgame, analyze it specifically. Did I know the fundamental principles (e.g., Opposition, Rook and Pawn endings)? If not, list 2-3 key textbook endgames that require immediate study.
5. Action Plan & Drill Recommendations
This is the most important section. Provide a personalized homework assignment based on my identified weaknesses.
Suggest three specific types of training/drills I should focus on (e.g., "Solve 10 tactical puzzles focusing on forks," or "Study the Sicilian Defense middlegame structure").
Give me one piece of general, psychological advice for managing stress or time during my next tournament/serious game.
`
    return call(ai_prompt);
    // return callOllamaCoach(prompt);
}


async function callOllamaCoach(prompt, options = {}) {
    const {
        model = 'deepseek-r1:7b',
        temperature = 0.7,
        onChunk = null,          // optional streaming callback
    } = options;

    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            temperature,
            stream: true,
        }),
    });

    console.log("fetched ollama response: ", response);

    if (!response.ok) {
        console.log("ollama response was not ok. ", response.text);
        throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    // --- Streaming mode ---
    if (true) {
        console.log("LLM in stream mode: ... ")
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split('\n').filter(Boolean);
            for (const line of lines) {
                console.log("llm: ", line);
                const json = JSON.parse(line);
                if (json.response) {
                    fullText += json.response;
                    onChunk?.(json.response, fullText);  // fires on every token
                }
            }
        }
        return fullText;
    }

    // --- Non-streaming mode ---
    const data = await response.json();
    console.log("ollama response: ", data)
    return data.response;
}

const client = new LMStudioClient()

async function streamChat(prompt) {

    const res = await fetch('http://localhost:1234/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen/qwen3.5-9b',
            input: prompt,
            stream: true,
        })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log(decoder.decode(value));
    }

    // console.log("streaming chat: ");
    // const res = await client.streamChat('qwen/qwen3.5-9b', prompt, {
    //     onToken: (t) => process.stdout.write(t),
    //     temperature: 0.2,

    // });
    // console.log(res)
    // return res;
}
async function call(prompt) {
    const res = await fetch('http://localhost:1234/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: models.gemma4,
            input: prompt,
            stream: false,
        })
    });
    console.log('res', res);

    // console.log('status:', res.status);
    // const data = await res.json();
    // const text = JSON.stringify(data, null, 2)
    // console.log('response:', text);
    return data;
}


async function callLLMCoach(prompt, options = {}) {
    const {
        model = 'qwen/qwen3.5-9b',
        temperature = 0.2,
        onChunk = null,          // optional streaming callback
    } = options;

    const contextLen = 8000;
    // const response = await fetch(`http://127.0.0.1:1234/api/v1/chat/completions`, {

    const response = await fetch('http://127.0.0.1:1234/api/v1/chat/completions',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model, // model
                prompt, // input
                // // integrations
                // contextLen, // context length
                // stream: true,
                // temperature, // temperature
                // onChunk, // optional streaming callback
            }),
        });

    return response;

}


