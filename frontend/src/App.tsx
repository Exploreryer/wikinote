import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView, useScroll } from "motion/react"
import { useEffect, useMemo, useRef } from "react"
import { LoadingSkeletonCards, SkeletonGrid } from "./components/SkeletonCard"
import { WikiCard } from "./components/WikiCard"
import { useLocalization } from "./hooks/useLocalization"
import type { WikiArticle } from "./types/ArticleProps"
import { fetchWithCORS } from "./utils/environment"

function App() {
  const { currentLanguage } = useLocalization()
  useScroll() // ensure motion scroll values are initialized (not used directly)

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
    fetchNextPage,
    isFetching,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["wikiArticles", currentLanguage.id],
    queryFn: () => queryFn(),
    initialPageParam: 0,
    getNextPageParam: (_lastPage: WikiArticle[], allPages: WikiArticle[][]) => allPages.length,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  const flatArticles = (queryData?.pages ?? []).flat() as WikiArticle[]
  const articles = flatArticles
  const loading = isPending || isFetching || isFetchingNextPage

  const loadMoreDetectorRef = useRef<HTMLDivElement>(null)
  const loadMoreDetectorInView = useInView(loadMoreDetectorRef)

  useEffect(() => {
    if (loadMoreDetectorInView) {
      fetchNextPage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreDetectorInView])

  return (
    <div className="masonry-grid">
      {articles.map((article, idx) => (
        <WikiCard key={article.pageid} article={article} priority={idx < 6} />
      ))}
      {isPending && <SkeletonGrid count={6} />}
      {loading && <LoadingSkeletonCards />}
      <div ref={loadMoreDetectorRef} className="h-10 col-span-full" />
    </div>
  )
}

export default App
