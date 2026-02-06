/**
 * Nextus Bot Wrapper
 * 
 * One-liner install: curl -s http://localhost:3000/wrapper.js | node
 * 
 * Module usage:
 *   const createBot = require('./wrapper');
 *   const bot = createBot('your-token', 'chat-id');
 */

const { io } = require('socket.io-client');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const DEFAULT_SERVER = 'http://localhost:3000';

function createBot(token, chatId, options = {}) {
    const server = options.server || DEFAULT_SERVER;
    const socket = io(server);

    const bot = {
        token,
        chatId,
        hash: null,
        connected: false,

        // Send action to queue
        async send(action, data = null) {
            const res = await axios.post(`${server}/next`, { action, data }, {
                headers: { 'Content-Type': 'application/json' }
            });
            return res.data;
        },

        // Listen for agent results
        onResult(callback) {
            socket.on('agent:result', callback);
            return bot;
        },

        // Listen for errors
        onError(callback) {
            socket.on('agent:error', callback);
            return bot;
        },

        // Listen for unhandled actions
        onUnhandled(callback) {
            socket.on('agent:unhandled', callback);
            return bot;
        },

        // Listen for any event
        on(event, callback) {
            socket.on(event, callback);
            return bot;
        },

        // Disconnect
        disconnect() {
            socket.disconnect();
            bot.connected = false;
            return bot;
        },

        // Get manifest
        async getManifest() {
            const res = await axios.get(`${server}/manifest`);
            return res.data;
        }
    };

    // Handle connection
    socket.on('connect', () => {
        bot.connected = true;
        console.log(`🤖 Bot connected: ${chatId}`);
    });

    socket.on('welcome', (data) => {
        bot.hash = data.hash;
        console.log(`🔑 Session hash: ${data.hash.slice(0, 16)}...`);
    });

    socket.on('disconnect', () => {
        bot.connected = false;
        console.log(`❌ Bot disconnected: ${chatId}`);
    });

    return bot;
}

// One-liner mode: curl | node
if (require.main === module) {
    const args = process.argv.slice(2);
    const token = args[0] || process.env.NEXTUS_TOKEN || CryptoJS.lib.WordArray.random(16).toString();
    const chatId = args[1] || process.env.NEXTUS_CHAT_ID || `chat_${Date.now()}`;
    const server = args[2] || process.env.NEXTUS_SERVER || DEFAULT_SERVER;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚀 Nextus Bot Wrapper');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Token:   ${token.slice(0, 8)}...`);
    console.log(`  Chat ID: ${chatId}`);
    console.log(`  Server:  ${server}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const bot = createBot(token, chatId, { server });

    bot.onResult((result) => {
        console.log(`📥 [${result.agent}] ${result.action}: ${result.status}`);
    });

    bot.onError((err) => {
        console.error(`❌ Error: ${err.error}`);
    });

    bot.onUnhandled((msg) => {
        console.warn(`⚠️ Unhandled: ${msg.action}`);
    });

    // Keep alive
    process.on('SIGINT', () => {
        bot.disconnect();
        process.exit(0);
    });
}

module.exports = createBot;
