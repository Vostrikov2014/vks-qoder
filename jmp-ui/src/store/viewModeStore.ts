import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'cards' | 'list';

// Pages that can show their data either as cards or as a table
export type ViewModePage = 'conferences' | 'users' | 'tenants';

interface ViewModeState {
  viewModes: Record<ViewModePage, ViewMode>;
  setViewMode: (page: ViewModePage, mode: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      // Cards are the default view for every page; the user's choice is
      // remembered per page, so switching main-menu items and coming back
      // (or reloading the app) keeps the last used view.
      viewModes: {
        conferences: 'cards',
        users: 'cards',
        tenants: 'cards',
      },
      setViewMode: (page, mode) =>
        set((state) => ({
          viewModes: { ...state.viewModes, [page]: mode },
        })),
    }),
    {
      name: 'jmp-view-mode-storage',
      // Deep-merge the stored modes over the defaults, so a newly added page
      // still gets its initial value from an older stored record
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<ViewModeState>),
        viewModes: {
          ...current.viewModes,
          ...(persisted as Partial<ViewModeState>)?.viewModes,
        },
      }),
    }
  )
);

// Per-page view mode: keeps the call sites as simple as the previous
// useState while the choice survives navigation and reloads
export const usePageViewMode = (page: ViewModePage) => {
  const viewMode = useViewModeStore((state) => state.viewModes[page]);
  const setViewMode = useViewModeStore((state) => state.setViewMode);

  return [viewMode, (mode: ViewMode) => setViewMode(page, mode)] as const;
};
