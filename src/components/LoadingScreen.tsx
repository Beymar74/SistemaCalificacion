'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = 'Cargando datos...',
  submessage = 'Unidad de Investigación Ciencia y Tecnología',
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center relative overflow-hidden selection:bg-[#094e8f]/20 ${
        fullScreen
          ? 'min-h-screen w-full bg-gradient-to-br from-slate-50 via-[#f8fafc] to-blue-50/30 p-6'
          : 'min-h-[60vh] w-full p-6'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-blue-100/50 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
      >
        {/* Logos container with rotating ring */}
        <div className="relative mb-6">
          <div
            className="absolute -inset-3 rounded-[2.25rem] border-2 border-dashed border-[#094e8f]/30 animate-spin"
            style={{ animationDuration: '10s' }}
          />
          
          <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] border border-slate-200/80 shadow-[0_16px_36px_-12px_rgba(9,78,143,0.14)] flex items-center justify-center gap-3.5 sm:gap-4 relative">
            <div className="relative">
              <Image
                src="/logo/Emi logo.png"
                alt="Logo EMI"
                width={56}
                height={56}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                priority
              />
            </div>

            <div className="w-[1.5px] h-9 bg-slate-200" />

            <div className="relative">
              <Image
                src="/logo/uicyt-logo.png"
                alt="Logo UICYT"
                width={56}
                height={56}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 mb-2.5"
        >
          <span className="text-xl sm:text-2xl font-black text-[#094e8f] tracking-tight">
            UICYT
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f0d114]" />
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
            EMI
          </span>
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm sm:text-base font-black text-slate-800 tracking-tight"
        >
          {message}
        </motion.p>

        {/* Submessage */}
        {submessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-wider"
          >
            {submessage}
          </motion.p>
        )}

        {/* Shimmer Bar */}
        <div className="w-36 sm:w-44 h-1.5 bg-slate-200/80 rounded-full mt-5 overflow-hidden relative">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="w-1/2 h-full bg-gradient-to-r from-[#094e8f] via-[#2563eb] to-[#f0d114] rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
