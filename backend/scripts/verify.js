
const BASE_URL = 'http://127.0.0.1:3001/api';

async function test(name, fn) {
    try {
        console.log(`\n--- Testing ${name} ---`);
        await fn();
        console.log(`✅ ${name} Passed`);
    } catch (e) {
        console.error(`❌ ${name} Failed:`, e.message);
        if (e.response) {
            console.error('Response:', await e.response.text());
        }
    }
}

async function verify() {
    // 1. Health Check
    await test('Health Check', async () => {
        const res = await fetch(`${BASE_URL}/health`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log('Health:', data);
    });

    // 2. Admin Login
    let adminToken;
    await test('Admin Login', async () => {
        const res = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: '9999999999', otp: '111111' })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log('Admin Auth:', data);
        adminToken = data.token;
        if (!adminToken) throw new Error('No token returned');
    });

    // 3. User Login (Head)
    // Using one of the seeded extra families: Head 5 (mobile: 911000000005)
    let userToken;
    let userId;
    await test('User (Head) Login', async () => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: '911000000005', otp: '123456' })
        });
        if (!res.ok) throw new Error(`Status ${res.status}: ${await res.text()}`);
        const data = await res.json();
        console.log('User Auth:', data);
        userToken = data.token;
        userId = data.user.id;
        if (!userToken) throw new Error('No token returned');
    });

    // 4. Fetch Data Protected (Families)
    await test('Fetch Families', async () => {
        const res = await fetch(`${BASE_URL}/data/families`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log(`Fetched ${data.length} families`);
        const found = data.find(f => f.members.some(m => m.id === userId));
        if (!found) throw new Error('Logged in user family not found in data');
        console.log('User Family Found:', found.id);
    });

    // 5. Fetch Logs
    await test('Fetch Logs', async () => {
        const res = await fetch(`${BASE_URL}/data/logs`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log(`Fetched ${data.length} logs`);
    });

    // 6. Fetch Announcements
    await test('Fetch Announcements', async () => {
        const res = await fetch(`${BASE_URL}/data/announcements`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log(`Fetched ${data.length} announcements`);
    });

    // 7. Fetch Payments
    await test('Fetch Payments', async () => {
        const res = await fetch(`${BASE_URL}/data/payments`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log(`Fetched ${data.length} payments`);
    });

    // 8. Fetch Feedbacks
    await test('Fetch Feedbacks', async () => {
        const res = await fetch(`${BASE_URL}/data/feedbacks`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log(`Fetched ${data.length} feedbacks`);
    });

    console.log('\n✨ Verification Complete!');
}

verify().catch(console.error);
