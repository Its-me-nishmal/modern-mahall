import { renderHook } from '@testing-library/react';
import { useDebounce, useDebouncedCallback, useThrottle } from '../hooks/useDebounce';
import { act } from 'react';

describe('useDebounce Hook', () => {
    jest.useFakeTimers();

    test('should debounce value changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: 'initial' } }
        );

        expect(result.current).toBe('initial');

        // Change value
        rerender({ value: 'changed' });
        expect(result.current).toBe('initial'); // Still old value

        // Fast forward time
        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current).toBe('changed'); // Now updated
    });

    test('should cancel previous timeout on rapid changes', () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: '1' } }
        );

        rerender({ value: '2' });
        act(() => jest.advanceTimersByTime(300));

        rerender({ value: '3' });
        act(() => jest.advanceTimersByTime(300));

        // Should still be initial value
        expect(result.current).toBe('1');

        act(() => jest.advanceTimersByTime(200));
        // Now should be latest
        expect(result.current).toBe('3');
    });
});

describe('useDebouncedCallback Hook', () => {
    jest.useFakeTimers();

    test('should debounce callback execution', () => {
        const callback = jest.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 500));

        // Call multiple times
        act(() => {
            result.current('arg1');
            result.current('arg2');
            result.current('arg3');
        });

        // Callback should not have been called yet
        expect(callback).not.toHaveBeenCalled();

        // Fast forward
        act(() => {
            jest.advanceTimersByTime(500);
        });

        // Should be called once with last argument
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('arg3');
    });
});

describe('useThrottle Hook', () => {
    jest.useFakeTimers();

    test('should throttle callback execution', () => {
        const callback = jest.fn();
        const { result } = renderHook(() => useThrottle(callback, 200));

        // First call should execute immediately
        act(() => {
            result.current('arg1');
        });
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('arg1');

        // Subsequent calls within throttle window should be ignored
        act(() => {
            result.current('arg2');
            result.current('arg3');
        });
        expect(callback).toHaveBeenCalledTimes(1); // Still 1

        // After throttle period, next call should execute
        act(() => {
            jest.advanceTimersByTime(200);
            result.current('arg4');
        });
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith('arg4');
    });
});
