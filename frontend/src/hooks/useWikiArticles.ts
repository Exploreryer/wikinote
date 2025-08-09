import { useCallback, useRef, useState } from "react"
import type { AppError, WikiArticle } from "../types/ArticleProps"
import { fetchWithCORS } from "../utils/environment"
import { preloadImages, retry } from "../utils/performance"
import { useI18n } from "./useI18n"
import { useLocalization } from "./useLocalization"

export function useWikiArticles() {
  const [articles, setArticles] = useState<WikiArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const { currentLanguage, ready } = useLocalization()
  const { t } = useI18n()
  // Guard ref to prevent overlapping/infinite fetch loops without depending on loading in the callback deps
  const isFetchingRef = useRef(false)

  const fetchArticles = useCallback(
    async () => {
      if (isFetchingRef.current) return
      if (!ready) return
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const fetchWithRetry = () =>
          retry(
            async () => {
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
                    // Request a reasonable thumbnail size to balance clarity and speed
                    // We still provide a low-res first via srcset for faster paint.
                    pithumbsize: "480",
                    origin: "*",
                    variant: currentLanguage.id,
                  })
              )

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
              }

              return response.json()
            },
            3,
            1000
          )

        const data = await fetchWithRetry()

        if (!data.query || !data.query.pages) {
          throw new Error("Invalid API response")
        }

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
          .filter((article) => article.thumbnail && article.thumbnail.source && article.url && article.extract)

        // Preload images without blocking rendering
        const imageSources = newArticles
          .filter((article) => article.thumbnail)
          .map((article) => article.thumbnail!.source)

        preloadImages(imageSources).catch(console.warn)

        // 直接合并到 articles，不再使用 buffer 或后台预取
        setArticles((prev) => {
          const merged = [...prev, ...newArticles]
          const MAX = 200
          return merged.length > MAX ? merged.slice(merged.length - MAX) : merged
        })
      } catch (fetchError) {
        console.error("Error fetching articles:", fetchError)
        const appError: AppError = {
          title: t("errors.fetchFailed"),
          message:
            fetchError instanceof Error
              ? fetchError.message.includes("fetch")
                ? t("errors.networkError")
                : t("errors.tryAgain")
              : t("errors.somethingWrong"),
          action: {
            label: t("common.retry"),
            handler: () => fetchArticles(),
          },
        }
        setError(appError)
      } finally {
        isFetchingRef.current = false
        setLoading(false)
      }
    },
    [currentLanguage, t, ready]
  )

  const clearError = () => setError(null)

  return {
    articles,
    loading,
    error,
    clearError,
    fetchArticles,
  }
}
