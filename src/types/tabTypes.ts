import { RequestAuth, RequestHeader } from './http';

/**
 * Represents a single request tab with all its state
 */
export interface RequestTab {
    id: string;
    name: string;
    method: string;
    url: string;
    body: string;
    headers: RequestHeader[];
    auth?: RequestAuth;
    testScript?: string;
    // Track the saved request this tab is associated with (if any)
    savedRequestId?: string;
    collectionId?: string;
    // Dirty state - true if tab has unsaved changes
    isDirty: boolean;
    // Response from last request
    response?: {
        status_code: number;
        headers: Array<{ key: string; value: string }>;
        body: string;
        duration_ms: number;
    } | null;
}

/**
 * State for all open tabs
 */
export interface TabState {
    tabs: RequestTab[];
    activeTabId: string | null;
}

/**
 * Generate a unique tab ID
 */
export function generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty tab
 */
export function createEmptyTab(name?: string): RequestTab {
    return {
        id: generateTabId(),
        name: name || 'Untitled Request',
        method: 'GET',
        url: '',
        body: '',
        headers: [],
        isDirty: false,
        response: null,
    };
}
