import { SavedRequest, Collection } from '../types/collection';

const REQUESTS_KEY = 'ababil_requests';
const COLLECTIONS_KEY = 'ababil_collections';

// Request operations
export function saveRequest(
    request: Omit<SavedRequest, 'id' | 'createdAt' | 'updatedAt'>
): SavedRequest {
    const requests = loadRequests();
    const now = Date.now();
    const newRequest: SavedRequest = {
        ...request,
        id: `req_${now}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
    };

    requests.push(newRequest);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    return newRequest;
}

export function loadRequests(): SavedRequest[] {
    try {
        const data = localStorage.getItem(REQUESTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function updateRequest(
    id: string,
    updates: Partial<Omit<SavedRequest, 'id' | 'createdAt'>>
): SavedRequest | null {
    const requests = loadRequests();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;

    requests[index] = {
        ...requests[index],
        ...updates,
        updatedAt: Date.now(),
    };
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    return requests[index];
}

export function deleteRequest(id: string): boolean {
    const requests = loadRequests();
    const filtered = requests.filter((r) => r.id !== id);
    if (filtered.length === requests.length) return false;

    localStorage.setItem(REQUESTS_KEY, JSON.stringify(filtered));
    return true;
}

export function getRequest(id: string): SavedRequest | null {
    const requests = loadRequests();
    return requests.find((r) => r.id === id) || null;
}

export function getRequestsByCollection(collectionId?: string): SavedRequest[] {
    const requests = loadRequests();
    if (!collectionId) {
        return requests.filter((r) => !r.collectionId);
    }
    return requests.filter((r) => r.collectionId === collectionId);
}

// Collection operations
export function saveCollection(
    collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>
): Collection {
    const collections = loadCollections();
    const now = Date.now();
    const newCollection: Collection = {
        ...collection,
        id: `col_${now}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
    };

    collections.push(newCollection);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    return newCollection;
}

export function loadCollections(): Collection[] {
    try {
        const data = localStorage.getItem(COLLECTIONS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function updateCollection(
    id: string,
    updates: Partial<Omit<Collection, 'id' | 'createdAt'>>
): Collection | null {
    const collections = loadCollections();
    const index = collections.findIndex((c) => c.id === id);
    if (index === -1) return null;

    collections[index] = {
        ...collections[index],
        ...updates,
        updatedAt: Date.now(),
    };
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
    return collections[index];
}

export function deleteCollection(id: string): boolean {
    const collections = loadCollections();
    const collection = collections.find((c) => c.id === id);
    if (!collection) return false;

    // Recursively delete child collections first
    if (collection.collections && collection.collections.length > 0) {
        collection.collections.forEach((childId) => {
            deleteCollection(childId);
        });
    }

    // Delete all requests in this collection (including nested ones)
    const requests = loadRequests();
    const updatedRequests = requests.filter((r) => r.collectionId !== id);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(updatedRequests));

    // Remove this collection
    const filtered = collections.filter((c) => c.id !== id);
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filtered));
    return true;
}

export function getCollection(id: string): Collection | null {
    const collections = loadCollections();
    return collections.find((c) => c.id === id) || null;
}
