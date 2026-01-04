import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ErrorPage from '../components/ErrorPage';

describe('ErrorPage Component', () => {
    test('renders default 404 error', () => {
        render(
            <MemoryRouter>
                <ErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/404 - Page Not Found/i)).toBeInTheDocument();
        expect(screen.getByText(/sorry, the page you're looking for doesn't exist/i)).toBeInTheDocument();
    });

    test('renders custom error message', () => {
        render(
            <MemoryRouter>
                <ErrorPage
                    title="500 - Server Error"
                    message="Something went wrong on our end."
                />
            </MemoryRouter>
        );

        expect(screen.getByText(/500 - Server Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Something went wrong on our end/i)).toBeInTheDocument();
    });

    test('shows home button by default', () => {
        render(
            <MemoryRouter>
                <ErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();
    });

    test('hides home button when showHomeButton is false', () => {
        render(
            <MemoryRouter>
                <ErrorPage showHomeButton={false} />
            </MemoryRouter>
        );

        expect(screen.queryByRole('button', { name: /Go Home/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
    });
});
