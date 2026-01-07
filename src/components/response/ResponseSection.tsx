import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Loading01Icon, Key01Icon } from 'hugeicons-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
    vscDarkPlus,
    oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HttpResponse } from '../../types/http';
import { getStatusText } from '../../services/httpClient';
import {
    detectLanguage,
    formatBody,
    getStatusVariant,
} from '../../utils/helpers';
import { extractTokensFromResponse } from '../../utils/tokenExtractor';
import { saveToken } from '../../services/authTokenService';

interface ResponseSectionProps {
    response: HttpResponse | null;
    loading: boolean;
    isDarkMode: boolean;
    onTokensExtracted?: () => void;
}

export function ResponseSection({
    response,
    loading,
    isDarkMode,
    onTokensExtracted,
}: ResponseSectionProps) {
    const [extractDialogOpen, setExtractDialogOpen] = useState(false);
    const [extractedTokens, setExtractedTokens] = useState<
        Array<{
            name: string;
            value: string;
            path: string;
            suggestedTokenName: string;
            selected: boolean;
            tokenName: string;
        }>
    >([]);

    // Track last processed response to avoid re-extracting
    const lastResponseRef = useRef<string | null>(null);

    // Auto-extract tokens when response changes
    useEffect(() => {
        if (
            !response ||
            !response.body ||
            response.status_code < 200 ||
            response.status_code >= 300
        ) {
            return;
        }

        // Avoid re-processing the same response
        const responseKey = `${response.status_code}-${response.body.slice(
            0,
            100
        )}`;
        if (lastResponseRef.current === responseKey) {
            return;
        }
        lastResponseRef.current = responseKey;

        const tokens = extractTokensFromResponse(response);
        if (tokens.length > 0) {
            // Auto-save all extracted tokens
            tokens.forEach((t) => {
                saveToken({
                    name: t.suggestedTokenName,
                    value: t.value,
                    source: 'extracted',
                });
            });

            // Show toast notification
            toast.success(
                `${tokens.length} token${
                    tokens.length > 1 ? 's' : ''
                } extracted`,
                {
                    description: tokens
                        .map((t) => t.suggestedTokenName)
                        .join(', '),
                }
            );

            if (onTokensExtracted) {
                onTokensExtracted();
            }
        }
    }, [response, onTokensExtracted]);

    const isJsonResponse = () => {
        if (!response || !response.body) return false;
        try {
            JSON.parse(response.body);
            return true;
        } catch {
            return false;
        }
    };

    const handleExtractTokens = () => {
        if (!response) return;
        const tokens = extractTokensFromResponse(response);
        setExtractedTokens(
            tokens.map((t) => ({
                ...t,
                selected: true,
                tokenName: t.suggestedTokenName,
            }))
        );
        setExtractDialogOpen(true);
    };

    const handleSaveExtractedTokens = () => {
        extractedTokens
            .filter((t) => t.selected && t.tokenName.trim())
            .forEach((t) => {
                saveToken({
                    name: t.tokenName.trim(),
                    value: t.value,
                    source: 'extracted',
                });
            });
        setExtractDialogOpen(false);
        setExtractedTokens([]);
        if (onTokensExtracted) {
            onTokensExtracted();
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Response</CardTitle>
                        {response && (
                            <div className="flex items-center gap-3">
                                {isJsonResponse() && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExtractTokens}
                                    >
                                        <Key01Icon className="w-4 h-4 mr-2" />
                                        Extract Tokens
                                    </Button>
                                )}
                                <Badge
                                    variant={getStatusVariant(
                                        response.status_code
                                    )}
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
                                <Loading01Icon className="w-8 h-8 animate-spin text-muted-foreground" />
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
                                        response.headers.map(
                                            ([key, value], i) => (
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
                                            )
                                        )
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

            {/* Extract Tokens Dialog */}
            <Dialog
                open={extractDialogOpen}
                onOpenChange={setExtractDialogOpen}
            >
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Extract Tokens from Response</DialogTitle>
                        <DialogDescription>
                            Select the tokens you want to save. They will be
                            available for use in your requests via{' '}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {`{{token_name}}`}
                            </code>
                            .
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {extractedTokens.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No tokens found in response
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {extractedTokens.map((token, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 border rounded-lg"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={token.selected}
                                            onChange={(e) => {
                                                const updated = [
                                                    ...extractedTokens,
                                                ];
                                                updated[index].selected =
                                                    e.target.checked;
                                                setExtractedTokens(updated);
                                            }}
                                            className="mt-1 h-4 w-4 rounded border-gray-300"
                                        />
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Token Name
                                                </label>
                                                <Input
                                                    value={token.tokenName}
                                                    onChange={(e) => {
                                                        const updated = [
                                                            ...extractedTokens,
                                                        ];
                                                        updated[
                                                            index
                                                        ].tokenName =
                                                            e.target.value;
                                                        setExtractedTokens(
                                                            updated
                                                        );
                                                    }}
                                                    placeholder="token_name"
                                                    disabled={!token.selected}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Path
                                                </label>
                                                <code className="text-xs bg-muted px-2 py-1 rounded block">
                                                    {token.path}
                                                </code>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Value
                                                </label>
                                                <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                                                    {token.value.length > 50
                                                        ? `${token.value.slice(
                                                              0,
                                                              50
                                                          )}...`
                                                        : token.value}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setExtractDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveExtractedTokens}
                            disabled={
                                extractedTokens.filter(
                                    (t) => t.selected && t.tokenName.trim()
                                ).length === 0
                            }
                        >
                            Save Selected Tokens
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
