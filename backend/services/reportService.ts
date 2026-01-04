import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import database from '../db/index.js';
import { IFamily, IPayment } from '../db/interface.js';

export interface MemberFilter {
    dateRange?: { start: string; end: string };
    wards?: string[];
    gender?: 'Male' | 'Female' | 'All';
    minAge?: number;
    maxAge?: number;
    bloodGroup?: string;
    maritalStatus?: string;
    rationCardType?: string;
    education?: string;
    job?: string;
}

export interface FinancialFilter {
    dateRange?: { start: string; end: string };
    paymentStatus?: 'Paid' | 'Pending' | 'All';
    wards?: string[];
    minAmount?: number;
    maxAmount?: number;
}

// Helper to filter families/members based on criteria
export function filterMembers(families: IFamily[], filters: MemberFilter) {
    let allMembers: any[] = [];

    families.forEach(family => {
        // Filter by ward
        if (filters.wards && filters.wards.length > 0) {
            if (!filters.wards.includes(family.ward)) return;
        }

        // Filter by ration card type
        if (filters.rationCardType && filters.rationCardType !== 'All') {
            if (family.rationCardType !== filters.rationCardType) return;
        }

        family.members.forEach(member => {
            // Filter by gender
            if (filters.gender && filters.gender !== 'All') {
                if (member.gender !== filters.gender) return;
            }

            // Filter by age
            if (filters.minAge && member.age < filters.minAge) return;
            if (filters.maxAge && member.age > filters.maxAge) return;

            // Filter by blood group
            if (filters.bloodGroup && filters.bloodGroup !== 'All') {
                if (member.bloodGroup !== filters.bloodGroup) return;
            }

            // Filter by marital status
            if (filters.maritalStatus && filters.maritalStatus !== 'All') {
                if (member.maritalStatus !== filters.maritalStatus) return;
            }

            // Filter by education
            if (filters.education && filters.education.trim()) {
                if (!member.education || !member.education.toLowerCase().includes(filters.education.toLowerCase())) return;
            }

            // Filter by job
            if (filters.job && filters.job.trim()) {
                if (!member.job || !member.job.toLowerCase().includes(filters.job.toLowerCase())) return;
            }

            allMembers.push({
                ...member,
                familyCode: family.code,
                familyHead: family.headName,
                ward: family.ward,
                address: family.address,
                rationCardType: family.rationCardType
            });
        });
    });

    return allMembers;
}

// Helper to filter payments based on criteria
export function filterPayments(payments: IPayment[], filters: FinancialFilter) {
    return payments.filter(payment => {
        // Filter by date range
        if (filters.dateRange) {
            const paymentDate = new Date(payment.date);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            if (paymentDate < startDate || paymentDate > endDate) return false;
        }

        // Filter by payment status
        if (filters.paymentStatus && filters.paymentStatus !== 'All') {
            if (payment.status !== filters.paymentStatus) return false;
        }

        // Filter by amount range
        if (filters.minAmount && payment.amount < filters.minAmount) return false;
        if (filters.maxAmount && payment.amount > filters.maxAmount) return false;

        return true;
    });
}

