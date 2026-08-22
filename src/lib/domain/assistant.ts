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
}

export interface AssistantAsk {
  message: string;
  /** The recent turns, oldest first. The server decides how many it reads. */
  history: AssistantMessage[];
  /** The 최애 the conversation is keyed to, so a route answer is theirs. */
  artistId?: string;
}

export interface AssistantReply {
  text: string;
  /**
   * Present when the answer produced a route — the 코스 the 지도에서 코스 보기
   * card opens. A `courses` document, readable like any other.
   */
  courseId?: string;
}
