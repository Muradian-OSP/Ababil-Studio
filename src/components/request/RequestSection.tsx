import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { Loader2, Send } from 'lucide-react';
import { HTTP_METHODS } from '../../utils/constants';
import { getMethodColor } from '../../utils/helpers';

interface RequestSectionProps {
    method: string;
    url: string;
    requestBody: string;
    loading: boolean;
    onMethodChange: (method: string) => void;
    onUrlChange: (url: string) => void;
    onBodyChange: (body: string) => void;
    onSend: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

export function RequestSection({
    method,
    url,
    requestBody,
    loading,
    onMethodChange,
    onUrlChange,
    onBodyChange,
    onSend,
    onKeyDown,
}: RequestSectionProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* URL Bar */}
                <div className="flex gap-2">
                    <Select value={method} onValueChange={onMethodChange}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue>
                                <span
                                    className={`font-semibold ${getMethodColor(
                                        method
                                    )}`}
                                >
                                    {method}
                                </span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {HTTP_METHODS.map((m) => (
                                <SelectItem key={m} value={m}>
                                    <span
                                        className={`font-semibold ${getMethodColor(
                                            m
                                        )}`}
                                    >
                                        {m}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        value={url}
                        onChange={(e) => onUrlChange(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Enter request URL..."
                        className="flex-1 font-mono text-sm"
                    />

                    <Button onClick={onSend} disabled={loading || !url.trim()}>
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Send
                    </Button>
                </div>

                {/* Request Body */}
                {['POST', 'PUT', 'PATCH'].includes(method) && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Request Body (JSON)
                        </label>
                        <Textarea
                            value={requestBody}
                            onChange={(e) => onBodyChange(e.target.value)}
                            placeholder='{"key": "value"}'
                            rows={4}
                            className="font-mono text-sm resize-none"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
