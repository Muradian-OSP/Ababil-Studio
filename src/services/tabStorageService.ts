import { TabState, RequestTab, createEmptyTab } from '../types/tabTypes';

const TABS_STORAGE_KEY = 'ababil_request_tabs';

/**
 * Save tabs state to localStorage
 */
export function saveTabs(state: TabState): void {
    try {
        localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save tabs:', error);
    }
}

/**
 * Load tabs state from localStorage
 * Returns a default state with one empty tab if nothing is stored
 */
export function loadTabs(): TabState {
    try {
        const data = localStorage.getItem(TABS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data) as TabState;
            // Validate structure
            if (
                parsed.tabs &&
                Array.isArray(parsed.tabs) &&
                parsed.tabs.length > 0
            ) {
                return parsed;
            }
        }
    } catch (error) {
        console.error('Failed to load tabs:', error);
    }

    // Return default state with one empty tab
    const defaultTab = createEmptyTab();
    return {
        tabs: [defaultTab],
        activeTabId: defaultTab.id,
    };
}

/**
 * Add a new tab
 */
export function addTab(state: TabState, tab: RequestTab): TabState {
    return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
    };
}

/**
 * Remove a tab by ID
 */
export function removeTab(state: TabState, tabId: string): TabState {
    const newTabs = state.tabs.filter((t) => t.id !== tabId);

    // If we removed all tabs, create a new empty one
    if (newTabs.length === 0) {
        const newTab = createEmptyTab();
        return {
            tabs: [newTab],
            activeTabId: newTab.id,
        };
    }

    // If we removed the active tab, switch to the previous or next tab
    let newActiveId = state.activeTabId;
    if (state.activeTabId === tabId) {
        const removedIndex = state.tabs.findIndex((t) => t.id === tabId);
        const newIndex = Math.min(removedIndex, newTabs.length - 1);
        newActiveId = newTabs[newIndex].id;
    }

    return {
        tabs: newTabs,
        activeTabId: newActiveId,
    };
}

/**
 * Update a tab's data
 */
export function updateTab(
    state: TabState,
    tabId: string,
    updates: Partial<RequestTab>
): TabState {
    return {
        ...state,
        tabs: state.tabs.map((tab) =>
            tab.id === tabId
                ? { ...tab, ...updates, isDirty: updates.isDirty ?? true }
                : tab
        ),
    };
}

/**
 * Set active tab
 */
export function setActiveTab(state: TabState, tabId: string): TabState {
    if (!state.tabs.find((t) => t.id === tabId)) {
        return state;
    }
    return {
        ...state,
        activeTabId: tabId,
    };
}

/**
 * Find a tab by saved request ID
 */
export function findTabBySavedRequestId(
    state: TabState,
    savedRequestId: string
): RequestTab | undefined {
    return state.tabs.find((t) => t.savedRequestId === savedRequestId);
}

/**
 * Get the active tab
 */
export function getActiveTab(state: TabState): RequestTab | undefined {
    return state.tabs.find((t) => t.id === state.activeTabId);
}
