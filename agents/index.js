/**
 * Agent Registry & Dispatcher
 * Loads all agents, polls the queue, dispatches to matching agent, emits via socket
 */

const logistics = require('./logistics');
const search = require('./search');
const human = require('./human');

const agents = [logistics, search, human];

const POLL_INTERVAL = 500; // ms

let queue = null;
let io = null;

function init(sharedQueue, socketIo) {
    queue = sharedQueue;
    io = socketIo;

    console.log(`🤖 Agents initialized: ${agents.map((a) => a.AGENT_NAME).join(', ')}`);

    // Start polling the queue
    setInterval(pollQueue, POLL_INTERVAL);
}

async function pollQueue() {
    if (!queue || queue.length === 0) return;

    // Grab the first task
    const task = queue.shift();
    if (!task) return;

    // Find an agent that can handle it
    const agent = agents.find((a) => a.canHandle(task.action));

    if (agent) {
        try {
            const result = await agent.process(task);

            // Emit result to all connected clients
            if (io) {
                io.emit('agent:result', result);
                console.log(`📤 Emitted result from [${agent.AGENT_NAME}] for task ${task.id}`);
            }
        } catch (err) {
            console.error(`❌ Agent error [${agent.AGENT_NAME}]:`, err.message);
            if (io) {
                io.emit('agent:error', {
                    taskId: task.id,
                    agent: agent.AGENT_NAME,
                    error: err.message,
                });
            }
        }
    } else {
        // No agent can handle this action - emit unhandled
        console.log(`⚠️ No agent for action: ${task.action}`);
        if (io) {
            io.emit('agent:unhandled', {
                taskId: task.id,
                action: task.action,
                message: 'No agent available to handle this action',
            });
        }
    }
}

module.exports = { init, agents };
