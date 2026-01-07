import { Collection, SavedRequest } from '../types/collection';
import {
    saveCollection,
    saveRequest,
    updateCollection,
    getCollection,
} from './storage';
import { httpRequestToSavedRequest } from '../types/collection';

// Postman Collection types (matching Rust structs)
interface PostmanCollectionInfo {
    name: string;
    description?: string;
    schema?: string;
    _postman_id?: string;
    _exporter_id?: string;
}

interface PostmanRequest {
    method?: string;
    header?: Array<{ key: string; value: string; disabled?: boolean }>;
    body?: {
        mode?: string;
        raw?: string;
        urlencoded?: Array<{ key: string; value: string }>;
        formdata?: Array<{ key: string; value: string }>;
    };
    url?: {
        raw?: string;
        protocol?: string;
        host?: string[];
        path?: string[];
        query?: Array<{ key: string; value?: string; disabled?: boolean }>;
    };
    auth?: any;
    description?: string;
}

interface PostmanCollectionItem {
    name: string;
    item?: PostmanCollectionItem[]; // nested folders
    request?: PostmanRequest; // actual request
    response?: any[];
    event?: any[];
    description?: string;
    variable?: any[];
}

interface PostmanCollection {
    info: PostmanCollectionInfo;
    item: PostmanCollectionItem[];
    variable?: any[];
    event?: any[];
    auth?: any;
}

interface ConversionResult {
    collections: Collection[];
    requests: SavedRequest[];
    environment?: import('../types/environment').Environment;
}

/**
 * Parse Postman collection JSON using Rust library
 */
