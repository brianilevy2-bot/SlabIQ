import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Send, CheckCircle2, Server, ArrowRight } from "lucide-react";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { MessageCard } from "@/components/MessageCard";

export default function Home() {
  const [content, setContent] = useState("");
  const { data: messages, isLoading, isError } = useMessages();
  const createMessage = useCreateMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || createMessage.isPending) return;

    createMessage.mutate(
      { content: content.trim() },
      {
        onSuccess: () => setContent(""),
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-primary/10 selection:text-primary relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay"></div>
      
      {/* Subtle Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gray-200/40 blur-3xl pointer-events-none" />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 relative z-10 flex flex-col lg:flex-row gap-16 lg:gap-24 items-center justify-center">
        
        {/* Left Column: Typography & Brand */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex-1 text-center lg:text-left pt-10 lg:pt-0"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm mb-8 mx-auto lg:mx-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-600">
              System Ready
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            A blank canvas <br />
            <span className="text-gray-400">for greatness.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed mb-10">
            Your Node.js and Express fullstack environment is successfully provisioned. 
            Connect the dots between your ideas and reality.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
              <Server className="w-4 h-4 text-gray-400" />
              Express Backend
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 font-medium bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
              <Activity className="w-4 h-4 text-gray-400" />
              React Frontend
              <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive API Test */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="flex-1 w-full max-w-md relative"
        >
          {/* Main Card */}
          <div className="glass-card rounded-[2rem] p-1 shadow-xl shadow-black/5 overflow-hidden">
            <div className="bg-[#fafafa]/50 rounded-[1.75rem] p-6 sm:p-8 h-[500px] flex flex-col border border-white">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-foreground">API Connection</h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                    GET /api/messages
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-gray-400 -rotate-45" />
                </div>
              </div>

              {/* Message List Area */}
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 mb-6 scrollbar-hide">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                    <p className="text-sm font-medium">Syncing data...</p>
                  </div>
                ) : isError ? (
                  <div className="h-full flex items-center justify-center text-destructive text-sm font-medium">
                    Failed to load messages. Is the server running?
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                    <Activity className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-sm font-medium">No messages yet.</p>
                    <p className="text-xs text-gray-300">Send one below to test the database.</p>
                  </div>
                ) : (
                  messages?.map((msg, idx) => (
                    <MessageCard key={msg.id} message={msg} index={idx} />
                  ))
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="relative mt-auto">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a test message..."
                    disabled={createMessage.isPending}
                    className="w-full bg-white border border-gray-200 text-foreground text-sm rounded-2xl pl-5 pr-14 py-4 subtle-ring disabled:opacity-50 disabled:cursor-not-allowed shadow-sm placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!content.trim() || createMessage.isPending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-30 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    {createMessage.isPending ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
