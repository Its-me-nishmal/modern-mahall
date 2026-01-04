import toast from 'react-hot-toast';

// Custom toast styles
const toastStyles = {
    success: {
        duration: 3000,
        style: {
            background: '#10b981',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
        },
    },
    error: {
        duration: 4000,
        style: {
            background: '#ef4444',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
        },
    },
    loading: {
        style: {
            background: '#3b82f6',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
        },
    },
    info: {
        duration: 3000,
        style: {
            background: '#3b82f6',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
        },
    },
};

export const showToast = {
    success: (message: string) => toast.success(message, toastStyles.success),
    error: (message: string) => toast.error(message, toastStyles.error),
    loading: (message: string) => toast.loading(message, toastStyles.loading),
    info: (message: string) => toast(message, toastStyles.info),
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(
            promise,
            {
                loading: messages.loading,
                success: messages.success,
                error: messages.error,
            },
            {
                success: toastStyles.success,
                error: toastStyles.error,
                loading: toastStyles.loading,
            }
        );
    },
};

// Alternative: replace window.alert
export const replaceAlert = (message: string) => {
    showToast.info(message);
};
