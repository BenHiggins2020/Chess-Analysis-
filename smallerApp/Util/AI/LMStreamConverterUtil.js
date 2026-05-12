const events = [
    ' chat.start',
    'model_load.start',
    'model_load.progress',
    'model_load.end',
    'prompt_processing.start',
    'prompt_processing.progress',
    'prompt_processing.end',
    'reasoning.start',
    'reasoning.delta',
    'reasoning.end',
    'tool_call.start',
    'tool_call.arguments',
    'tool_call.success',
    'tool_call.failure',
    'message.start',
    'message.delta',
    'message.end',
    'error',
    'chat.end',
]

event: reasoning.delta
data: { "type": "reasoning.delta", "content": "nowledge" }

handleEventUI(data) {
    const event = data.event;
    if (event.includes('progress')) {
        showProgress(data);
    }
}

function showProgress(data) {
}