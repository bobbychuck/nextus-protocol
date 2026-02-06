/**
 * Test Chat - Validates /next endpoint and agent processing
 */

const createBot = require('./wrapper');

const SERVER = 'http://localhost:3000';

async function runTests() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🧪 Nextus Protocol - Test Suite');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let passed = 0;
    let failed = 0;

    // Create test bot
    const bot = createBot('test-token', 'test-chat-001', { server: SERVER });

    // Wait for connection
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 1: POST /next with valid payload
    console.log('📋 Test 1: POST /next with valid payload');
    try {
        const result = await bot.send('search_test', { query: 'hello' });
        if (result.success && result.queued && result.queued.id) {
            console.log('   ✅ PASSED - Task queued:', result.queued.id.slice(0, 16) + '...');
            passed++;
        } else {
            console.log('   ❌ FAILED - Unexpected response:', result);
            failed++;
        }
    } catch (err) {
        console.log('   ❌ FAILED - Error:', err.message);
        failed++;
    }

    // Test 2: POST /next with logistics action
    console.log('\n📋 Test 2: POST /next with logistics action');
    try {
        const result = await bot.send('ship_order', { orderId: '12345' });
        if (result.success && result.queued.action === 'ship_order') {
            console.log('   ✅ PASSED - Logistics task queued');
            passed++;
        } else {
            console.log('   ❌ FAILED');
            failed++;
        }
    } catch (err) {
        console.log('   ❌ FAILED - Error:', err.message);
        failed++;
    }

    // Test 3: POST /next with human action
    console.log('\n📋 Test 3: POST /next with human review action');
    try {
        const result = await bot.send('review_document', { docId: 'abc' });
        if (result.success && result.queued.action === 'review_document') {
            console.log('   ✅ PASSED - Human task queued');
            passed++;
        } else {
            console.log('   ❌ FAILED');
            failed++;
        }
    } catch (err) {
        console.log('   ❌ FAILED - Error:', err.message);
        failed++;
    }

    // Test 4: GET /manifest
    console.log('\n📋 Test 4: GET /manifest');
    try {
        const manifest = await bot.getManifest();
        if (manifest.name === 'nextus' && manifest.agents && manifest.agents.length === 3) {
            console.log('   ✅ PASSED - Manifest has', manifest.agents.length, 'agents');
            passed++;
        } else {
            console.log('   ❌ FAILED - Invalid manifest');
            failed++;
        }
    } catch (err) {
        console.log('   ❌ FAILED - Error:', err.message);
        failed++;
    }

    // Wait for agent processing
    console.log('\n⏳ Waiting for agents to process...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📊 Results: ${passed} passed, ${failed} failed`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    bot.disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
    console.error('Test suite error:', err);
    process.exit(1);
});
