import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import {
    Loading01Icon,
    MailSend01Icon,
    SaveEnergy01Icon,
} from 'hugeicons-react';
import { HTTP_METHODS } from '../../utils/constants';
import { getMethodColor } from '../../utils/helpers';
import { Collection } from '../../types/collection';
import { Environment } from '../../types/environment';
import { RequestHeader, RequestAuth } from '../../types/http';
import { VariableUrlInput } from './VariableUrlInput';
import { VariableTextarea } from './VariableTextarea';
import { HeadersTable } from './HeadersTable';

interface RequestSectionProps {
    method: string;
    url: string;
    requestBody: string;
    headers: RequestHeader[];
    loading: boolean;
    currentRequestName?: string;
    collections: Collection[];
    activeEnvironment?: Environment | null;
    requestAuth?: RequestAuth;
    onMethodChange: (method: string) => void;
    onUrlChange: (url: string) => void;
    onBodyChange: (body: string) => void;
    onHeadersChange: (headers: RequestHeader[]) => void;
    onAuthChange?: (auth: RequestAuth | undefined) => void;
    onSend: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onSave?: (name: string, collectionId?: string) => void;
    onEnvironmentUpdate?: () => void;
}

export function RequestSection({
    method,
    url,
    requestBody,
    headers,
    loading,
    currentRequestName,
    collections,
    activeEnvironment,
    requestAuth,
    onMethodChange,
    onUrlChange,
    onBodyChange,
    onHeadersChange,
    onAuthChange,
    onSend,
    onKeyDown,
    onSave,
    onEnvironmentUpdate,
}: RequestSectionProps) {
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [saveName, setSaveName] = useState(currentRequestName || '');
    const [selectedCollectionId, setSelectedCollectionId] =
        useState<string>('');

    const handleSave = () => {
        if (saveName.trim() && onSave) {
            onSave(saveName.trim(), selectedCollectionId || undefined);
            setSaveDialogOpen(false);
            setSaveName('');
            setSelectedCollectionId('');
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            {currentRequestName || 'Request'}
                        </CardTitle>
                        {onSave && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSaveName(currentRequestName || '');
                                    setSaveDialogOpen(true);
                                }}
                            >
                                <SaveEnergy01Icon className="w-4 h-4 mr-1" />
                                Save
                            </Button>
                        )}
                    </div>
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

                        <VariableUrlInput
                            value={url}
                            onChange={onUrlChange}
                            onKeyDown={onKeyDown}
                            placeholder="Enter request URL..."
                            activeEnvironment={activeEnvironment || null}
                            onEnvironmentUpdate={onEnvironmentUpdate}
                        />

                        <Button
                            onClick={onSend}
                            disabled={loading || !url.trim()}
                        >
                            {loading ? (
                                <Loading01Icon className="w-4 h-4 animate-spin" />
                            ) : (
                                <MailSend01Icon className="w-4 h-4" />
                            )}
                            Send
                        </Button>
                    </div>

                    {/* Postman-style Tabs: Params, Auth, Headers, Body */}
                    <Tabs defaultValue="headers" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="params">Params</TabsTrigger>
                            <TabsTrigger value="auth">Auth</TabsTrigger>
                            <TabsTrigger value="headers">
                                Headers{' '}
                                {headers.filter((h) => h.key.trim()).length >
                                    0 &&
                                    `(${
                                        headers.filter((h) => h.key.trim())
                                            .length
                                    })`}
                            </TabsTrigger>
                            <TabsTrigger value="body">Body</TabsTrigger>
                        </TabsList>

                        {/* Params Tab */}
                        <TabsContent value="params" className="mt-4">
                            <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-md">
                                Query parameters are extracted from the URL
                                automatically.
                                <br />
                                Add them directly to the URL:{' '}
                                <code className="bg-muted px-1 rounded">
                                    ?key=value
                                </code>
                            </div>
                        </TabsContent>

                        {/* Auth Tab */}
                        <TabsContent value="auth" className="mt-4">
                            <div className="grid grid-cols-[200px_1fr] gap-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">
                                        Auth Type
                                    </label>
                                    <Select
                                        value={requestAuth?.type || 'inherit'}
                                        onValueChange={(value) => {
                                            if (!onAuthChange) return;
                                            if (value === 'inherit') {
                                                onAuthChange(undefined);
                                            } else if (value === 'noauth') {
                                                onAuthChange({
                                                    type: 'noauth',
                                                });
                                            } else if (value === 'bearer') {
                                                onAuthChange({
                                                    type: 'bearer',
                                                    bearer: [
                                                        {
                                                            key: 'token',
                                                            value: '',
                                                            type: 'string',
                                                        },
                                                    ],
                                                });
                                            } else if (value === 'basic') {
                                                onAuthChange({
                                                    type: 'basic',
                                                    basic: [
                                                        {
                                                            key: 'username',
                                                            value: '',
                                                            type: 'string',
                                                        },
                                                        {
                                                            key: 'password',
                                                            value: '',
                                                            type: 'string',
                                                        },
                                                    ],
                                                });
                                            } else if (value === 'apikey') {
                                                onAuthChange({
                                                    type: 'apikey',
                                                    apikey: [
                                                        {
                                                            key: 'key',
                                                            value: 'api_key',
                                                            type: 'string',
                                                        },
                                                        {
                                                            key: 'value',
                                                            value: '',
                                                            type: 'string',
                                                        },
                                                    ],
                                                });
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select auth type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inherit">
                                                Inherit from parent
                                            </SelectItem>
                                            <SelectItem value="noauth">
                                                No Auth
                                            </SelectItem>
                                            <SelectItem value="bearer">
                                                Bearer Token
                                            </SelectItem>
                                            <SelectItem value="basic">
                                                Basic Auth
                                            </SelectItem>
                                            <SelectItem value="apikey">
                                                API Key
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        The authorization header will be
                                        automatically generated when you send
                                        the request.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    {/* Bearer Token Input */}
                                    {requestAuth?.type === 'bearer' && (
                                        <>
                                            <label className="text-sm font-medium">
                                                Token
                                            </label>
                                            <Input
                                                value={
                                                    requestAuth.bearer?.find(
                                                        (v) => v.key === 'token'
                                                    )?.value || ''
                                                }
                                                onChange={(e) => {
                                                    if (!onAuthChange) return;
                                                    onAuthChange({
                                                        ...requestAuth,
                                                        bearer: [
                                                            {
                                                                key: 'token',
                                                                value: e.target
                                                                    .value,
                                                                type: 'string',
                                                            },
                                                        ],
                                                    });
                                                }}
                                                placeholder="{{user_token}}"
                                                className="font-mono"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Use variables like{' '}
                                                <code className="bg-muted px-1 rounded">{`{{token_name}}`}</code>{' '}
                                                to reference extracted tokens.
                                            </p>
                                        </>
                                    )}

                                    {/* Basic Auth Inputs */}
                                    {requestAuth?.type === 'basic' && (
                                        <>
                                            <label className="text-sm font-medium">
                                                Username
                                            </label>
                                            <Input
                                                value={
                                                    requestAuth.basic?.find(
                                                        (v) =>
                                                            v.key === 'username'
                                                    )?.value || ''
                                                }
                                                onChange={(e) => {
                                                    if (!onAuthChange) return;
                                                    const password =
                                                        requestAuth.basic?.find(
                                                            (v) =>
                                                                v.key ===
                                                                'password'
                                                        )?.value || '';
                                                    onAuthChange({
                                                        ...requestAuth,
                                                        basic: [
                                                            {
                                                                key: 'username',
                                                                value: e.target
                                                                    .value,
                                                                type: 'string',
                                                            },
                                                            {
                                                                key: 'password',
                                                                value: password,
                                                                type: 'string',
                                                            },
                                                        ],
                                                    });
                                                }}
                                                placeholder="Username"
                                                className="font-mono"
                                            />
                                            <label className="text-sm font-medium mt-2">
                                                Password
                                            </label>
                                            <Input
                                                type="password"
                                                value={
                                                    requestAuth.basic?.find(
                                                        (v) =>
                                                            v.key === 'password'
                                                    )?.value || ''
                                                }
                                                onChange={(e) => {
                                                    if (!onAuthChange) return;
                                                    const username =
                                                        requestAuth.basic?.find(
                                                            (v) =>
                                                                v.key ===
                                                                'username'
                                                        )?.value || '';
                                                    onAuthChange({
                                                        ...requestAuth,
                                                        basic: [
                                                            {
                                                                key: 'username',
                                                                value: username,
                                                                type: 'string',
                                                            },
                                                            {
                                                                key: 'password',
                                                                value: e.target
                                                                    .value,
                                                                type: 'string',
                                                            },
                                                        ],
                                                    });
                                                }}
                                                placeholder="Password"
                                                className="font-mono"
                                            />
                                        </>
                                    )}

                                    {/* API Key Inputs */}
                                    {requestAuth?.type === 'apikey' && (
                                        <>
                                            <label className="text-sm font-medium">
                                                Key
                                            </label>
                                            <Input
                                                value={
                                                    requestAuth.apikey?.find(
                                                        (v) => v.key === 'key'
                                                    )?.value || 'api_key'
                                                }
                                                onChange={(e) => {
                                                    if (!onAuthChange) return;
                                                    const apiValue =
                                                        requestAuth.apikey?.find(
                                                            (v) =>
                                                                v.key ===
                                                                'value'
                                                        )?.value || '';
                                                    onAuthChange({
                                                        ...requestAuth,
                                                        apikey: [
                                                            {
                                                                key: 'key',
                                                                value: e.target
                                                                    .value,
                                                                type: 'string',
                                                            },
                                                            {
                                                                key: 'value',
                                                                value: apiValue,
                                                                type: 'string',
                                                            },
                                                        ],
                                                    });
                                                }}
                                                placeholder="api_key"
                                                className="font-mono"
                                            />
                                            <label className="text-sm font-medium mt-2">
                                                Value
                                            </label>
                                            <Input
                                                value={
                                                    requestAuth.apikey?.find(
                                                        (v) => v.key === 'value'
                                                    )?.value || ''
                                                }
                                                onChange={(e) => {
                                                    if (!onAuthChange) return;
                                                    const keyName =
                                                        requestAuth.apikey?.find(
                                                            (v) =>
                                                                v.key === 'key'
                                                        )?.value || 'api_key';
                                                    onAuthChange({
                                                        ...requestAuth,
                                                        apikey: [
                                                            {
                                                                key: 'key',
                                                                value: keyName,
                                                                type: 'string',
                                                            },
                                                            {
                                                                key: 'value',
                                                                value: e.target
                                                                    .value,
                                                                type: 'string',
                                                            },
                                                        ],
                                                    });
                                                }}
                                                placeholder="{{api_key}}"
                                                className="font-mono"
                                            />
                                        </>
                                    )}

                                    {/* No Auth / Inherit messages */}
                                    {requestAuth?.type === 'noauth' && (
                                        <p className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
                                            This request does not use any
                                            authorization.
                                        </p>
                                    )}

                                    {!requestAuth?.type && (
                                        <p className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
                                            Authorization will be inherited from
                                            the parent collection.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Headers Tab */}
                        <TabsContent value="headers" className="mt-4">
                            <HeadersTable
                                headers={headers}
                                onChange={onHeadersChange}
                            />
                        </TabsContent>

                        {/* Body Tab */}
                        <TabsContent value="body" className="mt-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium">
                                        Body Type:
                                    </label>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-primary/10"
                                        >
                                            none
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            form-data
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            x-www-form-urlencoded
                                        </Button>
                                        <Button variant="default" size="sm">
                                            raw
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            binary
                                        </Button>
                                    </div>
                                    <Select defaultValue="json">
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="json">
                                                JSON
                                            </SelectItem>
                                            <SelectItem value="text">
                                                Text
                                            </SelectItem>
                                            <SelectItem value="xml">
                                                XML
                                            </SelectItem>
                                            <SelectItem value="html">
                                                HTML
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <VariableTextarea
                                    value={requestBody}
                                    onChange={onBodyChange}
                                    placeholder='{"key": "value"}'
                                    rows={10}
                                    activeEnvironment={
                                        activeEnvironment || null
                                    }
                                    onEnvironmentUpdate={onEnvironmentUpdate}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Save Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Request</DialogTitle>
                        <DialogDescription>
                            Save this request to your collection for easy access
                            later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Request Name
                            </label>
                            <Input
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                placeholder="My API Request"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Collection (Optional)
                            </label>
                            <Select
                                value={selectedCollectionId}
                                onValueChange={setSelectedCollectionId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="No collection" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        No collection
                                    </SelectItem>
                                    {collections.map((collection) => (
                                        <SelectItem
                                            key={collection.id}
                                            value={collection.id}
                                        >
                                            {collection.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSaveDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!saveName.trim()}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