// Export Members to Excel
export async function exportMembersToExcel(filters: MemberFilter): Promise<ExcelJS.Buffer> {
    const families = await database.getAllFamilies();
    const members = filterMembers(families, filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Members Data');

    // Define columns
    worksheet.columns = [
        { header: 'Family Code', key: 'familyCode', width: 15 },
        { header: 'Family Head', key: 'familyHead', width: 20 },
        { header: 'Ward', key: 'ward', width: 12 },
        { header: 'Member Name', key: 'name', width: 20 },
        { header: 'Relation', key: 'relation', width: 12 },
        { header: 'Age', key: 'age', width: 8 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Blood Group', key: 'bloodGroup', width: 12 },
        { header: 'Education', key: 'education', width: 15 },
        { header: 'Job', key: 'job', width: 15 },
        { header: 'Marital Status', key: 'maritalStatus', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'DOB', key: 'dob', width: 15 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Ration Card', key: 'rationCardType', width: 12 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10b981' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    members.forEach(member => {
        worksheet.addRow({
            familyCode: member.familyCode,
            familyHead: member.familyHead,
            ward: member.ward,
            name: member.name,
            relation: member.relation,
            age: member.age,
            gender: member.gender,
            phone: member.phone || 'N/A',
            bloodGroup: member.bloodGroup || 'N/A',
            education: member.education || 'N/A',
            job: member.job || 'N/A',
            maritalStatus: member.maritalStatus || 'N/A',
            email: member.email || 'N/A',
            dob: member.dob || 'N/A',
            address: member.address,
            rationCardType: member.rationCardType || 'N/A'
        });
    });

    // Apply borders to all cells
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    return await workbook.xlsx.writeBuffer();
}

// Export Members to PDF
export async function exportMembersToPDF(filters: MemberFilter): Promise<Buffer> {
    const families = await database.getAllFamilies();
    const members = filterMembers(families, filters);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text('Members Directory Report', { align: 'center' });
        doc.moveDown();

        // Filters summary
        doc.fontSize(10).font('Helvetica');
        if (filters.wards && filters.wards.length > 0) {
            doc.text(`Wards: ${filters.wards.join(', ')}`);
        }
        if (filters.gender && filters.gender !== 'All') {
            doc.text(`Gender: ${filters.gender}`);
        }
        if (filters.minAge || filters.maxAge) {
            doc.text(`Age Range: ${filters.minAge || 0} - ${filters.maxAge || '∞'}`);
        }
        doc.text(`Total Members: ${members.length}`);
        doc.moveDown();

        // Table headers
        const startY = doc.y;
        const colWidths = [60, 80, 50, 40, 60, 60, 50];
        const headers = ['Family Code', 'Name', 'Relation', 'Age', 'Gender', 'Phone', 'Ward'];

        doc.fontSize(9).font('Helvetica-Bold');
        let x = 30;
        headers.forEach((header, i) => {
            doc.text(header, x, startY, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
        });

        doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica').fontSize(8);
        members.forEach((member, index) => {
            if (doc.y > 750) {
                doc.addPage();
            }

            const rowY = doc.y;
            x = 30;

            const rowData = [
                member.familyCode,
                member.name,
                member.relation,
                member.age.toString(),
                member.gender,
                member.phone || 'N/A',
                member.ward
            ];

            rowData.forEach((data, i) => {
                doc.text(data, x, rowY, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });

            doc.moveDown(0.8);
        });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
    });
}

// Export Financial Data to Excel
export async function exportFinancialToExcel(filters: FinancialFilter): Promise<ExcelJS.Buffer> {
    const allPayments = await database.getAllPayments();
    const families = await database.getAllFamilies();
    const payments = filterPayments(allPayments, filters);

    // Create a map for quick family lookup
    const familyMap = new Map<string, IFamily>();
    families.forEach(f => familyMap.set(f.id, f));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Financial Data');

    // Define columns
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Family Code', key: 'familyCode', width: 15 },
        { header: 'Family Head', key: 'familyHead', width: 20 },
        { header: 'Ward', key: 'ward', width: 12 },
        { header: 'Member Name', key: 'memberName', width: 20 },
        { header: 'Title', key: 'title', width: 25 },
        { header: 'Amount (₹)', key: 'amount', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Method', key: 'method', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3b82f6' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    let totalPaid = 0;
    let totalPending = 0;

    payments.forEach(payment => {
        const family = familyMap.get(payment.familyId);

        worksheet.addRow({
            date: payment.date,
            familyCode: family?.code || 'N/A',
            familyHead: family?.headName || 'N/A',
            ward: family?.ward || 'N/A',
            memberName: payment.memberName || 'N/A',
            title: payment.title || 'N/A',
            amount: payment.amount,
            status: payment.status || 'N/A',
            type: payment.type || 'N/A',
            method: payment.method || 'N/A'
        });

        if (payment.status === 'Paid') {
            totalPaid += payment.amount;
        } else {
            totalPending += payment.amount;
        }
    });

    // Add summary rows
    worksheet.addRow({});
    worksheet.addRow({
        familyCode: 'SUMMARY',
        familyHead: '',
        ward: '',
        memberName: '',
        title: 'Total Paid',
        amount: totalPaid,
        status: '',
        type: '',
        method: ''
    });
    worksheet.addRow({
        familyCode: '',
        familyHead: '',
        ward: '',
        memberName: '',
        title: 'Total Pending',
        amount: totalPending,
        status: '',
        type: '',
        method: ''
    });
    worksheet.addRow({
        familyCode: '',
        familyHead: '',
        ward: '',
        memberName: '',
        title: 'Grand Total',
        amount: totalPaid + totalPending,
        status: '',
        type: '',
        method: ''
    });

    // Style summary rows
    const lastRow = worksheet.lastRow?.number || 0;
    for (let i = lastRow - 2; i <= lastRow; i++) {
        const row = worksheet.getRow(i);
        row.font = { bold: true };
        row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFf3f4f6' }
        };
    }

    // Apply borders to all cells
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    return await workbook.xlsx.writeBuffer();
}

// Export Financial Data to PDF
export async function exportFinancialToPDF(filters: FinancialFilter): Promise<Buffer> {
    const allPayments = await database.getAllPayments();
    const families = await database.getAllFamilies();
    const payments = filterPayments(allPayments, filters);

    // Create a map for quick family lookup
    const familyMap = new Map<string, IFamily>();
    families.forEach(f => familyMap.set(f.id, f));

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text('Financial Statement Report', { align: 'center' });
        doc.moveDown();

        // Filters summary
        doc.fontSize(10).font('Helvetica');
        if (filters.dateRange) {
            doc.text(`Date Range: ${filters.dateRange.start} to ${filters.dateRange.end}`);
        }
        if (filters.paymentStatus && filters.paymentStatus !== 'All') {
            doc.text(`Status: ${filters.paymentStatus}`);
        }
        doc.text(`Total Transactions: ${payments.length}`);
        doc.moveDown();

        // Calculate totals
        let totalPaid = 0;
        let totalPending = 0;
        payments.forEach(p => {
            if (p.status === 'Paid') totalPaid += p.amount;
            else totalPending += p.amount;
        });

        // Summary stats
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`Total Paid: ₹${totalPaid}`, { continued: true }).text(`    Total Pending: ₹${totalPending}`);
        doc.text(`Grand Total: ₹${totalPaid + totalPending}`);
        doc.moveDown();

        // Table headers
        const startY = doc.y;
        const colWidths = [60, 80, 60, 50, 80, 50];
        const headers = ['Date', 'Family', 'Member', 'Amount', 'Title', 'Status'];

        doc.fontSize(9).font('Helvetica-Bold');
        let x = 30;
        headers.forEach((header, i) => {
            doc.text(header, x, startY, { width: colWidths[i], align: 'left' });
            x += colWidths[i];
        });

        doc.moveTo(30, doc.y).lineTo(570, doc.y).stroke();
        doc.moveDown(0.5);

        // Table rows
        doc.font('Helvetica').fontSize(8);
        payments.forEach((payment) => {
            if (doc.y > 750) {
                doc.addPage();
            }

            const family = familyMap.get(payment.familyId);
            const rowY = doc.y;
            x = 30;

            const rowData = [
                payment.date,
                family?.headName || 'N/A',
                payment.memberName || 'N/A',
                `₹${payment.amount}`,
                payment.title || 'N/A',
                payment.status || 'N/A'
            ];

            rowData.forEach((data, i) => {
                doc.text(data, x, rowY, { width: colWidths[i], align: 'left' });
                x += colWidths[i];
            });

            doc.moveDown(0.8);
        });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
    });
}
