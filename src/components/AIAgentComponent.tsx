import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

// Simple and safe markdown formatter helper
function renderFormattedMessage(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let content = line.trim();
    
    // Check for bold matches (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-extrabold text-slate-900">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    const renderedText = parts.length > 0 ? parts : content;

    // Bullet point list item
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const cleanText = line.trim().substring(2);
      // Re-run bold matching on the clean bullet item using a fresh regex instance
      const bulletBoldRegex = /\*\*(.*?)\*\*/g;
      const bParts = [];
      let bLast = 0;
      let bMatch;
      while ((bMatch = bulletBoldRegex.exec(cleanText)) !== null) {
        if (bMatch.index > bLast) {
          bParts.push(cleanText.substring(bLast, bMatch.index));
        }
        bParts.push(<strong key={bMatch.index} className="font-extrabold text-slate-900">{bMatch[1]}</strong>);
        bLast = bulletBoldRegex.lastIndex;
      }
      if (bLast < cleanText.length) {
        bParts.push(cleanText.substring(bLast));
      }
      return (
        <li key={idx} className="ml-4 list-disc text-xs text-slate-700 my-1 leading-relaxed">
          {bParts.length > 0 ? bParts : cleanText}
        </li>
      );
    }

    // Numbered list item
    const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      const cleanText = numMatch[2];
      const bParts = [];
      let bLast = 0;
      let bMatch;
      const numBoldRegex = /\*\*(.*?)\*\*/g;
      while ((bMatch = numBoldRegex.exec(cleanText)) !== null) {
        if (bMatch.index > bLast) {
          bParts.push(cleanText.substring(bLast, bMatch.index));
        }
        bParts.push(<strong key={bMatch.index} className="font-extrabold text-slate-900">{bMatch[1]}</strong>);
        bLast = numBoldRegex.lastIndex;
      }
      if (bLast < cleanText.length) {
        bParts.push(cleanText.substring(bLast));
      }
      return (
        <li key={idx} className="ml-4 list-decimal text-xs text-slate-700 my-1 leading-relaxed">
          {bParts.length > 0 ? bParts : cleanText}
        </li>
      );
    }

    // Heading tags
    if (line.trim().startsWith('### ')) {
      return <h5 key={idx} className="text-xs font-black text-slate-900 uppercase tracking-tight mt-3 mb-1">{content.substring(4)}</h5>;
    }
    if (line.trim().startsWith('## ')) {
      return <h4 key={idx} className="text-sm font-black text-slate-900 uppercase tracking-tight mt-4 mb-1 border-b border-slate-100 pb-0.5">{content.substring(3)}</h4>;
    }

    // Standard paragraph or empty spacing line
    if (!line.trim()) {
      return <div key={idx} className="h-2"></div>;
    }

    return (
      <p key={idx} className="text-xs text-slate-650 leading-relaxed my-1">
        {renderedText}
      </p>
    );
  });
}

export default function AIAgentComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      text: "Hello! I am your **EZIBECK Academics Assistant**. I am here to help educators easily manage classroom rosters, edit term scorecard ratios, calculate class ranks, or customize the portal template. \n\nHow can I assist you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasPromptError, setHasPromptError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest response
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isSending) return;

    if (!customText) {
      setInputValue('');
    }
    setHasPromptError(false);

    const userMsgId = 'msg-' + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsSending(true);

    try {
      // Build proper full conversation payload
      const chatHistory = [...messages, newUserMessage].map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!res.ok) {
        throw new Error("Server responded with error status");
      }

      const data = await res.json();
      const aiReplyText = data.text || "I was unable to retrieve a response. Please try reframing your question.";

      setMessages(prev => [...prev, {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        text: aiReplyText
      }]);
    } catch (err) {
      console.error("AI Assistant network error:", err);
      setHasPromptError(true);
      setMessages(prev => [...prev, {
        id: 'msg-error-' + Date.now(),
        role: 'assistant',
        text: "⚠️ **Connection Timeout**: I am having difficulty contacting the school's workspace database proxy router. Check your Internet connection and double check that your `GEMINI_API_KEY` is configured in your AI Studiosecrets."
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const quickPrompts = [
    "How to enter student exam scores?",
    "Explain automatic class ranks",
    "How do I customize the Motto/Fees?",
    "How to lock student portal access?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden font-sans">
      {/* Floating Sparkle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-emerald-950 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-950/30 hover:scale-107 border border-emerald-800/80 hover:bg-emerald-900 cursor-pointer relative group transition-all duration-300"
          title="Academics AI Helper"
        >
          {/* Subtle neon glowing ring */}
          <span className="absolute inset-0 rounded-full border border-emerald-400 opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-300 animate-pulse"></span>
          
          <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          
          <span className="absolute right-0 top-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900"></span>
        </button>
      )}

      {/* Slide-over Chat Box */}
      {isOpen && (
        <div className="w-[330px] sm:w-[380px] h-[500px] bg-white rounded-3xl border border-slate-150 shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-framer">
          
          {/* Chat Header */}
          <div className="bg-emerald-950 text-white p-4 flex justify-between items-center border-b border-emerald-900 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-400"></div>
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-amber-300 shadow-inner">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  EZIBECK Coordinator AI
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </h4>
                <p className="text-[9px] text-emerald-250 font-semibold uppercase">Academics Workspace Helper</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-emerald-900/60 hover:bg-emerald-800/85 transition-all text-emerald-300 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Errors or Alerts */}
          {hasPromptError && (
            <div className="bg-amber-50 border-b border-amber-100 p-2.5 flex items-center gap-2 text-[10px] text-amber-800 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Proxy offline. Running in troubleshooting mode.</span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 shadow-3xs ${
                  m.role === 'user'
                    ? 'bg-emerald-900 text-white rounded-br-none font-medium'
                    : 'bg-white border border-slate-150 text-slate-800 rounded-bl-none font-light'
                }`}>
                  {m.role === 'user' ? (
                    <p className="text-xs leading-relaxed">{m.text}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderFormattedMessage(m.text)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Thinking / Typing dots indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-150 max-w-[85%] p-3.5 rounded-2xl rounded-bl-none flex items-center gap-1 px-4 shadow-3xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts buttons strip */}
          {messages.length === 1 && !isSending && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 space-y-1">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Quick Suggestions</span>
              <div className="flex flex-wrap gap-1">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPromptClick(p)}
                    className="text-[9px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-2 py-1 rounded-md transition-all cursor-pointer text-left uppercase tracking-tight"
                  >
                    💡 {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t bg-white border-slate-100 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me how to use this workspace..."
              className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white text-slate-800 font-sans"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                inputValue.trim() && !isSending
                  ? 'bg-emerald-950 text-white shadow hover:bg-emerald-900 cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-350 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
