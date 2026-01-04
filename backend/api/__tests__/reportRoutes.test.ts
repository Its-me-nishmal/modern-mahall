
import request from 'supertest';
import express from 'express';
import reportRoutes from '../reportRoutes';
import * as reportService from '../../services/reportService';

// Mock report service
jest.mock('../../services/reportService');

const app = express();
app.use(express.json());
app.use('/api/reports', reportRoutes);

describe('Report Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/reports/members/export', () => {
        it('should download PDF report', async () => {
            (reportService.exportMembersToPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf-content'));

            const res = await request(app)
                .post('/api/reports/members/export')
                .send({ format: 'pdf', filters: {} });

            expect(res.status).toBe(200);
            expect(res.header['content-type']).toBe('application/pdf');
            expect(res.header['content-disposition']).toContain('members_report');
        });

        it('should download Excel report', async () => {
            (reportService.exportMembersToExcel as jest.Mock).mockResolvedValue(Buffer.from('excel-content'));

            const res = await request(app)
                .post('/api/reports/members/export')
                .send({ format: 'excel', filters: {} });

            expect(res.status).toBe(200);
            expect(res.header['content-type']).toContain('spreadsheetml');
        });

        it('should return 400 for invalid format', async () => {
            const res = await request(app)
                .post('/api/reports/members/export')
                .send({ format: 'txt' });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/reports/financial/export', () => {
        it('should download PDF report', async () => {
            (reportService.exportFinancialToPDF as jest.Mock).mockResolvedValue(Buffer.from('pdf-content'));

            const res = await request(app)
                .post('/api/reports/financial/export')
                .send({ format: 'pdf', filters: {} });

            expect(res.status).toBe(200);
            expect(res.header['content-type']).toBe('application/pdf');
        });
    });
});
