/**
 * LM Studio API Client
 * Wraps the /api/v1/chat endpoint with support for basic chat,
 * streaming, multi-turn conversation, and MCP integrations.
 *
 * Usage:
 *   const client = new LMStudioClient({ apiKey: 'your-token' });
 */

class LMStudioClient {
    /**
     * @param {object} options
     * @param {string} [options.baseUrl]  - Default: 'http://localhost:1234'
     * @param {string} [options.apiKey]   - LM Studio API token (if auth is enabled)
     */
    constructor({ baseUrl = 'http://localhost:1234', apiKey = null } = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
    }

    // ---------------------------------------------------------------------------
    // Low-level fetch helper
    // ---------------------------------------------------------------------------

    _headers() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
        return headers;
    }

    async _post(path, body) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`LM Studio API error ${res.status}: ${text}`);
        }

        return res;
    }

    // ---------------------------------------------------------------------------
    // Core: single-turn chat (non-streaming)
    // ---------------------------------------------------------------------------

    /**
     * Send a message and wait for the full response.
     *
     * @param {string} model               - Model identifier, e.g. 'ibm/granite-4-micro'
     * @param {string|Array} input         - User message string, or array of message objects
     * @param {object} [options]
     * @param {string}  [options.systemPrompt]
     * @param {number}  [options.temperature]      - 0–1
     * @param {number}  [options.maxOutputTokens]
     * @param {string}  [options.reasoning]        - 'off'|'low'|'medium'|'high'|'on'
     * @param {Array}   [options.integrations]     - MCP / plugin integrations
     * @param {boolean} [options.store]            - Whether to store the chat (default true)
     * @param {string}  [options.previousResponseId] - Continue a previous chat
     * @returns {Promise<LMResponse>}
     */
    async chat(model, input, options = {}) {
        const body = buildBody({ model, input, stream: false, ...options });
        const res = await this._post('/api/v1/chat', body);
        const data = await res.json();
        return new LMResponse(data);
    }

    // ---------------------------------------------------------------------------
    // Streaming chat
    // ---------------------------------------------------------------------------

    /**
     * Stream a response token-by-token via Server-Sent Events.
     *
     * @param {string}   model
     * @param {string|Array} input
     * @param {object}   [options]          - Same as chat(), minus stream
     * @param {Function} [options.onToken]  - Called with each text delta string
     * @param {Function} [options.onDone]   - Called with the final LMResponse
     * @returns {Promise<LMResponse>}       - Resolves when the stream ends
     */
    async streamChat(model, input, { onToken, onDone, ...options } = {}) {
        const body = buildBody({ model, input, stream: true, ...options });
        const res = await this._post('/api/v1/chat', body);

        return new Promise((resolve, reject) => {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let finalData = null;

            const pump = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop(); // last partial line stays in buffer

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const payload = line.slice(6).trim();
                            if (payload === '[DONE]') continue;

                            try {
                                const event = JSON.parse(payload);
                                // Streaming delta text
                                if (event.type === 'content_block_delta' && event.delta?.text) {
                                    onToken?.(event.delta.text);
                                }
                                // Final stats / full response arrives in the last event
                                if (event.type === 'message_stop' || event.stats) {
                                    finalData = event;
                                }
                            } catch {
                                // Non-JSON lines are silently ignored
                            }
                        }
                    }

                    const response = new LMResponse(finalData || {});
                    onDone?.(response);
                    resolve(response);
                } catch (err) {
                    reject(err);
                }
            };

            pump();
        });
    }

    // ---------------------------------------------------------------------------
    // Stateful multi-turn conversation helper
    // ---------------------------------------------------------------------------

    /**
     * Create a stateful conversation that automatically threads responses.
     *
     * @param {string} model
     * @param {object} [defaults]  - Default options applied to every turn
     * @returns {Conversation}
     */
    conversation(model, defaults = {}) {
        return new Conversation(this, model, defaults);
    }

    // ---------------------------------------------------------------------------
    // Model management
    // ---------------------------------------------------------------------------

    /**
     * List all available models.
     * @returns {Promise<Array>}
     */
    async listModels() {
        const res = await fetch(`${this.baseUrl}/api/v1/models`, {
            headers: this._headers(),
        });
        if (!res.ok) throw new Error(`Failed to list models: ${res.status}`);
        const data = await res.json();
        return data.data ?? data;
    }

    /**
     * Load a model into memory.
     * @param {string} model
     * @param {object} [options]
     * @returns {Promise<object>}
     */
    async loadModel(model, options = {}) {
        const res = await this._post('/api/v1/models/load', { model, ...options });
        return res.json();
    }

    /**
     * Unload a model from memory.
     * @param {string} model
     * @returns {Promise<object>}
     */
    async unloadModel(model) {
        const res = await this._post('/api/v1/models/unload', { model });
        return res.json();
    }
}

