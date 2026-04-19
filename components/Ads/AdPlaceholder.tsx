
import React from 'react';

interface AdPlaceholderProps {
  type: 'BANNER' | 'INTERSTITIAL' | 'REWARDED';
  onClose?: () => void;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ type, onClose }) => {
  if (type === 'BANNER') {
    return (
      <div className="w-full h-16 bg-slate-900 border-t border-slate-700 flex flex-col items-center justify-center text-[10px] text-slate-500 overflow-hidden shrink-0">
        <p>РЕКЛАМА ВІД GOOGLE ADS</p>
        <div className="flex gap-2 mt-1">
          <div className="w-8 h-8 bg-blue-600 rounded"></div>
          <div className="flex flex-col">
            <div className="h-2 w-24 bg-slate-700 rounded mb-1"></div>
            <div className="h-2 w-16 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-4 right-4">
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="w-full max-w-sm aspect-video bg-slate-800 rounded-lg flex flex-col items-center justify-center mb-6 shadow-2xl border border-white/10">
        <div className="w-16 h-16 bg-blue-500 rounded-full mb-4 animate-pulse"></div>
        <p className="text-slate-400 text-sm">ВІДЕОРЕКЛАМА ВІД GOOGLE</p>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Нова гра в магазині!</h2>
      <p className="text-slate-400 mb-8">Встановіть зараз та отримайте бонуси.</p>
      
      <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all">
        ВСТАНОВИТИ
      </button>
    </div>
  );
};

export default AdPlaceholder;
