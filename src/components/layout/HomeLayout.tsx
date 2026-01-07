import { useState, useEffect } from 'react';
import { makeHttpRequest } from '../../services/httpClient';
import { HttpResponse, HttpRequest } from '../../types/http';
import {
    SavedRequest,
    Collection,
    httpRequestToSavedRequest,
} from '../../types/collection';

import { AuthToken } from '../../types/auth';
import {
    saveRequest,
    loadRequests,
    loadCollections,
} from '../../services/storage';
import { loadTokens } from '../../services/authTokenService';
import {
    replaceVariablesInUrl,
    replaceVariablesInBody,
    replaceVariablesInHeaders,
    replaceVariablesInAuth,
} from '../../utils/variableReplacer';

import { useTheme } from '../../contexts/ThemeContext';
import {
    EnvironmentProvider,
    useEnvironment,
} from '../../contexts/EnvironmentContext';
import { TabProvider, useTabContext } from '../../contexts/TabContext';
import { TopHeader } from '../header/TopHeader';
import { LeftNav } from '../navigation/LeftNav';
import { RequestSection } from '../request/RequestSection';
import { ResponseSection } from '../response/ResponseSection';
import { Sidebar } from '../sidebar/Sidebar';
import { EnvironmentPage } from '../environment/EnvironmentPage';
import { SettingsPage } from '../settings/SettingsPage';
import { AuthTokensPage } from '../auth/AuthTokensPage';
import { ResizableLayout } from './ResizableLayout';
import { RequestTabsBar } from '../tabs/RequestTabsBar';

type ViewType = 'collections' | 'environments' | 'authTokens' | 'settings';

// Inner component that uses the environment context and tab context
function HomeLayoutContent() {
    const { effectiveTheme } = useTheme();
    const { activeEnvironment, refreshEnvironments } = useEnvironment();
    const {
        activeTab,
        openNewTab,
        openRequestInTab,
        setMethod,
        setUrl,
        setBody,
        setHeaders,
        setAuth,
        setResponse,
        markAsSaved,
    } = useTabContext();

    const [currentView, setCurrentView] = useState<ViewType>('collections');
    const [loading, setLoading] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [requests, setRequests] = useState<SavedRequest[]>([]);
    // Auth tokens are in-memory only (cleared on app restart like Postman)
    const [authTokens, setAuthTokens] = useState<AuthToken[]>([]);

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
        if (!activeTab || !activeTab.url.trim()) return;

        setLoading(true);
        setResponse(null);

        try {
            // Replace variables before sending (including auth tokens)
            const resolvedUrl = replaceVariablesInUrl(
                activeTab.url,
                activeEnvironment,
                authTokens
            );
            const resolvedBody = replaceVariablesInBody(
                activeTab.body,
                activeEnvironment,
                authTokens
            );
            // Convert headers array to Record, filtering out disabled and empty headers
            const headersRecord: Record<string, string> = {};
            activeTab.headers
                .filter((h) => !h.disabled && h.key.trim())
                .forEach((h) => {
                    headersRecord[h.key] = h.value;
                });

            // Automatically apply auth tokens if no Authorization header exists
            // This mimics Postman's behavior where extracted tokens are auto-applied
            if (
                !headersRecord['Authorization'] &&
                !headersRecord['authorization'] &&
                !activeTab.auth
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
            if (
                resolvedBody &&
                ['POST', 'PUT', 'PATCH'].includes(activeTab.method)
            ) {
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
            const resolvedAuth = activeTab.auth
                ? replaceVariablesInAuth(
                      activeTab.auth,
                      activeEnvironment,
                      authTokens
                  )
                : undefined;

            // Build full HttpRequest with auth
            const request: HttpRequest = {
                method: activeTab.method,
                url: { raw: resolvedUrl },
                header: Object.entries(resolvedHeaders).map(([key, value]) => ({
                    key,
                    value,
                })),
                body: resolvedBody
                    ? { mode: 'raw', raw: resolvedBody }
                    : undefined,
                auth: resolvedAuth,
                testScript: activeTab.testScript,
            };

            const result = await makeHttpRequest(request);
            setResponse({
                status_code: result.status_code,
                headers: result.headers.map(([key, value]) => ({ key, value })),
                body: result.body,
                duration_ms: result.duration_ms,
            });
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
        // Open request in tab (or focus if already open)
        openRequestInTab(request);
    };

    const handleSave = (name: string, collectionId?: string) => {
        if (!activeTab) return;

        // Convert headers array to Record for saving
        const headersRecord: Record<string, string> = {};
        activeTab.headers
            .filter((h) => !h.disabled && h.key.trim())
            .forEach((h) => {
                headersRecord[h.key] = h.value;
            });

        const request: HttpRequest = {
            method: activeTab.method,
            url: { raw: activeTab.url },
            header: Object.entries(headersRecord).map(([key, value]) => ({
                key,
                value,
            })),
            body: activeTab.body
                ? { mode: 'raw', raw: activeTab.body }
                : undefined,
            auth: activeTab.auth,
            testScript: activeTab.testScript,
        };
        const savedRequestData = httpRequestToSavedRequest(
            request,
            name,
            collectionId
        );
        const saved = saveRequest(savedRequestData);
        markAsSaved(saved.id, saved.name);
        refreshData();
    };

    const handleNewRequest = () => {
        openNewTab();
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
            activeRequestId={activeTab?.savedRequestId}
            onNewCollection={refreshData}
            onNewRequest={handleNewRequest}
            onCollectionCreated={refreshData}
            onImportComplete={() => {
                refreshData();
                refreshEnvironments();
            }}
        />
    );

    // Convert tab response format to HttpResponse format for ResponseSection
    const httpResponse: HttpResponse | null = activeTab?.response
        ? {
              status_code: activeTab.response.status_code,
              headers: activeTab.response.headers.map(
                  (h) => [h.key, h.value] as [string, string]
              ),
              body: activeTab.response.body,
              duration_ms: activeTab.response.duration_ms,
          }
        : null;

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
            <div className="h-full flex flex-col bg-background">
                {/* Request Tabs Bar */}
                <RequestTabsBar />

                <div className="flex-1 overflow-y-auto">
                    <div className="w-full px-6 py-6 space-y-6">
                        {/* Request Section */}
                        {activeTab && (
                            <RequestSection
                                method={activeTab.method}
                                url={activeTab.url}
                                requestBody={activeTab.body}
                                headers={activeTab.headers}
                                loading={loading}
                                currentRequestName={activeTab.name}
                                collections={collections}
                                activeEnvironment={activeEnvironment}
                                requestAuth={activeTab.auth}
                                onMethodChange={setMethod}
                                onUrlChange={setUrl}
                                onBodyChange={setBody}
                                onHeadersChange={setHeaders}
                                onAuthChange={setAuth}
                                onSend={handleSend}
                                onKeyDown={handleKeyDown}
                                onSave={handleSave}
                                onEnvironmentUpdate={refreshEnvironments}
                            />
                        )}

                        {/* Response Section */}
                        <ResponseSection
                            response={httpResponse}
                            loading={loading}
                            isDarkMode={effectiveTheme === 'dark'}
                            testScript={activeTab?.testScript}
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

// Main export wraps content in providers
export function HomeLayout() {
    return (
        <EnvironmentProvider>
            <TabProvider>
                <HomeLayoutContent />
            </TabProvider>
        </EnvironmentProvider>
    );
}
