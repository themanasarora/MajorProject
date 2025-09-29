import { useState } from "react";
import { Bot, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hi! I'm your AI assistant. How can I help you today? 😊",
      timestamp: new Date(),
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      type: "user" as const,
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        type: "bot" as const,
        content: "Thanks for your message! I'm here to help with any questions about teaching, students, or using this platform. 🌟",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-96 z-50 shadow-warm border-border/50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/50 bg-gradient-primary text-primary-foreground rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <span className="font-medium">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-xl text-sm ${
                    msg.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 rounded-full"
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button
                onClick={sendMessage}
                size="icon"
                className="rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="floating-bubble w-14 h-14"
      >
        <Bot className="h-6 w-6" />
      </Button>
    </>
  );
}