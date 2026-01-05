import { useState, useEffect } from 'react';
import { makeSimpleRequest } from '../../services/httpClient';
import { HttpResponse } from '../../types/http';
import {
    SavedRequest,
    Collection,
    httpRequestToSavedRequest,
} from '../../types/collection';
import { Environment } from '../../types/environment';
import {
    saveRequest,
    loadRequests,
    loadCollections,
} from '../../services/storage';
import {
    loadEnvironments,
    getActiveEnvironment,
    setActiveEnvironment,
} from '../../services/environmentService';
import {
    replaceVariablesInUrl,
    replaceVariablesInBody,
    replaceVariablesInHeaders,
} from '../../utils/variableReplacer';
import { TopHeader } from '../header/TopHeader';
import { LeftNav } from '../navigation/LeftNav';
import { RequestSection } from '../request/RequestSection';
import { ResponseSection } from '../response/ResponseSection';
import { Sidebar } from '../sidebar/Sidebar';
import { EnvironmentPage } from '../environment/EnvironmentPage';
import { ResizableLayout } from './ResizableLayout';
import { createSimpleRequest } from '../../types/http';

type ViewType = 'collections' | 'environments' | 'settings';

export function HomeLayout() {
    const [currentView, setCurrentView] = useState<ViewType>('collections');
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState(
        'http://localhost:6000/cloths?page=1&limit=20'
    );
    const [requestBody, setRequestBody] = useState('');
    const [response, setResponse] = useState<HttpResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [requests, setRequests] = useState<SavedRequest[]>([]);
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [activeEnvironment, setActiveEnvironmentState] =
        useState<Environment | null>(null);
    const [activeRequestId, setActiveRequestId] = useState<
        string | undefined
    >();
    const [currentRequestName, setCurrentRequestName] = useState<string>('');

    // Load data on mount
    useEffect(() => {
        refreshData();
        refreshEnvironments();
    }, []);

    // Detect dark mode
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) =>
            setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const refreshData = () => {
        setCollections(loadCollections());
        setRequests(loadRequests());
    };

    const refreshEnvironments = () => {
        const envs = loadEnvironments();
        setEnvironments(envs);
        setActiveEnvironmentState(getActiveEnvironment());
    };

    const handleEnvironmentChange = (environmentId: string) => {
        if (environmentId) {
            setActiveEnvironment(environmentId);
            refreshEnvironments();
        } else {
            // Clear active environment
            localStorage.removeItem('ababil_active_environment');
            refreshEnvironments();
        }
    };

    const handleSend = async () => {
        if (!url.trim()) return;

        setLoading(true);
        setResponse(null);

        try {
            // Replace variables before sending
            const resolvedUrl = replaceVariablesInUrl(url, activeEnvironment);
            const resolvedBody = replaceVariablesInBody(
                requestBody,
                activeEnvironment
            );
            const headers: Record<string, string> = {};
            if (resolvedBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
                headers['Content-Type'] = 'application/json';
            }
            const resolvedHeaders = replaceVariablesInHeaders(
                headers,
                activeEnvironment
            );

            const result = await makeSimpleRequest(
                method,
                resolvedUrl,
                resolvedHeaders,
                resolvedBody || undefined
            );
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
        setResponse(null);
    };

    const handleSave = (name: string, collectionId?: string) => {
        const request = createSimpleRequest(
            method,
            url,
            {},
            requestBody || undefined
        );
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
            onImportComplete={refreshData}
        />
    );

    // Main content based on current view
    const renderMainContent = () => {
        if (currentView === 'environments') {
            return <EnvironmentPage />;
        }

        if (currentView === 'settings') {
            return (
                <div className="h-full overflow-y-auto bg-background p-6">
                    <div className="max-w-5xl mx-auto">
                        <h1 className="text-2xl font-bold mb-4">Settings</h1>
                        <p className="text-muted-foreground">
                            Settings page coming soon.
                        </p>
                    </div>
                </div>
            );
        }

        // Collections view (default)
        return (
            <div className="h-full overflow-y-auto bg-background p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Request Section */}
                    <RequestSection
                        method={method}
                        url={url}
                        requestBody={requestBody}
                        loading={loading}
                        currentRequestName={currentRequestName}
                        collections={collections}
                        activeEnvironment={activeEnvironment}
                        onMethodChange={setMethod}
                        onUrlChange={setUrl}
                        onBodyChange={setRequestBody}
                        onSend={handleSend}
                        onKeyDown={handleKeyDown}
                        onSave={handleSave}
                        onEnvironmentUpdate={refreshEnvironments}
                    />

                    {/* Response Section */}
                    <ResponseSection
                        response={response}
                        loading={loading}
                        isDarkMode={isDarkMode}
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
            <TopHeader
                activeEnvironment={activeEnvironment}
                environments={environments}
                onEnvironmentChange={handleEnvironmentChange}
                onSettingsClick={() => handleNavClick('settings')}
            />

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Navigation */}
                <LeftNav
                    activeItem={currentView}
                    onItemClick={handleNavClick}
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
