'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';

import Link from '@/components/Link';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

import '@/styles/chat.css';

type ChatRole = 'user' | 'assistant';

type ChatSource = {
  title: string;
  url: string;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  status?: string;
  sources?: ChatSource[];
  messageId?: string;
  feedback?: 'up' | 'down' | null;
  failed?: boolean;
  askLead?: boolean;
  askRating?: boolean;
};

type AiConfig = {
  ok?: boolean;
  enabled?: boolean;
  welcome?: string;
  suggestions?: string[];
  contactUrl?: string;
  maxMessageChars?: number;
  leadAfter?: number;
  leadRequired?: boolean;
  leadPrompt?: string;
  ratingPrompt?: string;
  teaserDelay?: number;
};

type RatingValue = 'good' | 'ok' | 'bad';

const SESSION_KEY = 'esa-chat-session';
const LOG_KEY = 'esa-chat-log';
const CONV_KEY = 'esa-chat-conv';
const SEEN_KEY = 'esa-chat-seen';
const LEAD_KEY = 'esa-chat-lead';
const RATED_KEY = 'esa-chat-rated';
const MAX_LOGGED_MESSAGES = 30;
const DEFAULT_MAX_CHARS = 1000;
const TEASER_MAX_CHARS = 120;
const MOBILE_QUERY = '(max-width: 639px)';
const ERROR_TEXT = 'Nu am putut trimite mesajul. Încearcă din nou.';
const RATING_THANKS = 'Mulțumim pentru feedback!';

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // cădem pe fallback
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = createId();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return createId();
  }
}

function readFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // stocarea poate fi indisponibilă
  }
}

function teaserText(welcome: string | undefined): string {
  const text = typeof welcome === 'string' ? welcome.trim() : '';
  if (text.length <= TEASER_MAX_CHARS) return text;
  return `${text.slice(0, TEASER_MAX_CHARS - 1).trimEnd()}…`;
}

function normalizeSources(value: unknown): ChatSource[] | null {
  if (!Array.isArray(value)) return null;
  const list: ChatSource[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const url = typeof record.url === 'string' ? record.url : '';
    if (!url) continue;
    const title = typeof record.title === 'string' && record.title ? record.title : url;
    list.push({ title, url });
  }
  return list;
}

