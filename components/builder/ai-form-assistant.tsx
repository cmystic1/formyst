"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { FormDefinition } from "@/lib/form-schema";
import { inputClass } from "@/components/ui";
import { ChatBubbleIcon, SendIcon, SpinnerIcon, SparklesIcon } from "@/components/icons";

type ChatMessage = { role: "user" | "assistant"; content: string };
type AssistantProps =
  | { mode?: "edit"; formId: string; form: FormDefinition; onApply: (next: FormDefinition) => void; onClose: () => void }
  | { mode: "help"; onClose: () => void };

export function AIFormAssistant(props: AssistantProps) {
  const helpOnly = props.mode === "help";
  const formId = helpOnly ? null : props.formId;
  const form = helpOnly ? undefined : props.form;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const latestFormRef = useRef(form);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [takingLong, setTakingLong] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function appendMessage(message: ChatMessage) {
    const next = [...messagesRef.current, message].slice(-16);
    messagesRef.current = next;
    setMessages(next);
  }

  useEffect(() => {
    latestFormRef.current = form;
  }, [form]);

  useEffect(() => {
    const controller = new AbortController();
    const url = formId === null ? "/api/ai/history" : `/api/ai/history?formId=${encodeURIComponent(formId)}`;
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { messages?: ChatMessage[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Could not load chat history.");
        const saved = data.messages ?? [];
        messagesRef.current = saved;
        setMessages(saved);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load chat history."); })
      .finally(() => { if (!controller.signal.aborted) setLoadingHistory(false); });
    return () => controller.abort();
  }, [formId]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setTakingLong(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = prompt.trim();
    if (!request || busy || loadingHistory) return;
    const history = messagesRef.current;
    setBusy(true);
    setTakingLong(false);
    setError(null);
    setPrompt("");
    appendMessage({ role: "user", content: request });
    try {
      const response = await fetch(helpOnly ? "/api/ai/site-help" : "/api/ai/form-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(helpOnly ? { prompt: request } : { formId: props.formId, form, prompt: request }),
      });
      const data = await response.json().catch(() => null) as { reply?: string; form?: FormDefinition; error?: string } | null;
      if (!response.ok || !data?.reply) throw new Error(data?.error ?? "The assistant could not complete the request.");
      if (data.form) {
        if (helpOnly || !form) throw new Error("The assistant returned an unexpected form edit.");
        if (latestFormRef.current !== form) throw new Error("The form changed while I was working. Please send the request again so I use the latest version.");
        props.onApply(data.form);
      }
      appendMessage({ role: "assistant", content: data.reply! });
    } catch (requestError) {
      messagesRef.current = history;
      setMessages(history);
      setPrompt(request);
      setError(requestError instanceof Error ? requestError.message : "The assistant could not respond. Please try again.");
    } finally {
      setBusy(false);
      setTakingLong(false);
    }
  }

  async function clearChat() {
    if (busy || loadingHistory) return;
    setBusy(true);
    setError(null);
    try {
      const url = formId === null ? "/api/ai/history" : `/api/ai/history?formId=${encodeURIComponent(formId)}`;
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || "Could not clear chat history.");
      }
      messagesRef.current = [];
      setMessages([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not clear chat history.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <section role="dialog" aria-modal="false" aria-labelledby="ai-assistant-title" className="pointer-events-auto absolute bottom-3 right-3 flex h-[calc(100dvh-24px)] max-h-[760px] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-6 sm:right-6 sm:h-[min(680px,calc(100dvh-48px))] sm:w-[400px]">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><SparklesIcon className="h-5 w-5" /></span>
            <div><h2 id="ai-assistant-title" className="text-sm font-bold text-slate-900">{helpOnly ? "Formyst help" : "Form assistant"}</h2><p className="text-xs text-slate-500">{helpOnly ? "Learn how to use Formyst" : "Make changes by describing them"}</p></div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length ? <button type="button" onClick={clearChat} disabled={busy} className="rounded-lg px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-50">Clear chat</button> : null}
            <button type="button" onClick={props.onClose} className="rounded-lg px-2.5 py-2 text-sm text-slate-500 hover:bg-slate-100" aria-label="Close form assistant">Close</button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-5" aria-live="polite">
          <div className="rounded-xl bg-slate-50 p-3.5 text-sm leading-6 text-slate-600">
            {helpOnly
              ? "Ask about creating forms, publishing, responses, or integrations. To edit a form, open its builder and use Ask Formyst there."
              : "Ask me to edit this form or explain how Formyst works. Form edits appear here automatically; save the form when you are happy with them."}
          </div>
          {!messages.length && !loadingHistory ? (
            <div className="flex flex-wrap gap-2">
              {(helpOnly ? ["How do I share my form?", "Where can I see answers?"] : ["Make this form easier to fill out", "Ask for a phone number"]).map((example) => (
                <button key={example} type="button" onClick={() => setPrompt(example)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700">{example}</button>
              ))}
            </div>
          ) : null}
          {loadingHistory ? <p className="text-sm text-slate-500">Loading your conversation...</p> : null}
          {messages.map((message, index) => (
            <div key={`${index}-${message.role}`} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-5 ${message.role === "user" ? "ml-auto bg-brand-600 text-white" : "bg-slate-100 text-slate-700"}`}>
              {message.content}
            </div>
          ))}
          {busy ? <p className="flex items-center gap-2 text-sm text-slate-500"><SpinnerIcon className="h-4 w-4" /> {takingLong ? "Still working on your request..." : "Working on your request..."}</p> : null}
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="shrink-0 border-t border-slate-200 p-3 sm:p-4">
          <p className="mb-2 text-[11px] leading-4 text-slate-500">Local Ollama | Chat is saved to your account. Form responses are not sent to the model. Do not enter passwords or tokens.</p>
          <form onSubmit={handleSubmit} className="relative">
            <label className="sr-only" htmlFor="ai-form-prompt">Describe a change to this form</label>
            <textarea
              id="ai-form-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (!busy && !loadingHistory && prompt.trim()) event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={1200}
              rows={2}
              disabled={busy || loadingHistory}
              placeholder={helpOnly ? "Ask how Formyst works..." : "Describe what you want this form to do..."}
              className={`${inputClass} min-h-20 max-h-32 resize-y pb-12 pr-14`}
            />
            <span className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-slate-400">Enter sends | Shift+Enter adds a line</span>
            <button type="submit" disabled={busy || loadingHistory || !prompt.trim()} className="absolute bottom-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-45" aria-label="Send message" title="Send message">
              {busy ? <SpinnerIcon className="h-4 w-4" /> : <SendIcon className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export function AIChatLauncher({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Formyst assistant chat"
      className="fixed bottom-4 right-4 z-40 inline-flex h-14 items-center gap-2.5 rounded-full bg-brand-700 px-4 text-sm font-semibold text-white shadow-xl shadow-brand-900/20 transition hover:-translate-y-0.5 hover:bg-brand-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25 sm:bottom-6 sm:right-6"
    >
      <ChatBubbleIcon className="h-5 w-5" />
      <span>Ask Formyst</span>
      <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" aria-hidden="true" />
    </button>
  );
}
