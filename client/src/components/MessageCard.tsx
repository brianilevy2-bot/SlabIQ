import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import type { Message } from "@shared/schema";

interface MessageCardProps {
  message: Message;
  index: number;
}

export function MessageCard({ message, index }: MessageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors duration-300">
          <MessageSquare className="w-4 h-4 opacity-50 group-hover:opacity-100" />
        </div>
        <div className="flex-1 pt-1">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {message.content}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              ID: {message.id}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
