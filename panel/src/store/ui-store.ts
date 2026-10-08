import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  searchOpen: boolean
  toggleSidebar: () => void
  setMobileNav: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
}

/** Estado global de interfaz (el de datos vive en TanStack Query). */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      searchOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNav: (open) => set({ mobileNavOpen: open }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    { name: 'sarebidea-panel-ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }), skipHydration: true },
  ),
)
