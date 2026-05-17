'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpBannerProps {
  title: string;
  description: string;
  className?: string;
  storageKey?: string; // Clave opcional para recordar si el usuario lo ocultó
}

export default function HelpBanner({ title, description, className = '', storageKey }: HelpBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (storageKey) {
      const isHidden = localStorage.getItem(`help_banner_${storageKey}`) === 'hidden';
      setIsVisible(!isHidden);
    }
    setMounted(true);
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (storageKey) {
      localStorage.setItem(`help_banner_${storageKey}`, 'hidden');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, margin: 0, padding: 0, overflow: 'hidden' }}
          transition={{ duration: 0.2 }}
          className={`relative bg-blue-50/40 hover:bg-blue-50/60 border border-blue-100/60 rounded-2xl p-4 flex gap-3.5 transition-all shadow-sm ${className}`}
        >
          <div className="p-2 bg-blue-100/40 rounded-xl text-blue-600 flex-shrink-0 self-start shadow-sm shadow-blue-100/20">
            <HelpCircle className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 pr-6">
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-1 select-none">
              {title}
            </h4>
            <p className="text-xs text-blue-800/85 font-medium leading-relaxed">
              {description}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 hover:bg-blue-100/50 text-blue-400 hover:text-blue-600 rounded-lg transition-all"
            title="Ocultar mensaje de ayuda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
