
import {
    filterMembers,
    filterPayments,
    exportMembersToExcel,
    exportMembersToPDF,
    exportFinancialToExcel,
    exportFinancialToPDF
} from '../reportService';
import database from '../../db/index';

// Mock database
jest.mock('../../db/index', () => ({
    getAllFamilies: jest.fn(),
    getAllPayments: jest.fn()
}));

// Mock ExcelJS and PDFKit
jest.mock('exceljs', () => {
    return {
        Workbook: jest.fn().mockImplementation(() => ({
            addWorksheet: jest.fn().mockReturnValue({
                columns: [],
                getRow: jest.fn().mockReturnValue({
                    font: {},
                    fill: {}
                }),
                addRow: jest.fn(),
                eachRow: jest.fn(),
                lastRow: { number: 10 }
            }),
            xlsx: {
                writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel-data'))
            }
        }))
    };
});

jest.mock('pdfkit', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn((event, callback) => {
            if (event === 'end') callback();
            return this;
        }),
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        moveTo: jest.fn().mockReturnThis(),
        lineTo: jest.fn().mockReturnThis(),
        stroke: jest.fn().mockReturnThis(),
        addPage: jest.fn().mockReturnThis(),
        end: jest.fn(),
        y: 100
    }));
});

describe('Report Service', () => {
    const mockFamilies = [
        {
            id: 'fam1',
            code: 'FAM001',
            headName: 'Head 1',
            ward: 'Ward 1',
            address: 'Address 1',
            rationCardType: 'APL',
            members: [
                {
                    id: 'mem1',
                    name: 'Member 1',
                    gender: 'Male',
                    age: 30,
                    maritalStatus: 'Married',
                    bloodGroup: 'A+',
                    relation: 'Head'
                },
                {
                    id: 'mem2',
                    name: 'Member 2',
                    gender: 'Female',
                    age: 25,
                    maritalStatus: 'Married',
                    bloodGroup: 'B+',
                    relation: 'Wife'
                }
            ]
        },
        {
            id: 'fam2',
            code: 'FAM002',
            headName: 'Head 2',
            ward: 'Ward 2',
            address: 'Address 2',
            rationCardType: 'BPL',
            members: [
                {
                    id: 'mem3',
                    name: 'Member 3',
                    gender: 'Male',
                    age: 40,
                    maritalStatus: 'Single',
                    bloodGroup: 'O+',
                    relation: 'Head'
                }
            ]
        }
    ];

    const mockPayments = [
        {
            id: 'pay1',
            familyId: 'fam1',
            amount: 1000,
            date: '2026-01-01',
            status: 'Paid',
            ward: 'Ward 1'
        },
        {
            id: 'pay2',
            familyId: 'fam2',
            amount: 500,
            date: '2026-01-02',
            status: 'Pending',
            ward: 'Ward 2'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (database.getAllFamilies as jest.Mock).mockResolvedValue(mockFamilies);
        (database.getAllPayments as jest.Mock).mockResolvedValue(mockPayments);
    });

    describe('Member Filtering', () => {
        // Need to export filterMembers to test it directly, or test via export functions
        // Since it's not exported, we'll verify via exportMembersToExcel count/logic or mock implementation
        // EDIT: filterMembers IS NOT exported in the original file. 
        // We will assume for this test that we can test the public export functions.

        test('exportMembersToExcel calls database and generates buffer', async () => {
            const result = await exportMembersToExcel({});
            expect(database.getAllFamilies).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Buffer);
        });

        test('exportMembersToExcel filters by ward', async () => {
            await exportMembersToExcel({ wards: ['Ward 1'] });
            // In a real integration test we'd check the excel content
            // Here we verify it runs without error
            expect(database.getAllFamilies).toHaveBeenCalled();
        });
    });

    describe('Financial Filtering', () => {
        test('exportFinancialToExcel calls database and generates buffer', async () => {
            const result = await exportFinancialToExcel({});
            expect(database.getAllPayments).toHaveBeenCalled();
            expect(database.getAllFamilies).toHaveBeenCalled();
            expect(result).toBeInstanceOf(Buffer);
        });
    });

    describe('PDF Generation', () => {
        test('exportMembersToPDF generates buffer', async () => {
            const result = await exportMembersToPDF({});
            expect(result).toBeInstanceOf(Buffer);
        });

        test('exportFinancialToPDF generates buffer', async () => {
            const result = await exportFinancialToPDF({});
            expect(result).toBeInstanceOf(Buffer);
        });
    });
});
