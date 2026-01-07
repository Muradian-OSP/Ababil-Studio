import { useState, useEffect } from 'react';
import { makeHttpRequest } from '../../services/httpClient';
import { HttpResponse, RequestAuth, HttpRequest } from '../../types/http';
import {
    SavedRequest,
    Collection,
    httpRequestToSavedRequest,
} from '../../types/collection';
import { RequestHeader } from '../../types/http';
import { AuthToken } from '../../types/auth';
import {
    saveRequest,
    loadRequests,
    loadCollections,
    getCollection,
} from '../../services/storage';
import { loadTokens } from '../../services/authTokenService';
import {
    replaceVariablesInUrl,
    replaceVariablesInBody,
    replaceVariablesInHeaders,
    replaceVariablesInAuth,
} from '../../utils/variableReplacer';
import { resolveAuth } from '../../utils/authInheritance';
import { useTheme } from '../../contexts/ThemeContext';
import {
    EnvironmentProvider,
    useEnvironment,
} from '../../contexts/EnvironmentContext';
import { TopHeader } from '../header/TopHeader';
import { LeftNav } from '../navigation/LeftNav';
import { RequestSection } from '../request/RequestSection';
import { ResponseSection } from '../response/ResponseSection';
import { Sidebar } from '../sidebar/Sidebar';
import { EnvironmentPage } from '../environment/EnvironmentPage';
import { SettingsPage } from '../settings/SettingsPage';
import { AuthTokensPage } from '../auth/AuthTokensPage';
import { ResizableLayout } from './ResizableLayout';

type ViewType = 'collections' | 'environments' | 'authTokens' | 'settings';

