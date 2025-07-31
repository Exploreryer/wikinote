import { useState, useEffect, useRef } from "react";
import { LANGUAGES } from "../languages";
import { useLocalization } from "../hooks/useLocalization";
import { useI18n } from "../hooks/useI18n";

export function LanguageSelector() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const { setLanguage } = useLocalization();
  const { t } = useI18n();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 预加载并缓存所有国旗图片为Base64
  useEffect(() => {
    const cacheImages = async () => {
      const imageCache: Record<string, string> = {};
      
             const loadImageAsBase64 = (url: string): Promise<string> => {
         return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            try {
              const dataURL = canvas.toDataURL('image/svg+xml');
              resolve(dataURL);
            } catch (error) {
              // 如果转换失败，使用原始URL
              resolve(url);
            }
          };
          img.onerror = () => resolve(url); // 失败时使用原始URL
          img.src = url;
        });
      };

      // 并行加载所有图片
      const promises = LANGUAGES.map(async (language) => {
        const base64 = await loadImageAsBase64(language.flag);
        imageCache[language.id] = base64;
      });

      await Promise.all(promises);
      setCachedImages(imageCache);
    };

    cacheImages();
  }, []);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
      style={{ zIndex: 9999 }}
    >
      <button 
        className="button-indicator px-4 py-2 text-slate-700 hover:text-purple-600 hover:bg-purple-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
        onClick={handleButtonClick}
        style={{ position: 'relative', zIndex: 10000 }}
        data-testid="language-button"
      >
        <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
        {t('app.language')}
      </button>

      {/* 语言下拉菜单 */}
      {showDropdown && (
        <div 
          className="absolute bg-white/95 backdrop-blur-2xl rounded-xl shadow-xl border border-white/40"
          style={{ 
            top: '100%',
            right: '0',
            width: '240px',
            maxHeight: '400px',
            zIndex: 10001,
            marginTop: '8px',
            position: 'absolute',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
          data-testid="language-dropdown"
        >
          <div className="p-3 border-b border-white/20">
            <div className="text-sm font-medium text-gray-800">Select Wikipedia Language</div>
          </div>
          
          <div 
            className="max-h-80 overflow-y-auto p-2" 
            style={{ scrollBehavior: 'smooth' }}
          >
            {LANGUAGES.map((language) => (
              <button
                key={language.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(language.id);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-left"
                title={`Switch to ${language.name}`}
              >
                <div className="w-5 h-5 rounded-full flex-shrink-0 bg-white/30 backdrop-blur-sm flex items-center justify-center">
                  <img 
                    className="w-5 h-5 rounded-full object-cover"
                    src={cachedImages[language.id] || language.flag} 
                    alt={`${language.name} flag`}
                    style={{ 
                      minWidth: '20px',
                      minHeight: '20px',
                      backgroundColor: 'transparent'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 hidden flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {language.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-800 truncate">{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
