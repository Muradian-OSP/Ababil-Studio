import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
    vscDarkPlus,
    oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HttpResponse } from '../../types/http';
import { getStatusText } from '../../services/httpClient';
import { detectLanguage, formatBody, getStatusVariant } from '../../utils/helpers';

interface ResponseSectionProps {
    response: HttpResponse | null;
    loading: boolean;
    isDarkMode: boolean;
}

export function ResponseSection({
    response,
    loading,
    isDarkMode,
}: ResponseSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Response</CardTitle>
                    {response && (
                        <div className="flex items-center gap-3">
                            <Badge
                                variant={getStatusVariant(response.status_code)}
                            >
                                {response.status_code}{' '}
                                {getStatusText(response.status_code)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {response.duration_ms}ms
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Executing request...
                            </span>
                        </div>
                    </div>
                ) : response ? (
                    <Tabs defaultValue="body" className="w-full">
                        <TabsList>
                            <TabsTrigger value="body">Body</TabsTrigger>
                            <TabsTrigger value="headers">
                                Headers ({response.headers.length})
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="body">
                            <div className="mt-4 rounded-lg max-h-[400px] overflow-auto border border-border">
                                <SyntaxHighlighter
                                    language={detectLanguage(response.body)}
                                    style={
                                        isDarkMode ? vscDarkPlus : oneLight
                                    }
                                    customStyle={{
                                        margin: 0,
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        background: '#000000',
                                        fontSize: '0.875rem',
                                    }}
                                    codeTagProps={{
                                        style: {
                                            fontFamily:
                                                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                        },
                                    }}
                                >
                                    {formatBody(response.body)}
                                </SyntaxHighlighter>
                            </div>
                        </TabsContent>
                        <TabsContent value="headers">
                            <div className="mt-4 p-4 bg-muted rounded-lg max-h-[400px] overflow-auto space-y-2">
                                {response.headers.length > 0 ? (
                                    response.headers.map(([key, value], i) => (
                                        <div
                                            key={i}
                                            className="flex gap-2 text-sm font-mono"
                                        >
                                            <span className="font-semibold text-primary">
                                                {key}:
                                            </span>
                                            <span className="text-muted-foreground break-all">
                                                {value}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No headers
                                    </p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="flex items-center justify-center h-[300px]">
                        <div className="text-center space-y-2">
                            <div className="text-4xl">🚀</div>
                            <p className="text-muted-foreground">
                                Enter a URL and click Send to make a request
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Press{' '}
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                    ⌘
                                </kbd>{' '}
                                +{' '}
                                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                    Enter
                                </kbd>{' '}
                                to send
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

