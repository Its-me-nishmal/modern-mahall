
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../AdminDashboard';

// Mock Recharts to avoid rendering issues in test env
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: () => <div>PieChart</div>,
    Pie: () => <div>Pie</div>,
    Cell: () => <div>Cell</div>,
    BarChart: () => <div>BarChart</div>,
    Bar: () => <div>Bar</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>CartesianGrid</div>,
    Tooltip: () => <div>Tooltip</div>,
    Legend: () => <div>Legend</div>,
    LineChart: () => <div>LineChart</div>,
    Line: () => <div>Line</div>
}));

// Mock props
const mockProps = {
    families: [
        {
            id: '1',
            code: 'FAM001',
            headName: 'Family 1',
            headId: 'h1',
            ward: 'Ward 1',
            address: 'Addr 1',
            members: [],
            status: 'approved',
            balance: 0,
            paymentStatus: 'Paid'
        }
    ],
    logs: [],
    announcements: [],
    payments: [],
    feedbacks: [],
    onApproveFamily: jest.fn(),
    onApproveMember: jest.fn(),
    onRejectMember: jest.fn(),
    onEditMember: jest.fn(),
    onUpdateFamily: jest.fn(),
    onCreateAnnouncement: jest.fn(),
    onDeleteAnnouncement: jest.fn(),
    onBulkPaymentCreate: jest.fn(),
    onCreatePayment: jest.fn(),
    onMarkPaymentPaid: jest.fn(),
    onDeletePayment: jest.fn(),
    onTabChange: jest.fn()
} as any;

describe('AdminDashboard', () => {
    test('renders overview tab by default', () => {
        render(<AdminDashboard {...mockProps} />);
        expect(screen.getByText('Admin Console')).toBeInTheDocument();
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    test('switches tabs correctly', () => {
        render(<AdminDashboard {...mockProps} />);

        const familiesTab = screen.getByText('Families');
        fireEvent.click(familiesTab);

        expect(mockProps.onTabChange).toHaveBeenCalledWith('families');
    });

    test('renders families list when family tab is active', async () => {
        render(<AdminDashboard {...mockProps} />);

        // Switch to families tab (simulation of state change logic if it was internal, 
        // strictly speaking Dashboard controls its own tab state unless purely controlled)
        // AdminDashboard seems to use internal state for activeTab based on `onTabChange` being optional 
        // or just a callback. Let's verify if we can see content.

        const familiesTab = screen.getByText('Families');
        fireEvent.click(familiesTab);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search families...')).toBeInTheDocument();
        });
    });

    test('shows report export options in reports tab', async () => {
        render(<AdminDashboard {...mockProps} />);

        const reportsTab = screen.getByText('Reports');
        fireEvent.click(reportsTab);

        await waitFor(() => {
            expect(screen.getByText('Detailed data analysis and exports')).toBeInTheDocument();
            expect(screen.getByText('Export Report')).toBeInTheDocument();
        });
    });
});
