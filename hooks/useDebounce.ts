import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for debounced callbacks
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    );
}

/**
 * Custom hook for throttling callbacks
 * Useful for scroll events, resize events, etc.
 * @param callback - The callback to throttle
 * @param delay - Delay in milliseconds (default: 200ms)
 * @returns Throttled callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 200
): (...args: Parameters<T>) => void {
    const lastRun = useRef(Date.now());

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastRun.current >= delay) {
                callback(...args);
                lastRun.current = now;
            }
        },
        [callback, delay]
    );
}