// ---------------------------------------------------------------------------
// Conversation — multi-turn helper
// ---------------------------------------------------------------------------

class Conversation {
    constructor(client, model, defaults = {}) {
        this.client = client;
        this.model = model;
        this.defaults = defaults;
        this.responseId = null;
    }

    /**
     * Send the next message in this conversation.
     * @param {string|Array} input
     * @param {object} [options]
     * @returns {Promise<LMResponse>}
     */
    async send(input, options = {}) {
        const opts = { ...this.defaults, ...options };
        if (this.responseId) opts.previousResponseId = this.responseId;

        const response = await this.client.chat(this.model, input, opts);
        if (response.responseId) this.responseId = response.responseId;
        return response;
    }

    /**
     * Stream the next message in this conversation.
     * @param {string|Array} input
     * @param {object} [options]
     * @returns {Promise<LMResponse>}
     */
    async stream(input, options = {}) {
        const opts = { ...this.defaults, ...options };
        if (this.responseId) opts.previousResponseId = this.responseId;

        const response = await this.client.streamChat(this.model, input, opts);
        if (response.responseId) this.responseId = response.responseId;
        return response;
    }

    /** Reset to a fresh conversation. */
    reset() {
        this.responseId = null;
    }
}

// ---------------------------------------------------------------------------
// LMResponse — wraps the raw API response with convenient accessors
// ---------------------------------------------------------------------------

class LMResponse {
    constructor(raw = {}) {
        this._raw = raw;
        this.modelInstanceId = raw.model_instance_id ?? null;
        this.output = raw.output ?? [];
        this.stats = raw.stats ?? {};
        this.responseId = raw.response_id ?? null;
    }

    /** The first plain text message in the output array. */
    get text() {
        const msg = this.output.find(o => o.type === 'message');
        return msg?.content ?? '';
    }

    /** All text messages joined together. */
    get fullText() {
        return this.output
            .filter(o => o.type === 'message')
            .map(o => o.content)
            .join('\n');
    }

    /** All tool calls made during this response. */
    get toolCalls() {
        return this.output.filter(o => o.type === 'tool_call');
    }

    /** Reasoning content (for models that support it). */
    get reasoning() {
        return this.output
            .filter(o => o.type === 'reasoning')
            .map(o => o.content)
            .join('\n');
    }

    /** Token usage stats. */
    get usage() {
        return {
            inputTokens: this.stats.input_tokens,
            outputTokens: this.stats.total_output_tokens,
            tokensPerSecond: this.stats.tokens_per_second,
            timeToFirstToken: this.stats.time_to_first_token_seconds,
        };
    }
}

// ---------------------------------------------------------------------------
// Internal: build the request body
// ---------------------------------------------------------------------------

function buildBody({
    model,
    input,
    stream = false,
    systemPrompt,
    temperature,
    topP,
    topK,
    minP,
    repeatPenalty,
    maxOutputTokens,
    reasoning,
    contextLength,
    integrations,
    store,
    previousResponseId,
}) {
    const body = { model, input, stream };

    if (systemPrompt !== undefined) body.system_prompt = systemPrompt;
    if (temperature !== undefined) body.temperature = temperature;
    if (topP !== undefined) body.top_p = topP;
    if (topK !== undefined) body.top_k = topK;
    if (minP !== undefined) body.min_p = minP;
    if (repeatPenalty !== undefined) body.repeat_penalty = repeatPenalty;
    if (maxOutputTokens !== undefined) body.max_output_tokens = maxOutputTokens;
    if (reasoning !== undefined) body.reasoning = reasoning;
    if (contextLength !== undefined) body.context_length = contextLength;
    if (integrations !== undefined) body.integrations = integrations;
    if (store !== undefined) body.store = store;
    if (previousResponseId !== undefined) body.previous_response_id = previousResponseId;

    return body;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// ESM
export { LMStudioClient, LMResponse, Conversation };

// CommonJS fallback
if (typeof module !== 'undefined') {
    module.exports = { LMStudioClient, LMResponse, Conversation };
}