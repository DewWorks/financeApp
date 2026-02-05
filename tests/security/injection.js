// Run with: node tests/security/injection.js
// Purpose: Test if the API is vulnerable to NoSQL Injection (MongoDB) or XSS.

const payloads = [
    { email: { "$gt": "" }, password: "password" }, // NoSQL Injection (Expression)
    { email: "admin' OR '1'='1", password: "password" }, // SQL Injection (Classic)
    { email: "<script>alert(1)</script>", password: "password" } // XSS Payload
];

async function run() {
    console.log('--- STARTING INJECTION ATTACK SIMULATION ---');
    console.log('Target: http://localhost:3000/api/auth/login');

    for (const payload of payloads) {
        try {
            console.log(`\n💉 Injecting Payload: ${JSON.stringify(payload)}`);
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.status === 200) {
                console.log('❌ CRITICAL: Injection Succeeded (Login bypassed!)');
            } else if (res.status === 500) {
                console.log('⚠️ WARNING: Server Crashed (Unhandled Exception). Check logs.');
            } else {
                console.log(`✅ BLOCKED: Server returned ${res.status} (Likely 400 Bad Request or 401 Unauthorized).`);
            }
        } catch (error) {
            console.error('Network Error:', error.message);
        }
    }
}

run();
