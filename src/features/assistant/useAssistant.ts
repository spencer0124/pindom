import { useCallback, useEffect, useState } from 'react';
import { failureMessage } from '@/lib/api/failure-message';
import type { Artist, Course, Place } from '@/lib/domain';
import { artistRepository, assistantRepository, placeRepository } from '@/lib/repositories';
import { readPosition, useDiscoveryStore } from '@/features/discovery';
import { findCourse } from './findCourse';
import { useAssistantStore } from './state';

/** How many recent turns ride along with a question. The server decides what it reads. */
const HISTORY_TURNS = 6;

export interface AssistantChip {
  label: string;
  question: string;
}

/**
 * 1a's four chips, phrased for the 최애 and the nearest 촬영지 — the question
 * each one sends is the prototype's own.
 */
export function chipsFor(artistName: string, placeName: string): AssistantChip[] {
  return [
    {
      label: '성지순례 동선 짜기',
      question: `${artistName} 촬영지로 주말 1박 2일 동선 짜줘. 이동 순서랑 예상 이동 시간까지.`,
    },
    {
      label: '촬영지 근처 맛집 찾기',
      question: `${placeName} 근처에서 아침 일찍 여는 밥집이나 카페 알려줘.`,
    },
    {
      label: '인증하기 좋은 시간 알아보기',
      question: `${placeName}에서 GPS 인증하고 사진 찍기 좋은 시간대가 언제야? 사람 적은 시간도 알려줘.`,
    },
    {
      label: '티켓 빨리 모으는 법',
      question: '티켓 20장 모아서 팬사인회 응모하려면 어떤 코스가 가장 효율적이야?',
    },
  ];
}

/**
 * Pindom AI's one action, and the context its chips are phrased with.
 *
 * The client sends the message and the recent turns; the answer, the route
 * behind 지도에서 코스 보기 and everything about the model are the backend's.
 * A failed ask is rendered as an answer the assistant could not get, in the
 * transcript, so the conversation stays readable.
 *
 * Once an answer carries a `courseId`, the course document is read so the
 * 지도에서 코스 보기 card can print `n곳 · {course name}` — the same line 추천
 * 코스's header prints (fidelity decision 22). `course` is null until it
 * arrives, or when no list carries the id.
 */
export function useAssistant() {
  const selectedArtistId = useDiscoveryStore((s) => s.selectedArtistId);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [nearest, setNearest] = useState<Place | null>(null);
  const [course, setCourseDoc] = useState<Course | null>(null);
  const messages = useAssistantStore((s) => s.messages);
  const courseId = useAssistantStore((s) => s.courseId);
  const loading = useAssistantStore((s) => s.loading);
  const append = useAssistantStore((s) => s.append);
  const setCourse = useAssistantStore((s) => s.setCourse);
  const setLoading = useAssistantStore((s) => s.setLoading);
  const clear = useAssistantStore((s) => s.clear);

  useEffect(() => {
    let live = true;
    void (async () => {
      const position = await readPosition();
      const [mine, places] = await Promise.all([
        artistRepository.listMine(),
        placeRepository.listAll(position?.lat ?? 36.2, position?.lng ?? 127.9),
      ]);
      if (!live) return;
      const picked = mine.ok
        ? (mine.data.find((a) => a.id === selectedArtistId) ?? mine.data[0] ?? null)
        : null;
      setArtist(picked);
      const theirs = places.ok
        ? places.data.find((p) => picked == null || p.artistIds.includes(picked.id)) ?? places.data[0] ?? null
        : null;
      setNearest(theirs);
    })();
    return () => {
      live = false;
    };
  }, [selectedArtistId]);

  useEffect(() => {
    if (courseId == null) {
      setCourseDoc(null);
      return;
    }
    let live = true;
    void findCourse(courseId, selectedArtistId).then((found) => {
      if (live) setCourseDoc(found);
    });
    return () => {
      live = false;
    };
  }, [courseId, selectedArtistId]);

  const ask = useCallback(
    async (question: string) => {
      const message = question.trim();
      if (!message || loading) return;
      // Text only: the server reads the words, and a turn's map payload would
      // just be the same coordinates travelling back to where they came from.
      const history = messages.slice(-HISTORY_TURNS).map((m) => ({ role: m.role, text: m.text }));
      append({ role: 'user', text: message });
      setLoading(true);
      // Cached from the permission the onboarding already asked for; null when it
      // was refused, and the assistant answers without it rather than stopping.
      const position = await readPosition();
      const result = await assistantRepository.ask({
        message,
        history,
        ...(artist != null && { artistId: artist.id }),
        ...(position != null && { near: { lat: position.lat, lng: position.lng } }),
      });
      setLoading(false);
      if (!result.ok) {
        append({ role: 'assistant', text: failureMessage(result.failure) });
        return;
      }
      append({
        role: 'assistant',
        text: result.data.text,
        ...(result.data.map != null && { map: result.data.map }),
      });
      if (result.data.courseId != null) setCourse(result.data.courseId);
    },
    [messages, loading, artist, append, setLoading, setCourse],
  );

  const chips = chipsFor(artist?.name ?? '최애', nearest?.name ?? '촬영지');

  return { artist, messages, courseId, course, loading, chips, ask, clear };
}
