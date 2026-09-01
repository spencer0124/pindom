import { create } from 'zustand';
import type { AssistantMessage } from '@/lib/domain';

interface AssistantState {
  messages: AssistantMessage[];
  /** The course the last route answer produced — the 지도에서 코스 보기 card. */
  courseId: string | null;
  loading: boolean;
  /**
   * The question whose ask failed, so the thread can offer 다시 시도.
   *
   * Here rather than in `useAssistant` because the transcript outlives the
   * screen: leaving the chat and reopening it brings the failed turn back, and
   * a retry that lived in the hook would have gone with the unmount. Null the
   * rest of the time — a retry row under an answer redoes nothing.
   */
  failedQuestion: string | null;
  append: (message: AssistantMessage) => void;
  setCourse: (courseId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setFailedQuestion: (question: string | null) => void;
  /** 초기화 — 지금 대화를 지우고 처음부터. */
  clear: () => void;
}

/**
 * The conversation, kept across the two Assistant screens and across leaving
 * the chat: closing Pindom AI from the FAB and reopening it should not lose
 * the route it just drew. Nothing here is persisted — the transcript is the
 * session's, and a fresh launch starts at 무엇을 도와드릴까요?.
 */
export const useAssistantStore = create<AssistantState>((set) => ({
  messages: [],
  courseId: null,
  loading: false,
  failedQuestion: null,
  append: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setCourse: (courseId) => set({ courseId }),
  setLoading: (loading) => set({ loading }),
  setFailedQuestion: (failedQuestion) => set({ failedQuestion }),
  clear: () => set({ messages: [], courseId: null, loading: false, failedQuestion: null }),
}));
