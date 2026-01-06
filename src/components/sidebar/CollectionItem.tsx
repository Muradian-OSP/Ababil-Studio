import { useState } from 'react';
import {
    Folder01Icon,
    Folder02Icon,
    ArrowRight01Icon,
    ArrowDown01Icon,
    Delete01Icon,
} from 'hugeicons-react';
import { Collection } from '../../types/collection';
import { RequestItem } from './RequestItem';
import { SavedRequest } from '../../types/collection';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

interface CollectionItemProps {
    collection: Collection;
    requests: SavedRequest[];
    collections: Collection[]; // All collections for nested rendering
    isExpanded: boolean;
    expandedCollections: Set<string>;
    onToggle: () => void;
    onCollectionToggle: (collectionId: string) => void;
    onRequestClick: (request: SavedRequest) => void;
    onDelete?: (collectionId: string) => void;
    activeRequestId?: string;
}

export function CollectionItem({
    collection,
    requests,
    collections,
    isExpanded,
    expandedCollections,
    onToggle,
    onCollectionToggle,
    onRequestClick,
    onDelete,
    activeRequestId,
}: CollectionItemProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const collectionRequests = requests.filter(
        (r) => r.collectionId === collection.id
    );

    // Get child collections (nested collections)
    const childCollections = collections.filter(
        (c) => collection.collections?.includes(c.id)
    );

    const totalItems = collectionRequests.length + childCollections.length;

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (onDelete) {
            onDelete(collection.id);
        }
        setDeleteDialogOpen(false);
    };

    return (
        <div className="select-none">
            <div
                onClick={onToggle}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer rounded-sm group"
            >
                {isExpanded ? (
                    <ArrowDown01Icon className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ArrowRight01Icon className="w-4 h-4 text-muted-foreground" />
                )}
                {isExpanded ? (
                    <Folder02Icon className="w-4 h-4 text-primary" />
                ) : (
                    <Folder01Icon className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="flex-1 text-sm font-medium truncate">
                    {collection.name}
                </span>
                <span className="text-xs text-muted-foreground">
                    {totalItems}
                </span>
                {onDelete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleDeleteClick}
                    >
                        <Delete01Icon className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>
            {isExpanded && (
                <div className="ml-6 mt-1 space-y-0.5">
                    {/* Render nested collections */}
                    {childCollections.map((childCollection) => (
                        <CollectionItem
                            key={childCollection.id}
                            collection={childCollection}
                            requests={requests}
                            collections={collections}
                            isExpanded={expandedCollections.has(childCollection.id)}
                            expandedCollections={expandedCollections}
                            onToggle={() => onCollectionToggle(childCollection.id)}
                            onCollectionToggle={onCollectionToggle}
                            onRequestClick={onRequestClick}
                            onDelete={onDelete}
                            activeRequestId={activeRequestId}
                        />
                    ))}

                    {/* Render requests */}
                    {collectionRequests.map((request) => (
                        <RequestItem
                            key={request.id}
                            request={request}
                            onClick={() => onRequestClick(request)}
                            isActive={request.id === activeRequestId}
                        />
                    ))}

                    {/* Empty state */}
                    {totalItems === 0 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground italic">
                            No items
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Collection</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{collection.name}"?
                            This will also delete all nested collections and requests.
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

