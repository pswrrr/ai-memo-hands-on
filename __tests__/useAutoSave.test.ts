// __tests__/useAutoSave.test.ts
// useAutoSave 훅 테스트 - 자동 저장 기능 검증
// 타이머 로직, 저장 상태 관리, 중복 저장 방지 등을 테스트
// hooks/useAutoSave.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';

// Mock timers
jest.useFakeTimers();

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const mockOnSave = jest.fn();
    const { result } = renderHook(() =>
      useAutoSave({ title: 'Test', content: 'Content' }, { onSave: mockOnSave })
    );

    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.lastSaved).toBeNull();
  });

  it('데이터 변경 시 자동 저장이 실행되어야 함', async () => {
    const mockOnSave = jest.fn().mockResolvedValue({ success: true });
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, { onSave: mockOnSave, delay: 1000 }),
      { initialProps: { data: { title: 'Test', content: 'Content' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Updated', content: 'Updated Content' } });

    // 타이머 실행
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({ title: 'Updated', content: 'Updated Content' });
    });

    expect(result.current.saveStatus).toBe('saved');
  });

  it('저장 실패 시 에러 상태가 되어야 함', async () => {
    const mockOnSave = jest.fn().mockResolvedValue({ success: false, error: 'Save failed' });
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, { onSave: mockOnSave, delay: 1000 }),
      { initialProps: { data: { title: 'Test', content: 'Content' } } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Updated', content: 'Updated Content' } });

    // 타이머 실행
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('error');
    });
  });

  it('수동 저장이 올바르게 작동해야 함', async () => {
    const mockOnSave = jest.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() =>
      useAutoSave({ title: 'Test', content: 'Content' }, { onSave: mockOnSave })
    );

    await act(async () => {
      await result.current.save();
    });

    expect(mockOnSave).toHaveBeenCalled();
    expect(result.current.saveStatus).toBe('saved');
  });

  it('리셋이 올바르게 작동해야 함', () => {
    const mockOnSave = jest.fn();
    const { result } = renderHook(() =>
      useAutoSave({ title: 'Test', content: 'Content' }, { onSave: mockOnSave })
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.lastSaved).toBeNull();
  });

  it('enabled가 false일 때 자동 저장이 실행되지 않아야 함', () => {
    const mockOnSave = jest.fn();
    const { rerender } = renderHook(
      ({ data, enabled }) => useAutoSave(data, { onSave: mockOnSave, enabled, delay: 1000 }),
      { initialProps: { data: { title: 'Test', content: 'Content' }, enabled: false } }
    );

    // 데이터 변경
    rerender({ data: { title: 'Updated', content: 'Updated Content' }, enabled: false });

    // 타이머 실행
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('중복 저장이 방지되어야 함', async () => {
    const mockOnSave = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, { onSave: mockOnSave, delay: 1000 }),
      { initialProps: { data: { title: 'Test', content: 'Content' } } }
    );

    // 첫 번째 저장 시작
    rerender({ data: { title: 'Updated1', content: 'Content1' } });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // 두 번째 저장 시도 (저장 중이므로 실행되지 않아야 함)
    rerender({ data: { title: 'Updated2', content: 'Content2' } });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });
});
