import { MOCK_FAMILIES, MOCK_ANNOUNCEMENTS, MOCK_PAYMENTS, MOCK_FEEDBACK, MOCK_LOGS } from '../../services/mockData';
import { writeData, initializeDB } from '../db/fsdb';
import { Family, FamilyMember, Payment, Status, UserRole } from '../../types';

// Admin User Seed
const ADMIN_USER = {
    id: 'admin1',
    mobile: process.env.ADMIN_MOBILE || '9999999999',
    otp: process.env.ADMIN_OTP || '111111',
    role: 'ADMIN',
    name: 'Super Admin'
};

async function seed() {
    console.log("Starting DB Seeding...");
    await initializeDB();

    console.log("Seeding Families...");
    await writeData('families.json', MOCK_FAMILIES);

    console.log("Seeding Announcements...");
    await writeData('announcements.json', MOCK_ANNOUNCEMENTS);

    console.log("Seeding Payments...");
    await writeData('payments.json', MOCK_PAYMENTS);

    console.log("Seeding Feedbacks...");
    await writeData('feedbacks.json', MOCK_FEEDBACK);

    console.log("Seeding Logs...");
    await writeData('logs.json', MOCK_LOGS);

    // Seed Admin (saving to a separate file for now, though it could be in users or config)
    console.log("Seeding Admin...");
    await writeData('admins.json', [ADMIN_USER]);


    // Generate "Much Seeds" - Extra data for testing
    console.log("Generating extra random data...");
    const extraFamilies: Family[] = [];
    const extraPayments: Payment[] = [];

    for (let i = 5; i <= 55; i++) { // Generate 50 more families
        const familyId = `f${i}`;
        const headId = `u${i}`;
        const headName = `Head ${i}`;
        const phone = `91${1000000000 + i}`;

        const headMember: FamilyMember = {
            id: `m${i}_1`,
            familyId: familyId,
            name: headName,
            relation: 'Head',
            age: 30 + (i % 30),
            gender: 'Male',
            status: Status.APPROVED,
            phone: phone
        };

        const family: Family = {
            id: familyId,
            code: `MH-${100 + i}`,
            headName: headName,
            headId: headId,
            ward: `Ward ${(i % 5) + 1}`,
            address: `${i} Random St`,
            status: Status.APPROVED,
            paymentStatus: i % 3 === 0 ? 'Paid' : 'Unpaid',
            balance: i % 3 === 0 ? 0 : 500,
            members: [headMember]
        };
        extraFamilies.push(family);

        if (i % 2 === 0) {
            extraPayments.push({
                id: `p${i}_new`,
                familyId: familyId,
                memberId: headMember.id,
                memberName: headName,
                amount: 500,
                date: new Date().toISOString().split('T')[0],
                type: 'Monthly Fee',
                title: 'Monthly Subscription',
                status: 'Paid'
            });
        }
    }

    // Append extra data to existing mock data
    const allFamilies = [...MOCK_FAMILIES, ...extraFamilies];
    const allPayments = [...MOCK_PAYMENTS, ...extraPayments];

    await writeData('families.json', allFamilies);
    await writeData('payments.json', allPayments);

    console.log(`Seeding Complete! Total Families: ${allFamilies.length}, Total Payments: ${allPayments.length}`);
}

seed().catch(console.error);
