import { Router, Request, Response } from 'express';
import {
    exportMembersToExcel,
    exportMembersToPDF,
    exportFinancialToExcel,
    exportFinancialToPDF,
    MemberFilter,
    FinancialFilter
} from '../services/reportService.js';

const router = Router();

// Export Members Data
router.post('/members/export', async (req: Request, res: Response) => {
    try {
        const { format, filters } = req.body as { format: 'pdf' | 'excel'; filters: MemberFilter };

        if (!format || (format !== 'pdf' && format !== 'excel')) {
            return res.status(400).json({ message: 'Invalid format. Must be "pdf" or "excel"' });
        }

        let buffer: Buffer;
        let filename: string;
        let contentType: string;

        if (format === 'pdf') {
            buffer = await exportMembersToPDF(filters || {});
            filename = `members_report_${new Date().toISOString().split('T')[0]}.pdf`;
            contentType = 'application/pdf';
        } else {
            buffer = Buffer.from(await exportMembersToExcel(filters || {}));
            filename = `members_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Error exporting members:', error);
        res.status(500).json({ message: 'Error generating report', error: (error as Error).message });
    }
});

// Export Financial Data
router.post('/financial/export', async (req: Request, res: Response) => {
    try {
        const { format, filters } = req.body as { format: 'pdf' | 'excel'; filters: FinancialFilter };

        if (!format || (format !== 'pdf' && format !== 'excel')) {
            return res.status(400).json({ message: 'Invalid format. Must be "pdf" or "excel"' });
        }

        let buffer: Buffer;
        let filename: string;
        let contentType: string;

        if (format === 'pdf') {
            buffer = await exportFinancialToPDF(filters || {});
            filename = `financial_report_${new Date().toISOString().split('T')[0]}.pdf`;
            contentType = 'application/pdf';
        } else {
            buffer = Buffer.from(await exportFinancialToExcel(filters || {}));
            filename = `financial_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Error exporting financial data:', error);
        res.status(500).json({ message: 'Error generating report', error: (error as Error).message });
    }
});

export default router;
