/**
 * Ollama chat UI with:
 *  - Manual chat (Send button)
 *  - Auto-advice toggle (streams analysis on every position change)
 *  - Analyze-position button (one-shot send when toggle is off, optional extra message)
 *
 * @param {HTMLElement} root
 */
export function mountOllamaChat(root) {
    if (!root) return;

    root.innerHTML = `
        <div class="chat-panel">
            <h3 class="chat-title">Ollama chat</h3>
            <label class="chat-label">Base URL
                <input type="url" id="ollama-base" class="chat-input" value="http://127.0.0.1:11434" autocomplete="off">
            </label>
            <label class="chat-label">Model
                <input type="text" id="ollama-model" class="chat-input" value="llama3.2" placeholder="e.g. llama3.2" autocomplete="off">
            </label>

            <div class="chat-advice-controls">
                <label><input type="checkbox" id="ollama-auto-advice"> Auto-advice on every move</label>
                <button type="button" id="ollama-analyze-btn" class="chat-send">Analyze position</button>
            </div>

            <div id="ollama-log" class="chat-log" aria-live="polite"></div>
            <div class="chat-compose">
                <textarea id="ollama-input" class="chat-textarea" rows="3" placeholder="Message / question about position…"></textarea>
                <button type="button" id="ollama-send" class="chat-send">Send</button>
            </div>
            <p class="chat-hint">Requires Ollama running locally and CORS (Ollama enables this for localhost).</p>
        </div>
    `;

    const logEl = root.querySelector("#ollama-log");
    const inputEl = root.querySelector("#ollama-input");
    const baseEl = root.querySelector("#ollama-base");
    const modelEl = root.querySelector("#ollama-model");
    const sendBtn = root.querySelector("#ollama-send");
    const autoAdviceCb = root.querySelector("#ollama-auto-advice");
    const analyzeBtn = root.querySelector("#ollama-analyze-btn");

    /** @type {{ role: string, content: string }[]} */
    const messages = [];

    /** Currently running streaming AbortController (auto-advice or analyze) */
    let activeAbort = null;

    let latestFen = "";

    /* ── Helpers ─────────────────────────────────────────────── */

    function appendBubble(role, text) {
        const div = document.createElement("div");
        div.className = `chat-bubble chat-bubble--${role}`;
        div.textContent = text;
        logEl.appendChild(div);
        logEl.scrollTop = logEl.scrollHeight;
        return div;
    }

    function getBase() {
        return (baseEl.value || "").replace(/\/$/, "");
    }

    function getModel() {
        return (modelEl.value || "").trim() || "gemma3:4b";
    }

    /* ── Streaming fetch helper ──────────────────────────────── */

    /**
     * Send messages to Ollama with streaming and update a bubble in real-time.
     * @param {{ role: string, content: string }[]} msgs
     * @param {AbortSignal} signal
     * @returns {Promise<string>} The full response text
     */
    async function streamChat(msgs, signal) {
        const bubble = appendBubble("assistant", "");
        let full = "";

        const res = await fetch(`${getBase()}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: getModel(),
                messages: msgs,
                stream: true,
            }),
            signal,
        });

        if (!res.ok) {
            const errText = await res.text();
            bubble.className = "chat-bubble chat-bubble--error";
            bubble.textContent = `HTTP ${res.status}: ${errText.slice(0, 400)}`;
            throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        for (; ;) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += decoder.decode(value, { stream: true });

            // Ollama streams newline-delimited JSON objects
            const lines = buf.split("\n");
            buf = lines.pop(); // keep incomplete last chunk

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const obj = JSON.parse(line);
                    const token = obj?.message?.content ?? "";
                    full += token;
                    bubble.textContent = full;
                    logEl.scrollTop = logEl.scrollHeight;
                } catch { /* skip malformed lines */ }
            }
        }

        // Process any remaining buffer
        if (buf.trim()) {
            try {
                const obj = JSON.parse(buf);
                const token = obj?.message?.content ?? "";
                full += token;
                bubble.textContent = full;
            } catch { /* ignore */ }
        }

        if (!full) {
            bubble.textContent = "(empty response)";
        }
        return full;
    }

    /* ── Build chess context prompt ──────────────────────────── */

    function buildChessPrompt(fen, extraMessage) {
        let prompt = `You are a chess coach. Analyze the current position and provide move advice.\n\nCurrent FEN: ${fen}`;
        if (extraMessage) {
            prompt += `\n\nPlayer's question: ${extraMessage}`;
        }
        prompt += "\n\nProvide concise, practical advice. Mention key threats, candidate moves, and positional ideas.";
        return prompt;
    }

    /* ── Manual Send (freeform chat) ─────────────────────────── */

    sendBtn.addEventListener("click", async () => {
        const text = inputEl.value.trim();
        if (!text) return;

        inputEl.value = "";
        appendBubble("user", text);
        messages.push({ role: "user", content: text });

        sendBtn.disabled = true;

        try {
            const reply = await streamChat([...messages], new AbortController().signal);
            messages.push({ role: "assistant", content: reply });
        } catch (e) {
            if (e.name !== "AbortError") {
                appendBubble("error", String(e.message || e));
            }
            messages.pop(); // remove the user msg that errored
        } finally {
            sendBtn.disabled = false;
        }
    });

    inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    /* ── Auto-advice (on every position change) ──────────────── */

    async function sendAutoAdvice(fen) {
        // Cancel any in-progress advice
        if (activeAbort) {
            activeAbort.abort();
            activeAbort = null;
        }

        const controller = new AbortController();
        activeAbort = controller;

        const prompt = buildChessPrompt(fen, null);
        appendBubble("system", `Auto-advice for: ${fen.split(" ")[0]}…`);

        try {
            const adviceMessages = [{ role: "user", content: prompt }];
            await streamChat(adviceMessages, controller.signal);
        } catch (e) {
            if (e.name !== "AbortError") {
                appendBubble("error", String(e.message || e));
            }
        } finally {
            if (activeAbort === controller) activeAbort = null;
        }
    }

    /* ── Analyze position button (one-shot) ──────────────────── */

    analyzeBtn.addEventListener("click", async () => {
        if (!latestFen) {
            appendBubble("error", "No position available yet.");
            return;
        }

        // Cancel any running auto-advice
        if (activeAbort) {
            activeAbort.abort();
            activeAbort = null;
        }

        const extra = inputEl.value.trim();
        inputEl.value = "";

        const controller = new AbortController();
        activeAbort = controller;

        const prompt = buildChessPrompt(latestFen, extra || null);
        appendBubble("user", extra ? `Analyze: ${extra}` : "Analyze current position");

        analyzeBtn.disabled = true;

        try {
            const adviceMessages = [{ role: "user", content: prompt }];
            const reply = await streamChat(adviceMessages, controller.signal);
            messages.push({ role: "user", content: prompt });
            messages.push({ role: "assistant", content: reply });
        } catch (e) {
            if (e.name !== "AbortError") {
                appendBubble("error", String(e.message || e));
            }
        } finally {
            if (activeAbort === controller) activeAbort = null;
            analyzeBtn.disabled = false;
        }
    });

    /* ── Listen for position changes ─────────────────────────── */

    document.addEventListener("chessPositionChanged", (ev) => {
        const fen = ev.detail?.fen;
        if (!fen) return;
        latestFen = fen;

        if (autoAdviceCb.checked) {
            sendAutoAdvice(fen);
        }
    });
}
