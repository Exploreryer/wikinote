import { useInfiniteQuery } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import type { AppError, WikiArticle } from "../types/ArticleProps"
import { fetchWithCORS } from "../utils/environment"
import { preloadImages } from "../utils/performance"
import { useI18n } from "./useI18n"
import { useLocalization } from "./useLocalization"

export function useWikiArticles() {
  const [errorDismissed, setErrorDismissed] = useState(false)
  const { currentLanguage } = useLocalization()
  const { t } = useI18n()
  const queryFn = useCallback(async () => {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
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

    const imageSources = newArticles.filter((a) => a.thumbnail).map((a) => a.thumbnail!.source)
    preloadImages(imageSources).catch(console.warn)
    return newArticles
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
    queryFn: async () => queryFn(),
    initialPageParam: 0,
    getNextPageParam: (_lastPage: WikiArticle[], allPages: WikiArticle[][]) => allPages.length,
    enabled: false, // 手动触发，保持与原始逻辑一致
    retry: false,
    refetchOnWindowFocus: false,
  })

  const flatArticles = (queryData?.pages ?? []).flat() as WikiArticle[]
  const articles = flatArticles.length > 200 ? flatArticles.slice(flatArticles.length - 200) : flatArticles

  const loading = isPending || isFetching || isFetchingNextPage

  const mappedError: AppError | null =
    !errorDismissed && queryError
      ? {
          title: t("errors.fetchFailed"),
          message: queryError instanceof Error ? queryError.message : t("errors.somethingWrong"),
          action: { label: t("common.retry"), handler: () => refetch() },
        }
      : null

  const clearError = () => setErrorDismissed(true)

  const fetchArticles = useCallback(() => {
    setErrorDismissed(false)
    if (!queryData) {
      return refetch()
    }
    return fetchNextPage()
  }, [fetchNextPage, queryData, refetch])

  return {
    articles,
    loading,
    error: mappedError,
    clearError,
    fetchArticles,
  }
}
