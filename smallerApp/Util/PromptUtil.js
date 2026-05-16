import { LMStudioClient } from "../Repository/LMStudioClient.js";
import { qwenRepo } from "../Repository/PromptRepos.js";
const models = {
    gemma4: 'google/gemma-4-e4b',
    qwen3_5: 'qwen/qwen3.5-9b',
    qwen2_5_instruct: `qwen2.5-7b-instruct`,

}

export function buildCoachPrompt(fen, movePlayed, bestMove, cpLoss, pgn, onChunk) {

    let ai_prompt = qwenRepo

    ai_prompt = ai_prompt + `game pgn: ${pgn} \n  fen: ${fen}`
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
    console.log('requesting help! ');


    const firstUrl = 'http://localhost:1234/api/v1/chat'
    const otherUrl = 'http://127.0.0.1:1234t:1234/api/v1/chat'

    const res = await fetch(firstUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: models.qwen2_5_instruct,
            temperature: 0.6,
            input: prompt,
            stream: false,
        })
    });
    console.log('res', res);

    // console.log('status:', res.status);
    const data = await res.json();
    // const text = JSON.stringify(data, null, 2)
    console.log('json:', data);
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


