"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";

export function MessageInput({
  onSendMessage,
  placeholder = "Type a message…",
}) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, []);
    setMessage("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50/80 shadow-inner focus-within:border-pink-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-500/20">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 min-h-[48px] w-full resize-none bg-transparent px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          onInput={(e) => {
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleSend}
        disabled={!message.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-red-500 text-white shadow-md transition hover:from-pink-600 hover:to-red-600 hover:shadow-lg disabled:pointer-events-none disabled:opacity-40"
      >
        <Send className="h-5 w-5" strokeWidth={2} />
      </button>
    </div>
  );
}