export default function ChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [seen, setSeen] = useState(false);
  const [teaserOn, setTeaserOn] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadConsent, setLeadConsent] = useState(false);
  const [leadSending, setLeadSending] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadDone, setLeadDone] = useState(false);
  const [ratedDone, setRatedDone] = useState(false);

  const leadId = useId();
  const leadEmailId = `${leadId}-email`;
  const leadConsentId = `${leadId}-consent`;

  const fabRef = useRef<HTMLButtonElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef('');
  const messagesRef = useRef<ChatMessage[]>([]);
  const wasOpenRef = useRef(false);

  const maxChars =
    config && typeof config.maxMessageChars === 'number' && config.maxMessageChars > 0
      ? config.maxMessageChars
      : DEFAULT_MAX_CHARS;

  useEffect(() => {
    setMounted(true);
    sessionIdRef.current = getSessionId();
    setSeen(readFlag(SEEN_KEY));
    setLeadDone(readFlag(LEAD_KEY));
    setRatedDone(readFlag(RATED_KEY));

    try {
      const rawLog = window.sessionStorage.getItem(LOG_KEY);
      if (rawLog) {
        const parsed: unknown = JSON.parse(rawLog);
        if (Array.isArray(parsed)) {
          const restored: ChatMessage[] = [];
          for (const item of parsed) {
            if (!item || typeof item !== 'object') continue;
            const record = item as Record<string, unknown>;
            const role = record.role;
            const text = record.text;
            if (role !== 'user' && role !== 'assistant') continue;
            if (typeof text !== 'string') continue;
            const id = typeof record.id === 'string' && record.id ? record.id : createId();
            restored.push({ id, role, text, failed: false });
          }
          setMessages(restored.slice(-MAX_LOGGED_MESSAGES));
        }
      }
    } catch {
      // jurnalul salvat poate fi corupt sau stocarea indisponibilă
    }

    try {
      const savedConversation = window.sessionStorage.getItem(CONV_KEY);
      conversationIdRef.current =
        typeof savedConversation === 'string' && savedConversation ? savedConversation : null;
    } catch {
      conversationIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch('/api/ai/config');
        if (!response.ok) return;
        const data = (await response.json()) as AiConfig;
        if (!cancelled) setConfig(data);
      } catch {
        // fără config widgetul rămâne ascuns
      }
    };

    void loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!config?.enabled || open || seen) return;
    const delay = typeof config.teaserDelay === 'number' ? config.teaserDelay : 0;
    if (!(delay > 0)) return;

    const timer = window.setTimeout(() => setTeaserOn(true), delay * 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [config, open, seen]);

  const openChat = useCallback(() => {
    setOpen(true);
    setSeen(true);
    setTeaserOn(false);
    writeFlag(SEEN_KEY);
  }, []);

  const dismissTeaser = useCallback(() => {
    setTeaserOn(false);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    if (!mounted) return;
    try {
      window.sessionStorage.setItem(LOG_KEY, JSON.stringify(messages.slice(-MAX_LOGGED_MESSAGES)));
      const conversationId = conversationIdRef.current;
      if (conversationId) window.sessionStorage.setItem(CONV_KEY, conversationId);
    } catch {
      // stocarea poate fi indisponibilă
    }
  }, [messages, mounted]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      textareaRef.current?.focus();
      return;
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      fabRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const query = window.matchMedia(MOBILE_QUERY);
    const locked = query.matches;
    if (locked) lockScroll();

    return () => {
      if (locked) unlockScroll();
    };
  }, [open]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, waiting, open]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const rememberConversation = useCallback((conversationId: string) => {
    conversationIdRef.current = conversationId;
    try {
      window.sessionStorage.setItem(CONV_KEY, conversationId);
    } catch {
      // ignorăm erorile de stocare
    }
  }, []);

  const runRequest = useCallback(
    async (rawText: string, appendUserMessage = true) => {
      const text = rawText.trim();
      if (!text || abortRef.current) return;

      const history = messagesRef.current
        .filter((message) =>
          message.role === 'user' ? true : Boolean(message.text) && !message.failed,
        )
        .slice(-6)
        .map((message) => ({ role: message.role, text: message.text }));

      const assistantId = createId();
      const userMessage: ChatMessage = { id: createId(), role: 'user', text };
      const assistantMessage: ChatMessage = { id: assistantId, role: 'assistant', text: '' };

      setMessages((previous) =>
        appendUserMessage
          ? [...previous, userMessage, assistantMessage]
          : [...previous, assistantMessage],
      );
      if (appendUserMessage) setInput('');
      setWaiting(true);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const patchAssistant = (updater: (message: ChatMessage) => Partial<ChatMessage>) => {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId ? { ...message, ...updater(message) } : message,
          ),
        );
      };

      const handleBlock = (block: string) => {
        let eventName = '';
        const dataLines: string[] = [];

        for (const rawLine of block.split(/\r?\n/)) {
          const line = rawLine.trim();
          if (!line) continue;
          if (line.startsWith('event:')) {
            eventName = line.slice('event:'.length).trim();
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice('data:'.length).trim());
          }
        }

        if (!dataLines.length) return;

        let payload: unknown = null;
        try {
          payload = JSON.parse(dataLines.join('\n'));
        } catch {
          return;
        }

        const data =
          payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

        if (eventName === 'meta') {
          if (typeof data.conversationId === 'string' && data.conversationId) {
            rememberConversation(data.conversationId);
          }
          patchAssistant((message) => ({
            messageId: typeof data.messageId === 'string' ? data.messageId : message.messageId,
            status: typeof data.status === 'string' ? data.status : message.status,
            askLead: !!data.askLead || data.status === 'lead_required',
            askRating: !!data.askRating,
          }));
          return;
        }

        if (eventName === 'delta') {
          const chunk = typeof data.text === 'string' ? data.text : '';
          if (!chunk) return;
          setWaiting(false);
          patchAssistant((message) => ({ text: message.text + chunk }));
          return;
        }

        if (eventName === 'sources') {
          const sources = normalizeSources(data.sources);
          if (sources) patchAssistant(() => ({ sources }));
          return;
        }

        if (eventName === 'error') {
          throw new Error(typeof data.error === 'string' ? data.error : 'Eroare de streaming');
        }
      };

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'text/event-stream',
            'x-ai': '1',
          },
          body: JSON.stringify({
            message: text,
            history,
            conversationId: conversationIdRef.current,
            sessionId: sessionIdRef.current || getSessionId(),
          }),
          signal: controller.signal,
        });

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = (await response.json()) as Record<string, unknown>;
          if (data.ok === false) throw new Error('Răspuns invalid');
          const sources = normalizeSources(data.sources);
          patchAssistant((message) => ({
            text: typeof data.text === 'string' ? data.text : message.text,
            status: typeof data.status === 'string' ? data.status : message.status,
            messageId: typeof data.messageId === 'string' ? data.messageId : message.messageId,
            sources: sources ?? message.sources,
            askLead: !!data.askLead || data.status === 'lead_required',
            askRating: !!data.askRating,
          }));
          if (typeof data.conversationId === 'string' && data.conversationId) {
            rememberConversation(data.conversationId);
          }
          setWaiting(false);
          return;
        }

        if (!response.ok || !response.body) throw new Error('Cerere eșuată');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let separator = buffer.indexOf('\n\n');
          while (separator !== -1) {
            handleBlock(buffer.slice(0, separator));
            buffer = buffer.slice(separator + 2);
            separator = buffer.indexOf('\n\n');
          }
        }

        buffer += decoder.decode();
        if (buffer.trim()) handleBlock(buffer);
      } catch (error) {
        const aborted =
          controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');

        if (aborted) {
          setMessages((previous) =>
            previous.filter((message) => message.id !== assistantId || message.text.length > 0),
          );
        } else {
          controller.abort();
          patchAssistant(() => ({ text: ERROR_TEXT, failed: true, sources: undefined }));
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setWaiting(false);
        setStreaming(false);
      }
    },
    [rememberConversation],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (streaming) {
      handleStop();
      return;
    }
    void runRequest(input);
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void runRequest(input);
    }
  };

  const handleFeedback = async (message: ChatMessage, value: 'up' | 'down') => {
    const nextValue: 'up' | 'down' | null = message.feedback === value ? null : value;

    setMessages((previous) =>
      previous.map((item) => (item.id === message.id ? { ...item, feedback: nextValue } : item)),
    );

    const conversationId = conversationIdRef.current;
    const messageId = message.messageId;
    if (!conversationId || !messageId) return;

    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ai': '1',
        },
        body: JSON.stringify({
          conversationId,
          messageId,
          value: nextValue,
          sessionId: sessionIdRef.current || getSessionId(),
        }),
      });
    } catch {
      // feedback-ul e best-effort
    }
  };

  const handleRetry = (failedId: string) => {
    const index = messages.findIndex((message) => message.id === failedId);
    const before = index === -1 ? messages : messages.slice(0, index);
    const lastUser = [...before].reverse().find((message) => message.role === 'user');
    if (!lastUser) return;

    setMessages((previous) => previous.filter((message) => message.id !== failedId));
    void runRequest(lastUser.text, false);
  };

  const handleLeadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = leadEmail.trim();
    if (!email || !leadConsent) return;

    setLeadError('');
    setLeadSending(true);

    try {
      const response = await fetch('/api/ai/lead', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ai': '1',
        },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          email,
          consent: true,
          sessionId: sessionIdRef.current || getSessionId(),
        }),
      });

      let result: { ok?: boolean; error?: string } | null = null;
      try {
        result = (await response.json()) as { ok?: boolean; error?: string };
      } catch {
        result = null;
      }

      if (!response.ok || !result?.ok) {
        setLeadError(result?.error || 'Nu am putut salva adresa. Încearcă din nou.');
        return;
      }

      setLeadDone(true);
      writeFlag(LEAD_KEY);
      setMessages((previous) => [
        ...previous,
        {
          id: createId(),
          role: 'assistant',
          text: `Mulțumim! Te putem contacta la ${email}. Cu ce te mai pot ajuta?`,
        },
      ]);
    } catch {
      setLeadError('Nu am putut salva adresa. Încearcă din nou.');
    } finally {
      setLeadSending(false);
    }
  };

  const handleRating = (value: RatingValue) => {
    const conversationId = conversationIdRef.current;
    if (conversationId) {
      void fetch('/api/ai/rating', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ai': '1',
        },
        body: JSON.stringify({ conversationId, value, sessionId: sessionIdRef.current || getSessionId() }),
      }).catch(() => {
        // evaluarea e best-effort
      });
    }

    setRatedDone(true);
    writeFlag(RATED_KEY);
    setMessages((previous) => [
      ...previous,
      { id: createId(), role: 'assistant', text: RATING_THANKS },
    ]);
  };

  if (!mounted || !config || !config.enabled) return null;

  const hasUserMessage = messages.some((message) => message.role === 'user');
  const suggestions = Array.isArray(config.suggestions) ? config.suggestions : [];
  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
  const showLead =
    !leadDone && !!conversationIdRef.current && messages.some((message) => message.askLead);
  const showRating = !ratedDone && !!lastAssistant?.askRating && !streaming;
  const leadBlocking = showLead && !!config.leadRequired;

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className="esa-chat-fab"
        aria-label={!open && !seen ? 'Deschide asistentul – un mesaj nou' : 'Deschide asistentul'}
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openChat())}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 5h16v11H9l-5 4V5Z" />
        </svg>
        {!open && !seen ? (
          <span className="esa-chat-badge" aria-hidden="true">
            1
          </span>
        ) : null}
      </button>

      {!open && teaserOn ? (
        <div className="esa-chat-teaser" role="status">
          <button type="button" className="esa-chat-teaser-body" onClick={openChat}>
            {teaserText(config.welcome)}
          </button>
          <button
            type="button"
            className="esa-chat-teaser-close"
            aria-label="Închide mesajul"
            onClick={dismissTeaser}
          >
            ×
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="esa-chat-panel" role="dialog" aria-label="Asistent ESA">
          <div className="esa-chat-head">
            <span>Asistent ESA</span>
            <button
              type="button"
              className="esa-chat-close"
              aria-label="Închide asistentul"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div ref={logRef} className="esa-chat-log" role="log" aria-live="polite">
            {messages.length === 0 && config.welcome ? (
              <div className="esa-chat-msg is-assistant">
                <p>{config.welcome}</p>
              </div>
            ) : null}

            {messages.map((message) => {
              const isUser = message.role === 'user';
              const showTyping = !isUser && waiting && !message.text && !message.failed;
              const sources = message.sources ?? [];
              const showFeedback = Boolean(message.messageId && message.text && !message.failed);
              const showActions =
                !isUser &&
                (message.status === 'refused' || Boolean(message.failed) || showFeedback);

              return (
                <div
                  key={message.id}
                  className={`esa-chat-msg ${isUser ? 'is-user' : 'is-assistant'}`}
                >
                  {message.text ? <p>{message.text}</p> : null}

                  {showTyping ? (
                    <div className="esa-chat-typing" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : null}

                  {sources.length > 0 ? (
                    <div className="esa-chat-sources">
                      {sources.map((source, index) => {
                        if (source.url.startsWith('/')) {
                          return (
                            <Link key={`${source.url}-${index}`} href={source.url}>
                              {source.title}
                            </Link>
                          );
                        }
                        if (source.url.startsWith('https://')) {
                          return (
                            <a
                              key={`${source.url}-${index}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {source.title}
                            </a>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : null}

                  {showActions ? (
                    <div className="esa-chat-actions">
                      {message.status === 'refused' && config.contactUrl ? (
                        <Link href={config.contactUrl}>Contactează echipa</Link>
                      ) : null}

                      {message.failed ? (
                        <button
                          type="button"
                          className="esa-chat-retry"
                          onClick={() => handleRetry(message.id)}
                        >
                          Reîncearcă
                        </button>
                      ) : null}

                      {showFeedback ? (
                        <>
                          <button
                            type="button"
                            aria-label="Răspuns util"
                            aria-pressed={message.feedback === 'up'}
                            onClick={() => void handleFeedback(message, 'up')}
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            aria-label="Răspuns neutil"
                            aria-pressed={message.feedback === 'down'}
                            onClick={() => void handleFeedback(message, 'down')}
                          >
                            👎
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {showLead ? (
              <form
                className="esa-chat-lead"
                onSubmit={handleLeadSubmit}
                aria-labelledby={leadId}
              >
                <p id={leadId}>{config.leadPrompt}</p>
                <label htmlFor={leadEmailId} className="esa-chat-sr">
                  Adresa de email
                </label>
                <input
                  id={leadEmailId}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nume@exemplu.ro"
                  value={leadEmail}
                  onChange={(event) => setLeadEmail(event.target.value)}
                  className="esa-chat-lead-input"
                />
                <label className="esa-chat-lead-consent" htmlFor={leadConsentId}>
                  <input
                    id={leadConsentId}
                    type="checkbox"
                    required
                    checked={leadConsent}
                    onChange={(event) => setLeadConsent(event.target.checked)}
                  />
                  <span>
                    Sunt de acord ca ESA Coder Solutions să folosească adresa mea de email
                    pentru a-mi răspunde, conform{' '}
                    <Link href="/politica-de-confidentialitate">Politicii de confidențialitate</Link>
                    .
                  </span>
                </label>
                {leadError ? (
                  <p className="esa-chat-lead-error" role="alert">
                    {leadError}
                  </p>
                ) : null}
                <button type="submit" className="esa-chat-send" disabled={leadSending}>
                  {leadSending ? 'Se trimite…' : 'Trimite'}
                </button>
                {config.leadRequired ? (
                  <Link href={config.contactUrl} className="esa-chat-lead-alt">
                    sau scrie-ne din pagina de contact
                  </Link>
                ) : null}
              </form>
            ) : null}

            {showRating ? (
              <div
                className="esa-chat-rating"
                role="group"
                aria-label={config.ratingPrompt}
              >
                <p>{config.ratingPrompt}</p>
                <div>
                  {[
                    ['good', '👍 Bună'],
                    ['ok', '😐 Ok'],
                    ['bad', '👎 Slabă'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRating(value as RatingValue)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {!hasUserMessage && suggestions.length > 0 && !leadBlocking ? (
            <div className="esa-chat-suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  type="button"
                  onClick={() => void runRequest(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form className="esa-chat-form" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="esa-chat-input"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              maxLength={maxChars}
              rows={2}
              disabled={leadBlocking}
              placeholder={
                leadBlocking ? 'Lasă adresa de email ca să continuăm' : 'Scrie un mesaj…'
              }
            />
            <span className="esa-chat-count">
              {input.length}/{maxChars}
            </span>
            {streaming ? (
              <button type="button" className="esa-chat-send" onClick={handleStop}>
                Oprește
              </button>
            ) : (
              <button type="submit" className="esa-chat-send" disabled={leadBlocking}>
                Trimite
              </button>
            )}
          </form>
        </div>
      ) : null}
    </>
  );
}
