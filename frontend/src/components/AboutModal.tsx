import { X } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useI18n();

  useKeyboardNavigation({
    onEscape: onClose,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
      <div className="modern-card z-[41] p-8 rounded-2xl max-w-md relative fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 w-8 h-8 rounded-full button-glass flex items-center justify-center transition-all duration-300"
          aria-label={t('common.close')}
        >
          <X className="w-4 h-4" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-glow">
          {t('about.title')}
        </h2>
        
        <p className="mb-6 leading-relaxed text-slate-700">
          {t('about.description')}
        </p>
        
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            {t('about.madeWith')}{" "}
            <a
              href="https://github.com/Exploreryer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors underline decoration-dotted"
            >
              Exploreryer
            </a>
          </p>
          
          <p className="text-slate-600">
            {t('about.specialThanks')}
          </p>
          
          <p className="text-slate-600">
            {t('about.checkCode')}{" "}
            <a
              href="https://github.com/Exploreryer/wikinote"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors underline decoration-dotted"
            >
              GitHub
            </a>
          </p>
          
          <div className="pt-4 border-t border-slate-200">
            <p className="text-slate-600 mb-4 text-center">
              {t('about.support')}
            </p>
            <div className="flex justify-center">
              <a
                href="https://buymeacoffee.com/exploreryer"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <span className="text-xl">☕</span>
                {t('about.buyMeCoffee')}
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div
        className="w-full h-full z-[40] fixed inset-0"
        onClick={onClose}
        aria-label={t('common.close')}
      ></div>
    </div>
  );
}