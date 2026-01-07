import { useState, useMemo } from 'react';
import { Add01Icon, Search01Icon, FileUploadIcon } from 'hugeicons-react';
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
import { CollectionItem } from './CollectionItem';
import { RequestItem } from './RequestItem';
import { Collection, SavedRequest } from '../../types/collection';
import { saveCollection, deleteCollection } from '../../services/storage';
import { deleteEnvironmentsByCollectionId } from '../../services/environmentService';
import { importPostmanCollection } from '../../services/postmanService';

interface SidebarProps {
    collections: Collection[];
    requests: SavedRequest[];
    onRequestSelect: (request: SavedRequest) => void;
    activeRequestId?: string;
    onNewCollection?: () => void;
    onNewRequest?: () => void;
    onCollectionCreated?: () => void;
    onImportComplete?: () => void;
}

export function Sidebar({
    collections,
    requests,
    onRequestSelect,
    activeRequestId,
    onNewCollection,
    onNewRequest,
    onCollectionCreated,
    onImportComplete,
}: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
        new Set()
    );
    const [newCollectionDialogOpen, setNewCollectionDialogOpen] =
        useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    // Filter collections to only show top-level ones (not nested under other collections)
    const topLevelCollections = useMemo(() => {
        return collections.filter(
            (c) =>
                !collections.some((parent) =>
                    parent.collections?.includes(c.id)
                )
        );
    }, [collections]);

    // Filter collections and requests based on search
    const filteredCollections = useMemo(() => {
        if (!searchQuery) return topLevelCollections;
        const query = searchQuery.toLowerCase();
        return topLevelCollections.filter((c) =>
            c.name.toLowerCase().includes(query)
        );
    }, [topLevelCollections, searchQuery]);

    const filteredRequests = useMemo(() => {
        if (!searchQuery) {
            return requests.filter((r) => !r.collectionId);
        }
        const query = searchQuery.toLowerCase();
        return requests.filter(
            (r) =>
                !r.collectionId &&
                (r.name.toLowerCase().includes(query) ||
                    r.url.toLowerCase().includes(query))
        );
    }, [requests, searchQuery]);

    const toggleCollection = (collectionId: string) => {
        setExpandedCollections((prev) => {
            const next = new Set(prev);
            if (next.has(collectionId)) {
                next.delete(collectionId);
            } else {
                next.add(collectionId);
            }
            return next;
        });
    };

    const handleNewCollection = () => {
        setNewCollectionDialogOpen(true);
    };

    const handleCreateCollection = () => {
        if (newCollectionName.trim()) {
            const newCollection = saveCollection({
                name: newCollectionName.trim(),
                requests: [],
            });
            setExpandedCollections((prev) =>
                new Set(prev).add(newCollection.id)
            );
            setNewCollectionName('');
            setNewCollectionDialogOpen(false);
            onNewCollection?.();
            onCollectionCreated?.();
        }
    };

    const handleDeleteCollection = (collectionId: string) => {
        deleteCollection(collectionId);
        // Also delete any environments linked to this collection
        deleteEnvironmentsByCollectionId(collectionId);
        // Remove from expanded collections if it was expanded
        setExpandedCollections((prev) => {
            const next = new Set(prev);
            next.delete(collectionId);
            return next;
        });
        // Refresh data
        onNewCollection?.();
        onCollectionCreated?.();
        // Trigger import complete to refresh environments
        onImportComplete?.();
    };

    const handleImport = async () => {
        if (typeof window === 'undefined' || !window.ababilAPI) {
            setImportError('Not running in Electron environment');
            return;
        }

        setImporting(true);
        setImportError(null);

        try {
            // Open file picker
            const fileResult = await window.ababilAPI.selectPostmanFile();

            if (!fileResult || 'error' in fileResult) {
                if (fileResult && 'error' in fileResult) {
                    setImportError(fileResult.error);
                } else {
                    // User cancelled
                    setImporting(false);
                    return;
                }
                setImporting(false);
                return;
            }

            // Import the collection
            const result = await importPostmanCollection(fileResult.content);

            // Expand all imported collections
            result.collections.forEach((col) => {
                setExpandedCollections((prev) => new Set(prev).add(col.id));
            });

            // Show success message if environment was imported
            if (result.environment) {
                // Environment is automatically saved, just refresh
                console.log(
                    `Environment "${result.environment.name}" imported successfully`
                );
            }

            // Refresh parent (this will also refresh environments)
            onImportComplete?.();
            setImporting(false);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            setImportError(errorMessage);
            setImporting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-card">
            {/* Header */}
            <div className="p-3 border-b border-border space-y-2">
                <div className="flex gap-2">
                    <Button
                        onClick={handleNewCollection}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                    >
                        <Add01Icon className="w-4 h-4 mr-1" />
                        Collection
                    </Button>
                    <Button
                        onClick={onNewRequest}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                    >
                        <Add01Icon className="w-4 h-4 mr-1" />
                        Request
                    </Button>
                </div>
                <Button
                    onClick={handleImport}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={importing}
                >
                    {importing ? (
                        'Importing...'
                    ) : (
                        <>
                            <FileUploadIcon className="w-4 h-4 mr-1" />
                            Import Collection
                        </>
                    )}
                </Button>
                {importError && (
                    <div className="p-2 bg-destructive/10 text-destructive text-xs rounded">
                        {importError}
                    </div>
                )}
                <div className="relative">
                    <Search01Icon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="pl-8 h-8 text-sm"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Collections */}
                {filteredCollections.map((collection) => (
                    <CollectionItem
                        key={collection.id}
                        collection={collection}
                        requests={requests}
                        collections={collections}
                        isExpanded={expandedCollections.has(collection.id)}
                        expandedCollections={expandedCollections}
                        onToggle={() => toggleCollection(collection.id)}
                        onCollectionToggle={toggleCollection}
                        onRequestClick={onRequestSelect}
                        onDelete={handleDeleteCollection}
                        activeRequestId={activeRequestId}
                    />
                ))}

                {/* Requests without collection */}
                {filteredRequests.length > 0 && (
                    <div className="mt-4">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                            Requests
                        </div>
                        {filteredRequests.map((request) => (
                            <RequestItem
                                key={request.id}
                                request={request}
                                onClick={() => onRequestSelect(request)}
                                isActive={request.id === activeRequestId}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {collections.length === 0 && requests.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <p className="text-sm text-muted-foreground mb-2">
                            No collections or requests
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Create a collection or request to get started
                        </p>
                    </div>
                )}
            </div>

            {/* New Collection Dialog */}
            <Dialog
                open={newCollectionDialogOpen}
                onOpenChange={setNewCollectionDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Collection</DialogTitle>
                        <DialogDescription>
                            Enter a name for your new collection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newCollectionName}
                            onChange={(e) =>
                                setNewCollectionName(e.target.value)
                            }
                            placeholder="Collection name"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCreateCollection();
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setNewCollectionDialogOpen(false);
                                setNewCollectionName('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateCollection}
                            disabled={!newCollectionName.trim()}
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
