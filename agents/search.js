/**
 * Search Agent
 * Handles: search, query, lookup, find actions
 */

const AGENT_NAME = 'search';
const HANDLED_ACTIONS = ['search', 'query', 'lookup', 'find'];

function canHandle(action) {
    return HANDLED_ACTIONS.some((a) => action.toLowerCase().includes(a));
}

async function process(task) {
    // Simulate search processing
    console.log(`🔍 [${AGENT_NAME}] Processing: ${task.action}`);

    await new Promise((r) => setTimeout(r, 300)); // Simulate work

    return {
        agent: AGENT_NAME,
        taskId: task.id,
        action: task.action,
        status: 'completed',
        result: {
            message: `Search task "${task.action}" processed`,
            processedAt: Date.now(),
            matches: [],
        },
    };
}

module.exports = { AGENT_NAME, HANDLED_ACTIONS, canHandle, process };
