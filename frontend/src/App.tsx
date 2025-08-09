import { Analytics } from "@vercel/analytics/react"
import { Loader2 } from "lucide-react"
import { useScroll } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { AboutModal } from "./components/AboutModal"
import { ErrorNotification } from "./components/ErrorNotification"
import { LanguageSelector } from "./components/LanguageSelector"
import { LikesModal } from "./components/LikesModal"
import { WikiCard } from "./components/WikiCard"
import { isExtension } from "./utils/environment"

import { LoadingSkeletonCards, SkeletonGrid } from "./components/SkeletonCard"
import { useI18n } from "./hooks/useI18n"
import { useImagePreloader } from "./hooks/useImagePreloader"
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation"
import { useScrollPosition } from "./hooks/useScrollPosition"
import type { AppError, WikiArticle } from "./types/ArticleProps"
import { fetchWithCORS } from "./utils/environment"
import { preloadImages } from "./utils/performance"
import { useLocalization } from "./hooks/useLocalization"

function App() {
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const { currentLanguage } = useLocalization()
  const [errorDismissed, setErrorDismissed] = useState(false)

  const { t } = useI18n()
  const { scrollY, isScrolled } = useScrollPosition(30)
  const titleOpacity = Math.max(0, 1 - scrollY / 80)
  const { scrollYProgress } = useScroll()

  // Query function to fetch a batch of random Wikipedia articles
  const queryFn = useMemo(() => {
    return async (): Promise<WikiArticle[]> => {
      const response = await fetchWithCORS(
        currentLanguage.api +
          new URLSearchParams({
            action: "query",
            format: "json",
            generator: "random",
            grnnamespace: "0",
            prop: "extracts|info|pageimages",
            inprop: "url|varianttitles",
            grnlimit: "20",
            exintro: "1",
            exlimit: "max",
            exsentences: "5",
            explaintext: "1",
            piprop: "thumbnail",
            pithumbsize: "480",
            origin: "*",
            variant: currentLanguage.id,
          })
      )
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (!data.query || !data.query.pages) throw new Error("Invalid API response")

      type WikipediaThumbnail = { source: string; width: number; height: number }
      type WikipediaPage = {
        title: string
        varianttitles?: Record<string, string>
        extract: string
        pageid: number
        thumbnail?: WikipediaThumbnail
        canonicalurl: string
      }

      const pages = data.query.pages as Record<string, WikipediaPage>
      const newArticles = Object.values(pages)
        .map(
          (page): WikiArticle => ({
            title: page.title,
            displaytitle: page.varianttitles?.[currentLanguage.id] || page.title,
            extract: page.extract,
            pageid: page.pageid,
            thumbnail: page.thumbnail,
            url: page.canonicalurl,
          })
        )
        .filter((a) => a.thumbnail && a.thumbnail.source && a.url && a.extract)

      const images = newArticles.filter((a) => a.thumbnail).map((a) => a.thumbnail!.source)
      preloadImages(images).catch(console.warn)
      return newArticles
    }
  }, [currentLanguage])

  const {
    data: queryData,
    error: queryError,
    refetch,
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["wikiArticles", currentLanguage.id],
    queryFn: () => queryFn(),
    initialPageParam: 0,
    getNextPageParam: (_lastPage: WikiArticle[], allPages: WikiArticle[][]) => allPages.length,
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const flatArticles = (queryData?.pages ?? []).flat() as WikiArticle[]
  const articles = flatArticles.length > 200 ? flatArticles.slice(flatArticles.length - 200) : flatArticles
  const loading = isPending || isFetching || isFetchingNextPage
  const error: AppError | null = useMemo(() => {
    if (errorDismissed || !queryError) return null
    return {
      title: t("errors.fetchFailed"),
      message: queryError instanceof Error ? queryError.message : t("errors.somethingWrong"),
      action: { label: t("common.retry"), handler: () => refetch() },
    }
  }, [errorDismissed, queryError, refetch, t])
  const clearError = () => setErrorDismissed(true)
  const fetchArticles = useCallback(() => {
    setErrorDismissed(false)
    return queryData ? fetchNextPage() : refetch()
  }, [fetchNextPage, queryData, refetch])

  // Preload images for better user experience
  const imageUrls = articles.filter((article) => article.thumbnail).map((article) => article.thumbnail!.source)

  useImagePreloader(imageUrls, {
    enabled: articles.length > 0,
    maxConcurrent: 2, // Conservative to avoid overwhelming the browser
    priority: "normal",
  })

  // Keyboard shortcut support
  useKeyboardNavigation({
    onEscape: () => {
      if (showAbout) setShowAbout(false)
      if (showLikes) setShowLikes(false)
    },
    enabled: !showAbout && !showLikes, // Only enable when no modals are open
  })

  // Keep latest loading/error in refs to avoid stale closures
  const loadingRef = useRef(loading)
  const errorRef = useRef(error)
  useEffect(() => {
    loadingRef.current = loading
    errorRef.current = error
  }, [loading, error])

  // Initial load if empty
  useEffect(() => {
    if (articles.length === 0 && !loadingRef.current && !errorRef.current) {
      fetchArticles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto load next page when scrolled to 80% of the page height
  const hasTriggeredRef = useRef(false)
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (p: number) => {
      if (p >= 0.8) {
        if (!hasTriggeredRef.current && !loadingRef.current && !errorRef.current) {
          hasTriggeredRef.current = true
          fetchArticles()
        }
      } else if (p < 0.7) {
        // hysteresis to avoid rapid re-triggers around the threshold
        hasTriggeredRef.current = false
      }
    })
    return () => unsubscribe()
  }, [fetchArticles, scrollYProgress])

  return (
    <div
      className="h-screen w-full gradient-bg text-slate-800 overflow-y-scroll snap-y snap-mandatory hide-scroll"
      style={{ contain: "content" }}
    >
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.location.reload()}
          className={`text-2xl font-bold text-glow hover:opacity-90 transition-all duration-300 px-2 py-1 hover:scale-105 text-slate-800 ${
            titleOpacity === 0 ? "pointer-events-none" : ""
          }`}
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleOpacity === 0 ? "-10px" : "0"})`,
            transition: "all 0.3s ease-in-out",
          }}
        >
          {t("app.title")}
        </button>
      </div>

      <div className="fixed top-4 right-4 z-50">
        {/* Modern design button group */}
        <div className="flex items-center gap-3">
          {/* Function button group */}
          <div
            className={`modern-button-group flex items-center rounded-full p-1 border shadow-lg transition-all duration-300 ${
              isScrolled
                ? "bg-white/95 backdrop-blur-xl border-white/40 shadow-xl"
                : "bg-white/10 backdrop-blur-xl border-white/20"
            }`}
          >
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="button-indicator px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              {t("app.about")}
            </button>
            <button
              onClick={() => setShowLikes(!showLikes)}
              className="button-indicator px-4 py-2 text-slate-700 hover:text-red-500 hover:bg-red-50/80 rounded-full transition-all duration-300 text-sm font-medium flex items-center gap-2 group"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
              {t("app.likes")}
            </button>
          </div>

          {/* Language selector - Independent design, ensure highest level */}
          <div
            className={`rounded-full p-1 border shadow-lg relative transition-all duration-300 ${
              isScrolled
                ? "bg-white/95 backdrop-blur-xl border-white/40 shadow-xl"
                : "bg-white/10 backdrop-blur-xl border-white/20"
            }`}
            style={{ zIndex: 9998, overflow: "visible" }}
          >
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Modal components */}
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

      <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} />

      {/* Error notification */}
      <ErrorNotification error={error} onClose={clearError} />

      {/* Content area */}
      <div className="masonry-grid">
        {articles.map((article, idx) => (
          <WikiCard key={article.pageid} article={article} priority={idx < 6} />
        ))}

        {/* Show skeleton when loading more - only when there's content and loading */}
        {loading && articles.length > 0 && <LoadingSkeletonCards />}

        {/* Initial loading skeleton - in the same container */}
        {articles.length === 0 && loading && <SkeletonGrid count={6} />}
      </div>

      {/* Loading indicator when loading more */}
      {loading && articles.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 glass-effect px-6 py-3 rounded-full shadow-lg border border-white/20 pointer-events-none z-[60]">
          <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
          <span className="text-slate-700 font-medium">{t("common.loadingMore")}</span>
        </div>
      )}
      {!isExtension && <Analytics />}
    </div>
  )
}

export default App