// Inner component that uses the environment context
function HomeLayoutContent() {
    const { effectiveTheme } = useTheme();
    const { activeEnvironment, refreshEnvironments } = useEnvironment();
    const [currentView, setCurrentView] = useState<ViewType>('collections');
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState(
        'https://jsonplaceholder.typicode.com/posts/1/comments'
    );
    const [requestBody, setRequestBody] = useState('');
    const [headers, setHeaders] = useState<RequestHeader[]>([]);
    const [response, setResponse] = useState<HttpResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [requests, setRequests] = useState<SavedRequest[]>([]);
    // Auth tokens are in-memory only (cleared on app restart like Postman)
    const [authTokens, setAuthTokens] = useState<AuthToken[]>([]);
    const [requestAuth, setRequestAuth] = useState<RequestAuth | undefined>();
    const [activeRequestId, setActiveRequestId] = useState<
        string | undefined
    >();
    const [currentRequestName, setCurrentRequestName] = useState<string>('');
    const [testScript, setTestScript] = useState<string | undefined>();

    // Load data on mount
    useEffect(() => {
        refreshData();
        refreshAuthTokens();
    }, []);

    const refreshAuthTokens = () => {
        const tokens = loadTokens();
        setAuthTokens(tokens);
    };

    const refreshData = () => {
        setCollections(loadCollections());
        setRequests(loadRequests());
    };

    const handleSend = async () => {
        if (!url.trim()) return;

        setLoading(true);
        setResponse(null);

        try {
            // Replace variables before sending (including auth tokens)
            const resolvedUrl = replaceVariablesInUrl(
                url,
                activeEnvironment,
                authTokens
            );
            const resolvedBody = replaceVariablesInBody(
                requestBody,
                activeEnvironment,
                authTokens
            );
            // Convert headers array to Record, filtering out disabled and empty headers
            const headersRecord: Record<string, string> = {};
            headers
                .filter((h) => !h.disabled && h.key.trim())
                .forEach((h) => {
                    headersRecord[h.key] = h.value;
                });

            // Automatically apply auth tokens if no Authorization header exists
            // This mimics Postman's behavior where extracted tokens are auto-applied
            if (
                !headersRecord['Authorization'] &&
                !headersRecord['authorization'] &&
                !requestAuth
            ) {
                // Check for common token names in priority order
                const commonTokenNames = [
                    'token',
                    'access_token',
                    'accessToken',
                    'authToken',
                    'bearerToken',
                    'bearer_token',
                    'apiToken',
                    'api_token',
                ];

                for (const tokenName of commonTokenNames) {
                    const token = authTokens.find(
                        (t) => t.name.toLowerCase() === tokenName.toLowerCase()
                    );
                    if (token) {
                        // Automatically add as Bearer token
                        headersRecord[
                            'Authorization'
                        ] = `Bearer ${token.value}`;
                        break;
                    }
                }
            }

            // Add Content-Type header for POST/PUT/PATCH if body exists
            if (resolvedBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
                if (!headersRecord['Content-Type']) {
                    headersRecord['Content-Type'] = 'application/json';
                }
            }

            const resolvedHeaders = replaceVariablesInHeaders(
                headersRecord,
                activeEnvironment,
                authTokens
            );

            // Replace variables in auth object if present
            const resolvedAuth = requestAuth
                ? replaceVariablesInAuth(
                      requestAuth,
                      activeEnvironment,
                      authTokens
                  )
                : undefined;

            // Build full HttpRequest with auth
            const request: HttpRequest = {
                method,
                url: { raw: resolvedUrl },
                header: Object.entries(resolvedHeaders).map(([key, value]) => ({
                    key,
                    value,
                })),
                body: resolvedBody
                    ? { mode: 'raw', raw: resolvedBody }
                    : undefined,
                auth: resolvedAuth,
                testScript,
            };

            const result = await makeHttpRequest(request);
            setResponse(result);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            setResponse({
                status_code: 0,
                headers: [],
                body: `Error: ${errorMessage}`,
                duration_ms: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSend();
        }
    };

    const handleRequestSelect = (request: SavedRequest) => {
        setActiveRequestId(request.id);
        setCurrentRequestName(request.name);
        setMethod(request.method);
        setUrl(request.url);
        setRequestBody(request.body || '');
        // Convert headers from Record to RequestHeader array
        if (request.headers) {
            setHeaders(
                Object.entries(request.headers).map(([key, value]) => ({
                    key,
                    value,
                    disabled: false,
                }))
            );
        } else {
            setHeaders([]);
        }

        // Resolve auth with inheritance
        let resolvedAuth = request.auth;
        if (request.collectionId) {
            const collection = getCollection(request.collectionId);
            if (collection) {
                resolvedAuth = resolveAuth(request.auth, collection.auth);
            }
        }
        setRequestAuth(resolvedAuth);
        setTestScript(request.testScript);
        setResponse(null);
    };

    const handleSave = (name: string, collectionId?: string) => {
        // Convert headers array to Record for saving
        const headersRecord: Record<string, string> = {};
        headers
            .filter((h) => !h.disabled && h.key.trim())
            .forEach((h) => {
                headersRecord[h.key] = h.value;
            });

        const request: HttpRequest = {
            method,
            url: { raw: url },
            header: Object.entries(headersRecord).map(([key, value]) => ({
                key,
                value,
            })),
            body: requestBody ? { mode: 'raw', raw: requestBody } : undefined,
            auth: requestAuth,
            testScript,
        };
        const savedRequestData = httpRequestToSavedRequest(
            request,
            name,
            collectionId
        );
        const saved = saveRequest(savedRequestData);
        setActiveRequestId(saved.id);
        setCurrentRequestName(saved.name);
        refreshData();
    };

    const handleNewRequest = () => {
        setActiveRequestId(undefined);
        setCurrentRequestName('');
        setMethod('GET');
        setUrl('');
        setRequestBody('');
        setHeaders([]);
        setRequestAuth(undefined);
        setTestScript(undefined);
        setResponse(null);
    };

    const handleNavClick = (view: ViewType) => {
        setCurrentView(view);
    };

    // Sidebar content (collections/requests)
    const sidebar = (
        <Sidebar
            collections={collections}
            requests={requests}
            onRequestSelect={handleRequestSelect}
            activeRequestId={activeRequestId}
            onNewCollection={refreshData}
            onNewRequest={handleNewRequest}
            onCollectionCreated={refreshData}
            onImportComplete={() => {
                refreshData();
                refreshEnvironments();
            }}
        />
    );

    // Main content based on current view
    const renderMainContent = () => {
        if (currentView === 'environments') {
            return <EnvironmentPage />;
        }

        if (currentView === 'authTokens') {
            return <AuthTokensPage />;
        }

        if (currentView === 'settings') {
            return <SettingsPage />;
        }

        // Collections view (default)
        return (
            <div className="h-full overflow-y-auto bg-background">
                <div className="w-full px-6 py-6 space-y-6">
                    {/* Request Section */}
                    <RequestSection
                        method={method}
                        url={url}
                        requestBody={requestBody}
                        headers={headers}
                        loading={loading}
                        currentRequestName={currentRequestName}
                        collections={collections}
                        activeEnvironment={activeEnvironment}
                        onMethodChange={setMethod}
                        onUrlChange={setUrl}
                        onBodyChange={setRequestBody}
                        onHeadersChange={setHeaders}
                        onSend={handleSend}
                        onKeyDown={handleKeyDown}
                        onSave={handleSave}
                        onEnvironmentUpdate={refreshEnvironments}
                    />

                    {/* Response Section */}
                    <ResponseSection
                        response={response}
                        loading={loading}
                        isDarkMode={effectiveTheme === 'dark'}
                        testScript={testScript}
                        onTokensExtracted={refreshAuthTokens}
                    />

                    {/* Footer */}
                    <footer className="text-center">
                        <p className="text-xs text-muted-foreground">
                            Powered by Rust • Built with Electron + React
                        </p>
                    </footer>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
            {/* Top Header */}
            <TopHeader onSettingsClick={() => handleNavClick('settings')} />

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Navigation */}
                <LeftNav
                    activeItem={currentView as any}
                    onItemClick={handleNavClick as any}
                />

                {/* Resizable Layout with Sidebar and Main Content */}
                <div className="flex-1 overflow-hidden">
                    <ResizableLayout
                        sidebar={currentView === 'collections' ? sidebar : null}
                        mainContent={renderMainContent()}
                    />
                </div>
            </div>
        </div>
    );
}

// Main export wraps content in EnvironmentProvider
export function HomeLayout() {
    return (
        <EnvironmentProvider>
            <HomeLayoutContent />
        </EnvironmentProvider>
    );
}
