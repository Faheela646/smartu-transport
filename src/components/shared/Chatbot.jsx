import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useMapStore } from "@/store/useMapStore";

const QUICK_PROMPTS = [
  "Where is my bus?",
  "When will it reach Kohinoor Chowk?",
  "Seat availability?",
  "Transport fee details?",
  "How to scan QR?",
  "Is my bus delayed?",
];

function mockReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes("where") && lower.includes("bus")) {
    return "🚌 Your shuttle BUS-101 (FSD-2023) is currently active on Route R-01 (D-Ground). It is about 2.4 km away from your stop (Kohinoor Chowk) and estimated to arrive in 7-8 minutes!";
  }
  if (lower.includes("reach") || lower.includes("kohinoor") || lower.includes("stop") || lower.includes("when")) {
    return "⏱ BUS-101 is scheduled to reach Kohinoor Chowk at 7:28 AM. Current live ETA shows it is running 🟢 On Time (approx 7 minutes away).";
  }
  if (lower.includes("seat") || lower.includes("available") || lower.includes("capacity")) {
    return "🪑 Route R-01 (BUS-101) currently has 18 available seats out of 50 total capacity (32 occupied, 64% occupancy). Seat counts update live as students scan boarding passes.";
  }
  if (lower.includes("fee") || lower.includes("pay") || lower.includes("cost") || lower.includes("dues")) {
    return "💳 Your monthly transport fee for September 2026 is Rs. 5,000. Your current fee status is 🟢 PAID. You can download your official PDF receipt under Payments.";
  }
  if (lower.includes("qr") || lower.includes("attendance") || lower.includes("scan")) {
    return "📡 Board your shuttle, open the Attendance tab, tap 'Scan QR Code' and point your camera at the QR code near the conductor station. Attendance will be recorded automatically!";
  }
  if (lower.includes("delay") || lower.includes("late")) {
    return "🟢 Route R-01 (D-Ground) is running on time! Note: Route R-03 (Samanabad) reported a 15 minute delay due to traffic near Jail Road.";
  }
  return "🤖 I can assist you with live shuttle tracking, seat availability, QR attendance, fee payments, and route schedules. Tap any quick query or type your question below!";
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hello! I am your AI Transport Assistant. How can I help you with your daily shuttle today?",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (promptText) => {
    const text = (promptText || input).trim();
    if (!text) return;

    setMessages((m) => [...m, { from: "user", text }]);
    if (!promptText) setInput("");

    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: mockReply(text) }]);
    }, 500);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 flex h-[480px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-xs font-bold leading-tight">AI Transport Assistant</p>
                <p className="text-[10px] text-primary-foreground/80">FAST CFD Campus Shuttle Bot</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-primary-foreground/10 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl p-3 leading-relaxed",
                  m.from === "bot"
                    ? "bg-secondary/70 text-foreground border border-border/50"
                    : "ml-auto bg-primary text-primary-foreground font-medium"
                )}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-border bg-secondary/30 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => send(qp)}
                className="shrink-0 rounded-full border border-primary/20 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-2.5 w-2.5 text-primary" /> {qp}
              </button>
            ))}
          </div>

          {/* Input Row */}
          <div className="flex items-center gap-2 border-t border-border p-2.5 bg-background">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your bus, route, or fee..."
              className="h-9 text-xs"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => send()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 sm:right-6 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{ height: "52px", width: "52px" }}
        aria-label="Open AI Transport Assistant"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </>
  );
}
