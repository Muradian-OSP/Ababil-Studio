import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import {
    TabState,
    RequestTab,
    createEmptyTab,
    generateTabId,
} from '../types/tabTypes';
import { RequestHeader, RequestAuth } from '../types/http';
import { SavedRequest } from '../types/collection';
import {
    saveTabs,
    loadTabs,
    addTab as addTabToState,
    removeTab as removeTabFromState,
    updateTab as updateTabInState,
    setActiveTab as setActiveTabInState,
    findTabBySavedRequestId,
    getActiveTab as getActiveTabFromState,
} from '../services/tabStorageService';

interface TabContextType {
    // State
    tabState: TabState;
    activeTab: RequestTab | undefined;

    // Tab management
    openNewTab: (name?: string) => RequestTab;
    openRequestInTab: (request: SavedRequest) => void;
    closeTab: (tabId: string) => void;
    switchToTab: (tabId: string) => void;

    // Active tab updates
    updateActiveTab: (updates: Partial<RequestTab>) => void;
    setMethod: (method: string) => void;
    setUrl: (url: string) => void;
    setBody: (body: string) => void;
    setHeaders: (headers: RequestHeader[]) => void;
    setAuth: (auth: RequestAuth | undefined) => void;
    setResponse: (response: RequestTab['response']) => void;
    setTestScript: (testScript: string | undefined) => void;
    markAsSaved: (savedRequestId: string, name: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: React.ReactNode }) {
    const [tabState, setTabState] = useState<TabState>(() => loadTabs());
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get active tab
    const activeTab = getActiveTabFromState(tabState);

    // Debounced save to localStorage
    const debouncedSave = useCallback((state: TabState) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveTabs(state);
        }, 300);
    }, []);

    // Save state on changes
    useEffect(() => {
        debouncedSave(tabState);
    }, [tabState, debouncedSave]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Open a new empty tab
    const openNewTab = useCallback((name?: string): RequestTab => {
        const newTab = createEmptyTab(name);
        setTabState((prev) => addTabToState(prev, newTab));
        return newTab;
    }, []);

    // Open a saved request in a tab (or focus existing tab if already open)
    const openRequestInTab = useCallback((request: SavedRequest) => {
        setTabState((prev) => {
            // Check if this request is already open in a tab
            const existingTab = findTabBySavedRequestId(prev, request.id);
            if (existingTab) {
                return setActiveTabInState(prev, existingTab.id);
            }

            // Create a new tab for this request
            const newTab: RequestTab = {
                id: generateTabId(),
                name: request.name,
                method: request.method,
                url: request.url,
                body: request.body || '',
                headers: request.headers
                    ? Object.entries(request.headers).map(([key, value]) => ({
                          key,
                          value,
                          disabled: false,
                      }))
                    : [],
                auth: request.auth,
                testScript: request.testScript,
                savedRequestId: request.id,
                collectionId: request.collectionId,
                isDirty: false,
                response: null,
            };

            return addTabToState(prev, newTab);
        });
    }, []);

    // Close a tab
    const closeTab = useCallback((tabId: string) => {
        setTabState((prev) => removeTabFromState(prev, tabId));
    }, []);

    // Switch to a tab
    const switchToTab = useCallback((tabId: string) => {
        setTabState((prev) => setActiveTabInState(prev, tabId));
    }, []);

    // Update active tab
    const updateActiveTab = useCallback((updates: Partial<RequestTab>) => {
        setTabState((prev) => {
            if (!prev.activeTabId) return prev;
            return updateTabInState(prev, prev.activeTabId, updates);
        });
    }, []);

    // Convenience methods for updating specific fields
    const setMethod = useCallback(
        (method: string) => updateActiveTab({ method }),
        [updateActiveTab]
    );
    const setUrl = useCallback(
        (url: string) => updateActiveTab({ url }),
        [updateActiveTab]
    );
    const setBody = useCallback(
        (body: string) => updateActiveTab({ body }),
        [updateActiveTab]
    );
    const setHeaders = useCallback(
        (headers: RequestHeader[]) => updateActiveTab({ headers }),
        [updateActiveTab]
    );
    const setAuth = useCallback(
        (auth: RequestAuth | undefined) => updateActiveTab({ auth }),
        [updateActiveTab]
    );
    const setResponse = useCallback(
        (response: RequestTab['response']) =>
            updateActiveTab({ response, isDirty: false }),
        [updateActiveTab]
    );
    const setTestScript = useCallback(
        (testScript: string | undefined) => updateActiveTab({ testScript }),
        [updateActiveTab]
    );

    // Mark the active tab as saved (after saving to storage)
    const markAsSaved = useCallback(
        (savedRequestId: string, name: string) => {
            updateActiveTab({ savedRequestId, name, isDirty: false });
        },
        [updateActiveTab]
    );

    const value: TabContextType = {
        tabState,
        activeTab,
        openNewTab,
        openRequestInTab,
        closeTab,
        switchToTab,
        updateActiveTab,
        setMethod,
        setUrl,
        setBody,
        setHeaders,
        setAuth,
        setResponse,
        setTestScript,
        markAsSaved,
    };

    return <TabContext.Provider value={value}>{children}</TabContext.Provider>;
}

export function useTabContext(): TabContextType {
    const context = useContext(TabContext);
    if (!context) {
        throw new Error('useTabContext must be used within a TabProvider');
    }
    return context;
}
