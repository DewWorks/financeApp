// Run with: node tests/security/mfa_test.js
// Purpose: Test the MFA Send Endpoint (Validation, Rate Limit, Logic)

async function run() {
    console.log('--- TESTING MFA SEND ENDPOINT ---');
    const endpoint = 'http://localhost:3000/api/auth/mfa/send';

    // 1. Test Missing Parameters
    console.log('\n[1] Testing Missing Parameters...');
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Empty body
        });
        console.log(`Status: ${res.status} (Expected 400)`);
        if (res.status === 400) console.log('✅ PASS');
        else console.log('❌ FAIL');
    } catch (e) { console.error('Error:', e.message); }

    // 2. Test Invalid User ID (Random Mongo ID)
    console.log('\n[2] Testing Non-Existent User...');
    try {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: fakeId, channel: 'email' })
        });
        console.log(`Status: ${res.status} (Expected 404)`);
        if (res.status === 404) console.log('✅ PASS');
        else console.log('❌ FAIL');
    } catch (e) { console.error('Error:', e.message); }

    // 3. Test Rate Limit (Flood)
    console.log('\n[3] Testing Rate Limiting (Flood)...');
    for (let i = 1; i <= 5; i++) {
        try {
            // Using a fake ID just to trigger the rate limiter checks (which happen before DB check usually or after?)
            // Actually in the code: Rate Limit is step 1. So we can test it with any payload.
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: '507f1f77bcf86cd799439011', channel: 'email' })
            });
            process.stdout.write(`Attempt ${i}: ${res.status}  `);
            if (res.status === 429) {
                console.log('\n✅ PASS: Rate Limiter Triggered!');
                break;
            }
        } catch (e) { }
    }
    console.log('\n--- TEST COMPLETE ---');
}

run();
