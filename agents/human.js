/**
 * Human Agent
 * Handles: review, approve, escalate, manual actions
 */

const AGENT_NAME = 'human';
const HANDLED_ACTIONS = ['review', 'approve', 'escalate', 'manual', 'human'];

function canHandle(action) {
    return HANDLED_ACTIONS.some((a) => action.toLowerCase().includes(a));
}

async function process(task) {
    // Simulate human-in-the-loop processing
    console.log(`👤 [${AGENT_NAME}] Processing: ${task.action}`);

    await new Promise((r) => setTimeout(r, 1000)); // Simulate human delay

    return {
        agent: AGENT_NAME,
        taskId: task.id,
        action: task.action,
        status: 'pending_review',
        result: {
            message: `Human review required for "${task.action}"`,
            processedAt: Date.now(),
            requiresInput: true,
        },
    };
}

module.exports = { AGENT_NAME, HANDLED_ACTIONS, canHandle, process };
