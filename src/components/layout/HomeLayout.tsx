import { useState, useEffect } from 'react';
import {
    makeSimpleRequest,
    getNativeLibraryStatus,
} from '../../services/httpClient';
import { HttpResponse } from '../../types/http';
import { AppHeader } from '../header/AppHeader';
import { RequestSection } from '../request/RequestSection';
import { ResponseSection } from '../response/ResponseSection';

export function HomeLayout() {
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState(
        'http://localhost:6000/cloths?page=1&limit=20'
    );
    const [requestBody, setRequestBody] = useState('');
    const [response, setResponse] = useState<HttpResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [libraryStatus, setLibraryStatus] = useState<{
        initialized: boolean;
        error?: string;
        libraryPath?: string;
    } | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Check native library status on mount
    useEffect(() => {
        checkLibraryStatus();
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

    const checkLibraryStatus = async () => {
        const status = await getNativeLibraryStatus();
        setLibraryStatus(status);
    };

    const handleSend = async () => {
        if (!url.trim()) return;

        setLoading(true);
        setResponse(null);

        try {
            const headers: Record<string, string> = {};
            if (requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
                headers['Content-Type'] = 'application/json';
            }

            const result = await makeSimpleRequest(
                method,
                url,
                headers,
                requestBody || undefined
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

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <AppHeader libraryStatus={libraryStatus} />

                {/* Request Section */}
                <RequestSection
                    method={method}
                    url={url}
                    requestBody={requestBody}
                    loading={loading}
                    onMethodChange={setMethod}
                    onUrlChange={setUrl}
                    onBodyChange={setRequestBody}
                    onSend={handleSend}
                    onKeyDown={handleKeyDown}
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
}
