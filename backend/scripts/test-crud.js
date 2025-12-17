
const BASE_URL = 'http://127.0.0.1:3001/api';

async function test(name, fn) {
    try {
        console.log(`\n--- Testing ${name} ---`);
        await fn();
        console.log(`✅ ${name} Passed`);
    } catch (e) {
        console.error(`❌ ${name} Failed:`, e.message);
    }
}

async function testCRUD() {
    console.log('=== CRUD Operations Test ===\n');

    // Get admin token first
    let adminToken;
    await test('Admin Login', async () => {
        const res = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: '9999999999', otp: '111111' })
        });
        const data = await res.json();
        adminToken = data.token;
        if (!adminToken) throw new Error('No token');
    });

    // Test CREATE - Announcement
    let newAnnouncementId;
    await test('CREATE Announcement', async () => {
        const res = await fetch(`${BASE_URL}/data/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Test Announcement',
                description: 'This is a test announcement created via API',
                category: 'Notice',
                date: new Date().toISOString().split('T')[0]
            })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        newAnnouncementId = data.id;
        console.log('Created announcement:', data.id);
    });

    // Test READ - Get all announcements
    await test('READ Announcements', async () => {
        const res = await fetch(`${BASE_URL}/data/announcements`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log(`Found ${data.length} announcements`);
        const found = data.find(a => a.id === newAnnouncementId);
        if (!found) throw new Error('Created announcement not found');
    });

    // Test UPDATE - Announcement
    await test('UPDATE Announcement', async () => {
        const res = await fetch(`${BASE_URL}/data/announcements/${newAnnouncementId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                title: 'Updated Test Announcement',
                description: 'This announcement has been updated'
            })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.title !== 'Updated Test Announcement') throw new Error('Update failed');
        console.log('Updated announcement:', data.title);
    });

    // Test CREATE - Payment
    let newPaymentId;
    await test('CREATE Payment', async () => {
        const res = await fetch(`${BASE_URL}/data/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                familyId: 'f1',
                memberId: 'm1',
                memberName: 'Abdul Rahman',
                amount: 1000,
                date: new Date().toISOString().split('T')[0],
                type: 'Monthly Fee',
                title: 'Test Payment',
                status: 'Pending'
            })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        newPaymentId = data.id;
        console.log('Created payment:', data.id);
    });

    // Test UPDATE - Payment
    await test('UPDATE Payment Status', async () => {
        const res = await fetch(`${BASE_URL}/data/payments/${newPaymentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                status: 'Paid'
            })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.status !== 'Paid') throw new Error('Update failed');
        console.log('Updated payment status to:', data.status);
    });

    // Test DELETE - Announcement
    await test('DELETE Announcement', async () => {
        const res = await fetch(`${BASE_URL}/data/announcements/${newAnnouncementId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log('Deleted:', data.message);
    });

    // Test DELETE - Payment
    await test('DELETE Payment', async () => {
        const res = await fetch(`${BASE_URL}/data/payments/${newPaymentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        console.log('Deleted:', data.message);
    });

    // Verify deletions
    await test('VERIFY Deletions', async () => {
        const announcementsRes = await fetch(`${BASE_URL}/data/announcements`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const announcements = await announcementsRes.json();
        if (announcements.find(a => a.id === newAnnouncementId)) {
            throw new Error('Announcement still exists after deletion');
        }

        const paymentsRes = await fetch(`${BASE_URL}/data/payments`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const payments = await paymentsRes.json();
        if (payments.find(p => p.id === newPaymentId)) {
            throw new Error('Payment still exists after deletion');
        }
        console.log('Deletions verified successfully');
    });

    console.log('\n✨ All CRUD Tests Passed!');
}

testCRUD().catch(console.error);
