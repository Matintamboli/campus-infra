import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] sm:w-auto animate-bounce-short">
      <div 
        className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-xs sm:text-sm font-medium transition-all"
        style={{
          background: 'rgba(15, 48, 64, 0.92)',
          borderColor: isSuccess ? 'rgba(217, 155, 127, 0.6)' : isError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(165, 111, 99, 0.4)',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(217, 155, 127, 0.15)',
          color: '#ffffff',
        }}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-[#D99B7F] flex-shrink-0" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-[#D99B7F] flex-shrink-0" />
        )}

        <span className="flex-1 text-slate-200">{message}</span>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
