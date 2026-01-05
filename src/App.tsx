import React, { useState, useEffect } from 'react';
import {
    makeSimpleRequest,
    getNativeLibraryStatus,
    getStatusText,
} from './services/httpClient';
import { HttpResponse } from './types/http';
import './types/electron.d.ts';

// HTTP Methods with their colors
const HTTP_METHODS = [
    { value: 'GET', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { value: 'POST', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { value: 'PUT', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { value: 'PATCH', color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { value: 'DELETE', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { value: 'HEAD', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { value: 'OPTIONS', color: 'text-slate-400', bg: 'bg-slate-500/10' },
];

function App() {
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState(
        'https://jsonplaceholder.typicode.com/posts/1'
    );
    const [requestBody, setRequestBody] = useState('');
    const [response, setResponse] = useState<HttpResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [libraryStatus, setLibraryStatus] = useState<{
        initialized: boolean;
        error?: string;
        libraryPath?: string;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

    // Check native library status on mount
    useEffect(() => {
        checkLibraryStatus();
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
        } catch (error: any) {
            setResponse({
                status_code: 0,
                headers: [],
                body: `Error: ${error.message}`,
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

    const getMethodStyle = (m: string) => {
        return HTTP_METHODS.find((h) => h.value === m) || HTTP_METHODS[0];
    };

    const formatBody = (body: string): string => {
        try {
            return JSON.stringify(JSON.parse(body), null, 2);
        } catch {
            return body;
        }
    };

    const getStatusColor = (code: number): string => {
        if (code === 0) return 'text-rose-400';
        if (code >= 200 && code < 300) return 'text-emerald-400';
        if (code >= 300 && code < 400) return 'text-amber-400';
        if (code >= 400 && code < 500) return 'text-orange-400';
        return 'text-rose-400';
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-mono">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-emerald-950/20 pointer-events-none" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 p-6 max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent">
                        আবাবিল স্টুডিও
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Rust-powered API Testing Platform
                    </p>

                    {/* Library Status */}
                    <div className="mt-3 flex items-center gap-2">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                libraryStatus?.initialized
                                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                                    : 'bg-rose-400 shadow-lg shadow-rose-400/50'
                            }`}
                        />
                        <span className="text-xs text-slate-500">
                            {libraryStatus?.initialized
                                ? 'Rust Core Connected'
                                : libraryStatus?.error || 'Connecting...'}
                        </span>
                    </div>
                </header>

                {/* Request Bar */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4 mb-6">
                    <div className="flex gap-3">
                        {/* Method Dropdown */}
                        <div className="relative">
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className={`appearance-none px-4 py-3 pr-10 rounded-lg bg-slate-800/50 border border-slate-700/50 
                                    font-bold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/50
                                    ${getMethodStyle(method).color} ${
                                    getMethodStyle(method).bg
                                }`}
                            >
                                {HTTP_METHODS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.value}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg
                                    className="w-4 h-4 text-slate-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* URL Input */}
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter request URL..."
                            className="flex-1 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 
                                text-slate-100 placeholder-slate-500 text-sm
                                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                        />

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={loading || !url.trim()}
                            className="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 
                                text-white font-semibold text-sm
                                hover:from-violet-500 hover:to-fuchsia-500 
                                disabled:opacity-50 disabled:cursor-not-allowed
                                focus:outline-none focus:ring-2 focus:ring-violet-500/50
                                transition-all duration-200 shadow-lg shadow-violet-500/25"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    <span>Sending...</span>
                                </div>
                            ) : (
                                <span>Send</span>
                            )}
                        </button>
                    </div>

                    {/* Request Body (for POST/PUT/PATCH) */}
                    {['POST', 'PUT', 'PATCH'].includes(method) && (
                        <div className="mt-4">
                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
                                Request Body (JSON)
                            </label>
                            <textarea
                                value={requestBody}
                                onChange={(e) => setRequestBody(e.target.value)}
                                placeholder='{"key": "value"}'
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 
                                    text-slate-100 placeholder-slate-600 text-sm font-mono
                                    focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent
                                    resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Response Section */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden">
                    {/* Response Header */}
                    <div className="px-4 py-3 border-b border-slate-800/50 flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">
                            Response
                        </span>
                        {response && (
                            <div className="flex items-center gap-4">
                                <span
                                    className={`text-sm font-bold ${getStatusColor(
                                        response.status_code
                                    )}`}
                                >
                                    {response.status_code}{' '}
                                    {getStatusText(response.status_code)}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {response.duration_ms}ms
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    {response && (
                        <div className="px-4 border-b border-slate-800/50 flex gap-1">
                            <button
                                onClick={() => setActiveTab('body')}
                                className={`px-4 py-2 text-xs font-medium transition-colors relative
                                    ${
                                        activeTab === 'body'
                                            ? 'text-violet-400'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                Body
                                {activeTab === 'body' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('headers')}
                                className={`px-4 py-2 text-xs font-medium transition-colors relative
                                    ${
                                        activeTab === 'headers'
                                            ? 'text-violet-400'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                Headers ({response.headers.length})
                                {activeTab === 'headers' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400" />
                                )}
                            </button>
                        </div>
                    )}

                    {/* Response Content */}
                    <div className="p-4 min-h-[300px] max-h-[500px] overflow-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                    <span className="text-sm text-slate-500">
                                        Executing request...
                                    </span>
                                </div>
                            </div>
                        ) : response ? (
                            activeTab === 'body' ? (
                                <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words">
                                    {formatBody(response.body)}
                                </pre>
                            ) : (
                                <div className="space-y-2">
                                    {response.headers.map(([key, value], i) => (
                                        <div
                                            key={i}
                                            className="flex gap-2 text-sm"
                                        >
                                            <span className="text-violet-400 font-medium">
                                                {key}:
                                            </span>
                                            <span className="text-slate-400 break-all">
                                                {value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="flex items-center justify-center h-[300px]">
                                <div className="text-center">
                                    <div className="text-4xl mb-3">🚀</div>
                                    <p className="text-slate-500 text-sm">
                                        Enter a URL and click Send to make a
                                        request
                                    </p>
                                    <p className="text-slate-600 text-xs mt-2">
                                        Press{' '}
                                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                                            ⌘
                                        </kbd>{' '}
                                        +{' '}
                                        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                                            Enter
                                        </kbd>{' '}
                                        to send
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-6 text-center">
                    <p className="text-xs text-slate-600">
                        Powered by Rust • Built with Electron + React
                    </p>
                </footer>
            </div>
        </div>
    );
}

export default App;
