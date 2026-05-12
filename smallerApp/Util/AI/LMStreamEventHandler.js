/**
 * LM Studio SSE Event Handler
 * Parses the streaming response from /api/v1/chat and fires
 * typed callbacks for every event in the protocol.
 *
 * Usage:
 *   const handler = new LMEventHandler({ onMessageDelta: (e) => console.log(e.text) });
 *   await handler.stream('http://localhost:1234', model, input, options);
 */

class LMEventHandler {
    /**
     * @param {object} callbacks - Any subset of the supported event callbacks below.
     *
     * Lifecycle:
     *   onChatStart(event)
     *   onChatEnd(event)
     *   onError(event)
     *
     * Model loading:
     *   onModelLoadStart(event)
     *   onModelLoadProgress(event)   // event.progress = 0.0–1.0
     *   onModelLoadEnd(event)
     *
     * Prompt processing:
     *   onPromptProcessingStart(event)
     *   onPromptProcessingProgress(event)  // event.progress = 0.0–1.0
     *   onPromptProcessingEnd(event)
     *
     * Reasoning (thinking models):
     *   onReasoningStart(event)
     *   onReasoningDelta(event)   // event.text = chunk
     *   onReasoningEnd(event)
     *
     * Tool calls:
     *   onToolCallStart(event)      // event.tool = tool name
     *   onToolCallArguments(event)  // event.text = argument chunk (streaming JSON)
     *   onToolCallSuccess(event)    // event.output = tool result
     *   onToolCallFailure(event)    // event.reason = error reason
     *
     * Message:
     *   onMessageStart(event)
     *   onMessageDelta(event)   // event.text = chunk  ← the main one you'll use
     *   onMessageEnd(event)
     */
    constructor(callbacks = {}) {
        this.callbacks = callbacks;

        // Internal accumulators — available after stream ends
        this.fullMessage = '';
        this.fullReasoning = '';
        this.toolCalls = [];
        this._currentToolCall = null;
    }

    // ---------------------------------------------------------------------------
    // Public: stream from a fetch response body
    // ---------------------------------------------------------------------------

    /**
     * Attach to an already-open streaming fetch response.
     * @param {Response} response - The fetch Response with stream: true
     * @returns {Promise<StreamResult>}
     */
    async attach(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // hold the last partial line

            for (const line of lines) {
                this._parseLine(line.trim());
            }
        }

        // Flush any remaining buffer
        if (buffer.trim()) this._parseLine(buffer.trim());

        return this._result();
    }

    /**
     * Open the connection and stream in one call.
     * @param {string} baseUrl   - e.g. 'http://localhost:1234'
     * @param {string} model
     * @param {string|Array} input
     * @param {object} [options] - Same options as the chat endpoint
     * @param {string} [apiKey]
     * @returns {Promise<StreamResult>}
     */
    async stream(baseUrl, model, input, options = {}, apiKey = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const res = await fetch(`${baseUrl}/api/v1/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, input, stream: true, ...options }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`LM Studio error ${res.status}: ${text}`);
        }

        return this.attach(res);
    }

    // ---------------------------------------------------------------------------
    // Internal: parse one SSE line
    // ---------------------------------------------------------------------------

    _parseLine(line) {
        if (!line.startsWith('data: ')) return;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') return;

        let event;
        try {
            event = JSON.parse(payload);
        } catch {
            return; // malformed line, skip
        }

        this._dispatch(event);
    }

    // ---------------------------------------------------------------------------
    // Internal: route to the right handler
    // ---------------------------------------------------------------------------

    _dispatch(event) {
        const type = event.type;

        switch (type) {
            // --- Lifecycle ---
            case 'chat.start':
                this._emit('onChatStart', event);
                break;

            case 'chat.end':
                this._emit('onChatEnd', event);
                break;

            case 'error':
                this._emit('onError', event);
                break;

            // --- Model loading ---
            case 'model_load.start':
                this._emit('onModelLoadStart', event);
                break;

            case 'model_load.progress':
                this._emit('onModelLoadProgress', {
                    ...event,
                    progress: event.progress ?? event.value ?? 0,
                });
                break;

            case 'model_load.end':
                this._emit('onModelLoadEnd', event);
                break;

            // --- Prompt processing ---
            case 'prompt_processing.start':
                this._emit('onPromptProcessingStart', event);
                break;

            case 'prompt_processing.progress':
                this._emit('onPromptProcessingProgress', {
                    ...event,
                    progress: event.progress ?? event.value ?? 0,
                });
                break;

            case 'prompt_processing.end':
                this._emit('onPromptProcessingEnd', event);
                break;

            // --- Reasoning ---
            case 'reasoning.start':
                this.fullReasoning = '';
                this._emit('onReasoningStart', event);
                break;

            case 'reasoning.delta': {
                const text = event.delta?.text ?? event.text ?? '';
                this.fullReasoning += text;
                this._emit('onReasoningDelta', { ...event, text });
                break;
            }

            case 'reasoning.end':
                this._emit('onReasoningEnd', { ...event, fullReasoning: this.fullReasoning });
                break;

            // --- Tool calls ---
            case 'tool_call.start':
                this._currentToolCall = {
                    tool: event.tool ?? event.name ?? '',
                    arguments: '',
                    providerInfo: event.provider_info ?? null,
                };
                this._emit('onToolCallStart', { ...event, tool: this._currentToolCall.tool });
                break;

            case 'tool_call.arguments': {
                const chunk = event.delta?.text ?? event.text ?? '';
                if (this._currentToolCall) this._currentToolCall.arguments += chunk;
                this._emit('onToolCallArguments', { ...event, text: chunk });
                break;
            }

            case 'tool_call.success':
                if (this._currentToolCall) {
                    this._currentToolCall.output = event.output ?? null;
                    this._currentToolCall.success = true;
                    this.toolCalls.push({ ...this._currentToolCall });
                    this._currentToolCall = null;
                }
                this._emit('onToolCallSuccess', event);
                break;

            case 'tool_call.failure':
                if (this._currentToolCall) {
                    this._currentToolCall.reason = event.reason ?? '';
                    this._currentToolCall.success = false;
                    this.toolCalls.push({ ...this._currentToolCall });
                    this._currentToolCall = null;
                }
                this._emit('onToolCallFailure', event);
                break;

            // --- Message ---
            case 'message.start':
                this.fullMessage = '';
                this._emit('onMessageStart', event);
                break;

            case 'message.delta': {
                const text = event.delta?.text ?? event.text ?? '';
                this.fullMessage += text;
                this._emit('onMessageDelta', { ...event, text });
                break;
            }

            case 'message.end':
                this._emit('onMessageEnd', { ...event, fullMessage: this.fullMessage });
                break;

            default:
                // Forward unknown events as-is — useful during development
                this._emit('onUnknown', event);
                break;
        }
    }

    // ---------------------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------------------

    _emit(name, event) {
        if (typeof this.callbacks[name] === 'function') {
            this.callbacks[name](event);
        }
    }

    _result() {
        return {
            fullMessage: this.fullMessage,
            fullReasoning: this.fullReasoning,
            toolCalls: this.toolCalls,
        };
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { LMEventHandler };

if (typeof module !== 'undefined') {
    module.exports = { LMEventHandler };
}