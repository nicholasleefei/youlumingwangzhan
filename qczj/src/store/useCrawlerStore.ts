import { create } from 'zustand'
import type { Job, SeriesSearchItem } from '@/utils/api'

type CrawlerState = {
  query: string
  seriesIdInput: string
  searching: boolean
  searchError: string
  searchResults: SeriesSearchItem[]
  selectedSeriesId: number | null
  selectedSeriesName: string
  job: Job | null
  setQuery: (q: string) => void
  setSeriesIdInput: (v: string) => void
  setSearching: (v: boolean) => void
  setSearchError: (v: string) => void
  setSearchResults: (v: SeriesSearchItem[]) => void
  selectSeries: (item: SeriesSearchItem) => void
  clearSelection: () => void
  setJob: (job: Job | null) => void
}

export const useCrawlerStore = create<CrawlerState>((set) => ({
  query: '',
  seriesIdInput: '',
  searching: false,
  searchError: '',
  searchResults: [],
  selectedSeriesId: null,
  selectedSeriesName: '',
  job: null,
  setQuery: (q) => set({ query: q }),
  setSeriesIdInput: (v) => set({ seriesIdInput: v }),
  setSearching: (v) => set({ searching: v }),
  setSearchError: (v) => set({ searchError: v }),
  setSearchResults: (v) => set({ searchResults: v }),
  selectSeries: (item) =>
    set({
      selectedSeriesId: item.seriesId,
      selectedSeriesName: item.name,
      seriesIdInput: String(item.seriesId),
    }),
  clearSelection: () =>
    set({
      selectedSeriesId: null,
      selectedSeriesName: '',
    }),
  setJob: (job) => set({ job }),
}))

