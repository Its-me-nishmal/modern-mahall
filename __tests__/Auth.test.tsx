/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Auth from '../components/Auth';

// Mock API
global.fetch = jest.fn();

describe('Auth Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    test('renders login form initially', () => {
        render(<Auth onLogin={jest.fn()} onRegister={jest.fn()} />);
        expect(screen.getByText(/Login to Modern Mahall/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Mobile Number/i)).toBeInTheDocument();
    });

    test('validates mobile number format', async () => {
        render(<Auth onLogin={jest.fn()} onRegister={jest.fn()} />);

        const mobileInput = screen.getByLabelText(/Mobile Number/i);
        const sendOTPButton = screen.getByRole('button', { name: /Send OTP/i });

        // Try invalid mobile number
        fireEvent.change(mobileInput, { target: { value: '123' } });
        fireEvent.click(sendOTPButton);

        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    test('sends OTP on valid mobile number', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, message: 'OTP sent' })
        });

        render(<Auth onLogin={jest.fn()} onRegister={jest.fn()} />);

        const mobileInput = screen.getByLabelText(/Mobile Number/i);
        const sendOTPButton = screen.getByRole('button', { name: /Send OTP/i });

        fireEvent.change(mobileInput, { target: { value: '919876543210' } });
        fireEvent.click(sendOTPButton);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/send-otp'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('919876543210')
                })
            );
        });
    });

    test('shows OTP input after sending OTP', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true })
        });

        render(<Auth onLogin={jest.fn()} onRegister={jest.fn()} />);

        const mobileInput = screen.getByLabelText(/Mobile Number/i);
        fireEvent.change(mobileInput, { target: { value: '919876543210' } });

        const sendOTPButton = screen.getByRole('button', { name: /Send OTP/i });
        fireEvent.click(sendOTPButton);

        await waitFor(() => {
            expect(screen.getByLabelText(/Enter OTP/i)).toBeInTheDocument();
        });
    });
});
