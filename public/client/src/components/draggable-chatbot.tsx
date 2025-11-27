import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Position {
  x: number;
  y: number;
}

export function DraggableChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your pet emotion detective. Ask me anything about pet emotions, behaviors, or analysis!",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragRefButton = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRefButton.current) return;
    setIsDragging(true);
    const rect = dragRefButton.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { apiRequest } = await import("@/lib/queryClient");
      const response = await apiRequest("POST", "/api/chat", {
        message: userMessage,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Chat error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Draggable Chat Icon Button - Fixed position */}
      <div
        ref={dragRefButton}
        className="fixed cursor-grab active:cursor-grabbing z-50 select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? "none" : "none",
        }}
        onMouseDown={handleMouseDown}
        data-testid="button-draggable-chatbot"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 text-white shadow-lg flex items-center justify-center transition-all hover-elevate"
          title="Pet Chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-50 w-96 max-w-[calc(100vw-20px)]"
          style={{
            right: "20px",
            bottom: "100px",
          }}
        >
          <Card className="flex flex-col h-[500px] bg-gradient-to-br from-teal-900 to-slate-900 border-teal-600">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-teal-600 bg-gradient-to-r from-teal-800 to-teal-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal-300" />
                <span className="font-semibold text-teal-100">Pet Chatbot</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chatbot"
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${idx}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-teal-600 text-teal-50"
                        : "bg-slate-700 text-slate-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700 px-3 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-teal-600 flex gap-2 bg-teal-950">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask anything..."
                className="text-sm bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                disabled={isLoading}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="bg-teal-600 hover:bg-teal-500"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
