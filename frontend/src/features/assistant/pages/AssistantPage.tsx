import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { datasetsApi } from "../../../api/datasets";
import { Button } from "../../../components/ui/button";
import {
  Send,
  User,
  Bot,
  Loader2,
  Sparkles,
  ChevronRight,
  Database,
  MessageSquare,
  Trash2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import { containerVariants } from "../../../theme/motion";
import { Badge } from "../../../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "What are the most important features in my data?",
  "Why did you choose this model?",
  "Are there any outliers I should worry about?",
  "How can I improve the model accuracy?",
];

export const AssistantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get("datasetId");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your DataForge AI assistant. I can help you understand your data, explain model results, or suggest next steps. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch dataset info if datasetId is present
  const { data: dataset } = useQuery({
    queryKey: ["dataset", datasetId],
    queryFn: () => datasetsApi.get(datasetId!),
    enabled: !!datasetId,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiClient.post("/assistant/ask/", {
        question,
        dataset_id: datasetId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: () => {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSend = (text: string = input) => {
    if (!text.trim() || askMutation.isPending) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    askMutation.mutate(text);
  };

  const clearChat = () => {
    setMessages([messages[0]]);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto bg-card rounded-2xl border border-border overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg">AI Insights Assistant</h2>
              <Badge
                variant="secondary"
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0"
              >
                Beta
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3 Flash
              </span>
              {dataset && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-primary/80">
                    <Database className="h-3 w-3" />
                    {dataset.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={clearChat}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear conversation</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border border-border"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-6 w-6" />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === "assistant"
                      ? "bg-muted/50 text-foreground rounded-tl-none border border-border/50"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}
                >
                  {msg.content}
                </div>
                <p
                  className={cn(
                    "text-[10px] text-muted-foreground px-1",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {askMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-[85%]"
          >
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none border border-border/50 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Thinking...
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border bg-muted/20 space-y-6">
        {messages.length === 1 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
              <MessageSquare className="h-3 w-3" /> Suggested Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <motion.button
                  key={prompt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSend(prompt)}
                  className="text-xs px-4 py-2 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all flex items-center gap-2 shadow-sm font-medium"
                >
                  {prompt}
                  <ChevronRight className="h-3 w-3 opacity-50" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <form
          className="relative group"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              dataset
                ? `Ask about ${dataset.name}...`
                : "Ask a question about your data..."
            }
            className="w-full bg-card border border-border rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-lg transition-all group-hover:border-primary/30"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-xl shadow-md"
              disabled={!input.trim() || askMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium">
          <Info className="h-3 w-3" />
          AI can make mistakes. Verify important information.
        </div>
      </div>
    </motion.div>
  );
};
