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

    return callOllamaCoach(prompt);
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