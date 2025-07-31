import { useEffect, useRef, useCallback, useState } from "react";
import { WikiCard } from "./components/WikiCard";
import { Loader2 } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { LanguageSelector } from "./components/LanguageSelector";
import { AboutModal } from "./components/AboutModal";
import { LikesModal } from "./components/LikesModal";
import { ErrorNotification } from "./components/ErrorNotification";

import { useWikiArticles } from "./hooks/useWikiArticles";
import { useScrollPosition } from "./hooks/useScrollPosition";
import { useI18n } from "./hooks/useI18n";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { SkeletonGrid, LoadingSkeletonCards } from "./components/SkeletonCard";
import { createLazyLoadObserver } from "./utils/performance";

function App() {
  const [showAbout, setShowAbout] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const { articles, loading, error, clearError, fetchArticles } = useWikiArticles();

  const { t } = useI18n();
  const observerTarget = useRef(null);
  const isScrolled = useScrollPosition(10);

  // Keyboard shortcut support
  useKeyboardNavigation({
    onEscape: () => {
      if (showAbout) setShowAbout(false);
      if (showLikes) setShowLikes(false);
    },
    enabled: !showAbout && !showLikes, // Only enable when no modals are open
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && !loading && !error) {
        fetchArticles();
      }
    },
    [loading, error, fetchArticles]
  );

  useEffect(() => {
    const observer = createLazyLoadObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="h-screen w-full gradient-bg text-slate-800 overflow-y-scroll snap-y snap-mandatory hide-scroll">
      {/* Semi-transparent navigation bar background */}
      <div className={`fixed top-0 left-0 right-0 h-20 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg' 
          : 'bg-transparent'
      }`}></div>

      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.location.reload()}
          className={`text-2xl font-bold text-glow hover:opacity-90 transition-all duration-300 px-2 py-1 hover:scale-105 ${
            isScrolled ? 'text-slate-800' : 'text-slate-800'
          }`}
        >
          {t('app.title')}
        </button>
      </div>

      <div className="fixed top-4 right-4 z-50">
        {/* Modern design button group */}
        <div className="flex items-center gap-3">
          {/* Function button group */}
          <div className={`modern-button-group flex items-center rounded-full p-1 border shadow-lg transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/90 backdrop-blur-xl border-white/30' 
              : 'bg-white/10 backdrop-blur-xl border-white/20'
          }`}>
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="button-indicator px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              {t('app.about')}
            </button>
            <button
              onClick={() => setShowLikes(!showLikes)}
              className="button-indicator px-4 py-2 text-slate-700 hover:text-red-500 hover:bg-red-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              {t('app.likes')}
            </button>
          </div>
          
          {/* Language selector - Independent design, ensure highest level */}
          <div className={`rounded-full p-1 border shadow-lg relative transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/90 backdrop-blur-xl border-white/30' 
              : 'bg-white/10 backdrop-blur-xl border-white/20'
          }`} style={{ zIndex: 9998, overflow: 'visible' }}>
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Modal components */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} />
      
      {/* Error notification */}
      <ErrorNotification 
        error={error} 
        onClose={clearError}
      />

      {/* Content area */}
      <div className="masonry-grid">
        {articles.map((article) => (
          <WikiCard key={article.pageid} article={article} />
        ))}
        
        {/* Show skeleton when loading more - only when there's content and loading */}
        {loading && articles.length > 0 && (
          <LoadingSkeletonCards />
        )}
        
        {/* Initial loading skeleton - in the same container */}
        {articles.length === 0 && loading && (
          <SkeletonGrid count={6} />
        )}
        
        <div ref={observerTarget} className="h-10 col-span-full" />
      </div>
      
      {/* Loading indicator when loading more */}
      {loading && articles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 glass-effect px-6 py-3 rounded-full shadow-lg border border-white/20">
          <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
          <span className="text-slate-700 font-medium">{t('common.loadingMore')}</span>
        </div>
      )}
      <Analytics />
    </div>
  );
}

export default App;
