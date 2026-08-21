"use client";
import { useState, useRef } from "react";
import axios from "axios";
import { useAppStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { MessageCircle, Send, Bot, User, Loader } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Buses from Ahmednagar to Pune today",
  "Which bus is fastest to Nashik?",
  "When should I leave for Shirdi?",
  "मला अहमदनगरहून पुण्याला जायचं आहे.",
  "पुण्याला जाण्यासाठी पुढची बस कोणती?",
  "मुंबई से पुणे कैसे जाएं?",
];

export default function AIAssistantPage() {
  const { language } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! 👋 I'm the **MahaST AI Travel Assistant**.\n\nI can help you find buses, routes, and travel information across Maharashtra.\n\nAsk me anything like:\n• \"Buses from Ahmednagar to Pune today\"\n• \"Which bus should I take to Nashik?\"\n• \"मला शिर्डीला जायचं आहे.\"\n\n⚠️ I use simulated demo data — always verify with official MSRTC schedules." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/ai-assistant", { message: text });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const formatContent = (text: string) => {
    // Simple markdown-like formatting
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <strong key={i} style={{ display: "block" }}>{line.slice(2, -2)}</strong>;
      }
      // Bold inline
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i} style={{ display: "block", marginBottom: line === "" ? 4 : 0 }}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </span>
      );
    });
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "1rem", display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageCircle size={22} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
            {t("aiAssistant", language)}
          </h1>
          <div style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
            Supports English · मराठी · हिंदी
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.role === "user" ? "#f97316" : "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {msg.role === "user" ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
            </div>
            <div style={{
              maxWidth: "75%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
              background: msg.role === "user" ? "#fff7ed" : "var(--color-surface)",
              border: "1px solid var(--color-border)",
              fontSize: "0.9rem",
              color: "var(--color-text)",
              lineHeight: 1.6,
            }}>
              {formatContent(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{ padding: "10px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px 12px 12px 0", display: "flex", gap: 4, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-muted)", animation: "bounce 0.8s infinite" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-muted)", animation: "bounce 0.8s 0.2s infinite" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-muted)", animation: "bounce 0.8s 0.4s infinite" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => sendMessage(s)} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.8125rem", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} style={{ display: "flex", gap: 8 }}>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about buses, routes, times... / बस बद्दल विचारा..."
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim() || loading} style={{ flexShrink: 0 }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
