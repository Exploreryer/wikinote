import { useInfiniteQuery } from "@tanstack/react-query"
import { useScroll } from "motion/react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useLocalization } from "./hooks/useLocalization"
import type { WikiArticle } from "./types/ArticleProps"
import { fetchWithCORS } from "./utils/environment"

function App() {
  const { currentLanguage } = useLocalization()
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
      return newArticles
    }
  }, [currentLanguage])

  const {
    data: queryData,
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
  const articles = flatArticles
  const loading = isPending || isFetching || isFetchingNextPage
  const fetchArticles = useCallback(() => {
    return queryData ? fetchNextPage() : refetch()
  }, [fetchNextPage, queryData, refetch])

  // Keep latest loading flag in refs to avoid stale closures
  const loadingRef = useRef(loading)
  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  // Initial load if empty
  useEffect(() => {
    if (articles.length === 0 && !loadingRef.current) {
      fetchArticles()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto load next page when scrolled to 80% of the page height
  const hasTriggeredRef = useRef(false)
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (p: number) => {
      if (p >= 0.8) {
        if (!hasTriggeredRef.current && !loadingRef.current) {
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
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Wiki Articles</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <a
            key={a.pageid}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg border p-4 hover:shadow-md transition"
          >
            <div className="font-medium mb-2">{a.displaytitle}</div>
            <div className="text-sm text-slate-600 line-clamp-3">{a.extract}</div>
          </a>
        ))}
      </div>
      {loading && <div className="text-sm text-slate-500">Loading...</div>}
    </div>
  )
}

export default App
