import { motion } from "framer-motion";
import { Heart } from "lucide-react";

interface MotivationalQuoteProps {
  quote: string;
}

export function MotivationalQuote({ quote }: MotivationalQuoteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-3xl px-4 py-6 text-center"
    >
      <div className="inline-flex items-center gap-2 rounded-xl bg-accent/10 px-5 py-3 border border-accent/20">
        <Heart className="h-4 w-4 text-accent shrink-0" />
        <p className="text-accent font-serif text-base md:text-lg italic leading-relaxed">
          {quote}
        </p>
      </div>
    </motion.div>
  );
}
