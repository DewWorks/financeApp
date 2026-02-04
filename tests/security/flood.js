// Run with: node tests/security/flood.js
// Purpose: Test if the Rate Limiter blocks excessive requests from the same IP.

async function run() {
    console.log('--- STARTING FLOOD ATTACK SIMULATION ---');
    console.log('Target: http://localhost:3000/api/auth/login');

    const attempts = 10;
    let blocked = false;

    for (let i = 1; i <= attempts; i++) {
        try {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'flood_test@example.com',
                    password: 'random_password_' + i
                })
            });

            console.log(`Attempt ${i}: Status ${res.status} ${res.statusText}`);

            if (res.status === 429) {
                console.log('✅ SUCCESS: Request BLOCKED by Rate Limiter (429 Too Many Requests).');
                blocked = true;
                break;
            }
        } catch (error) {
            console.error(`Attempt ${i} Failed: Server might be down.`, error.message);
        }
    }

    if (!blocked) {
        console.warn('⚠️ WARNING: Rate Limiter did NOT trigger. Check configuration.');
    }
}

run();
