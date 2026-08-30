/**
 * One turn of the Pindom AI conversation, as the client keeps it.
 *
 * The assistant is the backend's: the model, the prompt and the tools behind
 * a route answer all live there (docs/reference/external-apis.md §6). The
 * client holds the transcript so it can send the recent turns back as
 * context, and nothing else.
 */
export interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
  /** What the answer pointed at, when it pointed at somewhere. Drawn under the bubble. */
  map?: AssistantMap;
}

/** A 촬영지 an answer named, with what the map needs to pin it. */
export interface AssistantStop {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  region?: string;
}

/** A café · 음식점 · 관광지 the answer recommended. Not a 촬영지 — no ticket here. */
export interface AssistantSuggestion {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  placeUrl?: string;
}

/**
 * The map an answer draws inside the thread.
 *
 * The server does the finding: `stops` are 촬영지 documents it looked up,
 * `path` is 카카오모빌리티's road geometry for the drive through them, and
 * `suggestions` are the POIs it recommended along the way. The client only
 * frames and draws them — it re-derives none of it.
 */
export interface AssistantMap {
  stops: AssistantStop[];
  suggestions: AssistantSuggestion[];
  /** Road geometry through the stops. Empty when the answer named places but planned no drive. */
  path: { lat: number; lng: number }[];
  /** `stops` are in driving order, so the pins carry numbers. */
  ordered: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
}

export interface AssistantAsk {
  message: string;
  /** The recent turns, oldest first. The server decides how many it reads. */
  history: AssistantMessage[];
  /** The 최애 the conversation is keyed to, so a route answer is theirs. */
  artistId?: string;
  /**
   * Where the user is, when they allowed it — the contract's `near`.
   *
   * Without it the assistant can only answer with every 촬영지 in the country,
   * and its own prompt tells it to ask for a location rather than stop. Sending
   * it is what makes "가까운 순으로" possible on the first turn.
   */
  near?: { lat: number; lng: number };
}

export interface AssistantReply {
  text: string;
  /** Present when the answer named 촬영지 or drew a drive through them. */
  map?: AssistantMap;
  /**
   * Present when the answer produced a route — the 코스 the 지도에서 코스 보기
   * card opens. A `courses` document, readable like any other.
   */
  courseId?: string;
}