export async function parsePostmanCollection(
    jsonString: string
): Promise<PostmanCollection> {
    if (typeof window === 'undefined' || !window.ababilAPI) {
        throw new Error('Not running in Electron environment');
    }

    try {
        const resultJson = await window.ababilAPI.parsePostmanCollection(
            jsonString
        );
        const result = JSON.parse(resultJson);

        if (result.error) {
            throw new Error(result.error);
        }

        return result as PostmanCollection;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse Postman collection: ${errorMessage}`);
    }
}

/**
 * Convert Postman Request to our HttpRequest format
 */
function convertPostmanRequestToHttpRequest(
    postmanRequest: PostmanRequest
): any {
    // Build URL - prefer raw, otherwise construct from parts
    let url: any = undefined;
    if (postmanRequest.url) {
        if (postmanRequest.url.raw) {
            url = { raw: postmanRequest.url.raw };
        } else {
            // Construct URL from parts
            const protocol = postmanRequest.url.protocol || 'http';
            const host = postmanRequest.url.host?.join('.') || '';
            const path = postmanRequest.url.path?.join('/') || '';
            const query = postmanRequest.url.query
                ?.filter((q) => !q.disabled && q.value)
                .map((q) => `${q.key}=${encodeURIComponent(q.value || '')}`)
                .join('&');

            const constructedUrl = `${protocol}://${host}${
                path ? '/' + path : ''
            }${query ? '?' + query : ''}`;
            url = { raw: constructedUrl };
        }

        // Also include structured parts if available
        if (
            postmanRequest.url.protocol ||
            postmanRequest.url.host ||
            postmanRequest.url.path
        ) {
            url = {
                ...url,
                protocol: postmanRequest.url.protocol,
                host: postmanRequest.url.host,
                path: postmanRequest.url.path,
                query: postmanRequest.url.query?.map((q) => ({
                    key: q.key,
                    value: q.value,
                    disabled: q.disabled,
                })),
            };
        }
    }

    return {
        method: postmanRequest.method || 'GET',
        url,
        header: postmanRequest.header
            ?.filter((h) => !h.disabled)
            .map((h) => ({
                key: h.key,
                value: h.value,
                disabled: h.disabled,
            })),
        body: postmanRequest.body
            ? {
                  mode: (postmanRequest.body.mode || 'raw') as any,
                  raw: postmanRequest.body.raw,
                  urlencoded: postmanRequest.body.urlencoded?.map((f) => ({
                      key: f.key,
                      value: f.value,
                  })),
                  formdata: postmanRequest.body.formdata?.map((f) => ({
                      key: f.key,
                      value: f.value,
                  })),
              }
            : undefined,
        auth: postmanRequest.auth,
        description: postmanRequest.description,
    };
}

/**
 * Recursively convert Postman collection items to our format
 * Returns only direct children (not nested collections - those are already linked via parent's collections array)
 */
function convertPostmanItems(
    items: PostmanCollectionItem[],
    parentCollectionId?: string
): ConversionResult {
    const directCollections: Collection[] = []; // Only direct children, not nested
    const allRequests: SavedRequest[] = [];

    for (const item of items) {
        if (item.request) {
            // This is a request
            const httpRequest = convertPostmanRequestToHttpRequest(
                item.request
            );
            const savedRequestData = httpRequestToSavedRequest(
                httpRequest,
                item.name,
                parentCollectionId
            );
            const saved = saveRequest(savedRequestData);
            allRequests.push(saved);
        } else if (item.item && item.item.length > 0) {
            // This is a folder/collection - create it first
            const collection = saveCollection({
                name: item.name,
                requests: [],
                collections: [],
            });

            // Process children recursively
            const childResult = convertPostmanItems(item.item, collection.id);

            // Update collection with child IDs
            const childRequestIds = childResult.requests.map((r) => r.id);
            const childCollectionIds = childResult.collections.map((c) => c.id);

            // Update the collection with child IDs
            updateCollection(collection.id, {
                requests: childRequestIds,
                collections:
                    childCollectionIds.length > 0
                        ? childCollectionIds
                        : undefined,
            });

            // Get updated collection
            const updatedCollection = getCollection(collection.id);
            if (updatedCollection) {
                // Only add direct children to the result
                // Nested collections are already linked via the parent's collections array
                directCollections.push(updatedCollection);
            }

            // Add nested requests (they're already linked to their parent collection)
            allRequests.push(...childResult.requests);
        }
    }

    return { collections: directCollections, requests: allRequests };
}

/**
 * Convert Postman collection to our format and save to storage
 */
export async function importPostmanCollection(
    jsonString: string
): Promise<ConversionResult> {
    // Parse using Rust library
    const postmanCollection = await parsePostmanCollection(jsonString);

    // Create parent collection wrapper using Postman collection name
    const parentCollection = saveCollection({
        name: postmanCollection.info.name || 'Imported Collection',
        requests: [],
        collections: [],
    });

    // Convert items under parent collection
    const result = convertPostmanItems(
        postmanCollection.item,
        parentCollection.id
    );

    // Update parent with child collection IDs and request IDs
    const childCollectionIds = result.collections.map((c) => c.id);
    const childRequestIds = result.requests.map((r) => r.id);

    updateCollection(parentCollection.id, {
        collections:
            childCollectionIds.length > 0 ? childCollectionIds : undefined,
        requests: childRequestIds.length > 0 ? childRequestIds : undefined,
    });

    // Get updated parent collection
    const updatedParent = getCollection(parentCollection.id);

    // Import collection-level variables as an environment if they exist
    let importedEnvironment:
        | import('../types/environment').Environment
        | undefined;
    if (postmanCollection.variable && postmanCollection.variable.length > 0) {
        const { saveEnvironment } = await import('./environmentService');
        const collectionName =
            postmanCollection.info.name || 'Imported Collection';

        const variables = postmanCollection.variable
            .map((v: any) => ({
                key: v.key || '',
                value: v.value || '',
                type: (v.type as 'string' | 'number' | 'boolean') || 'string',
                disabled: v.disabled === true,
            }))
            .filter((v: any) => v.key); // Filter out variables without keys

        if (variables.length > 0) {
            importedEnvironment = saveEnvironment({
                name: `${collectionName} - Variables`,
                variables,
                isActive: false,
                collectionId: parentCollection.id, // Link to parent collection
            });
        }
    }

    // Return only the parent collection
    // Nested collections are already linked via parent's collections array
    // The Sidebar component will handle the nested structure correctly
    return {
        collections: updatedParent ? [updatedParent] : [],
        requests: result.requests,
        environment: importedEnvironment,
    };
}

// Postman Environment types
interface PostmanEnvironment {
    id?: string;
    name: string;
    values?: Array<{
        key: string;
        value: string;
        type?: string;
        enabled?: boolean;
    }>;
    _postman_variable_scope?: string;
    _postman_exported_at?: string;
    _postman_exported_using?: string;
}

/**
 * Parse Postman environment JSON using Rust library
 */
export async function parsePostmanEnvironmentJson(
    jsonString: string
): Promise<PostmanEnvironment> {
    if (typeof window === 'undefined' || !window.ababilAPI) {
        throw new Error('Not running in Electron environment');
    }

    try {
        const resultJson = await window.ababilAPI.parsePostmanEnvironment(
            jsonString
        );
        const result = JSON.parse(resultJson);

        if (result.error) {
            throw new Error(result.error);
        }

        return result as PostmanEnvironment;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to parse Postman environment: ${errorMessage}`);
    }
}

/**
 * Import Postman environment and convert to our format
 */
export async function importPostmanEnvironment(
    jsonString: string
): Promise<import('../types/environment').Environment> {
    const { saveEnvironment } = await import('./environmentService');
    const postmanEnv = await parsePostmanEnvironmentJson(jsonString);

    const variables = (postmanEnv.values || []).map((v) => ({
        key: v.key,
        value: v.value,
        type: (v.type as 'string' | 'number' | 'boolean') || 'string',
        disabled: !v.enabled,
    }));

    const environment = saveEnvironment({
        name: postmanEnv.name,
        variables,
        isActive: false,
    });

    return environment;
}
