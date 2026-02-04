// Run with: node tests/security/brute_force.js
// Purpose: Simulate an attack trying multiple common passwords against a target account.

const passwords = ['123456', 'password', 'admin', 'qwerty', 'welcome', '12345678'];

async function run() {
    console.log('--- STARTING CREDENTIAL STUFFING SIMULATION ---');
    const target = 'victim@example.com';

    for (const pass of passwords) {
        try {
            console.log(`Trying password: "${pass}" for ${target}...`);
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: target,
                    password: pass
                })
            });

            if (res.status === 429) {
                console.log('✅ DEFENSE ACTIVE: Attack blocked by Rate Limiting.');
                break;
            } else if (res.status === 200) {
                console.log('❌ VULNERABILITY: Password guessed!');
                break;
            } else {
                console.log(`   -> Failed (Status ${res.status})`);
            }

        } catch (error) {
            console.error('Network Error:', error.message);
        }
    }
}

run();
