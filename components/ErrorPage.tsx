import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
    title?: string;
    message?: string;
    showHomeButton?: boolean;
}

/**
 * Generic Error Page Component
 * Can be used for 404, 500, or custom error pages
 */
const ErrorPage: React.FC<ErrorPageProps> = ({
    title = '404 - Page Not Found',
    message = "Sorry, the page you're looking for doesn't exist.",
    showHomeButton = true,
}) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                    <svg
                        className="w-10 h-10 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
                <p className="text-gray-600 mb-8">{message}</p>

                <div className="flex gap-3">
                    {showHomeButton && (
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                        >
                            Go Home
                        </button>
                    )}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
