import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-accent/15 animate-pulse" />
          <Zap className="h-5 w-5 text-accent relative z-10" />
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
