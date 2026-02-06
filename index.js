const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const CryptoJS = require('crypto-js');
const agents = require('./agents');

const PORT = 3000;

// In-memory queue
const queue = [];

// Create HTTP server
const httpServer = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // GET /manifest - public agent manifest
    if (req.method === 'GET' && req.url === '/manifest') {
        const manifestPath = path.join(__dirname, 'manifest.json');
        fs.readFile(manifestPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to read manifest' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // GET /wrapper.js - serve bot wrapper for one-liner install
    if (req.method === 'GET' && req.url === '/wrapper.js') {
        const wrapperPath = path.join(__dirname, 'wrapper.js');
        fs.readFile(wrapperPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Failed to read wrapper');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(data);
        });
        return;
    }

    // POST /next handshake route
    if (req.method === 'POST' && req.url === '/next') {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const json = JSON.parse(body);

                // Validate: action must be a string
                if (!json.action || typeof json.action !== 'string') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid payload: action (string) is required' }));
                    return;
                }

                // Tag the message
                const tagged = {
                    id: CryptoJS.lib.WordArray.random(16).toString(),
                    timestamp: Date.now(),
                    action: json.action,
                    data: json.data ?? null,
                };

                // Push to queue
                queue.push(tagged);
                console.log(`📥 Queued: [${tagged.action}] id=${tagged.id}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, queued: tagged }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });

        return;
    }

    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

httpServer.listen(PORT, () => {
    console.log(`🚀 WebSocket server running on port ${PORT}`);
    console.log(`📡 POST /next handshake route ready`);

    // Initialize agents with shared queue and socket
    agents.init(queue, io);
});

io.on('connection', (socket) => {
    const userId = socket.id;
    const timestamp = Date.now();
    const hash = CryptoJS.SHA256(`${userId}${timestamp}`).toString();

    console.log(`✅ Client connected: ${userId}`);
    console.log(`   Hash: ${hash}`);

    // Send the hash to the connected client
    socket.emit('welcome', { hash, userId, timestamp });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${userId}`);
    });
});
