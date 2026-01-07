import { X, Plus } from 'lucide-react';
import { useTabContext } from '../../contexts/TabContext';
import { cn } from '../../lib/utils';

// Method color mapping (matching Postman's style)
const methodColors: Record<string, string> = {
    GET: 'text-green-500',
    POST: 'text-yellow-500',
    PUT: 'text-blue-500',
    PATCH: 'text-purple-500',
    DELETE: 'text-red-500',
    HEAD: 'text-green-400',
    OPTIONS: 'text-pink-500',
};

export function RequestTabsBar() {
    const { tabState, activeTab, openNewTab, closeTab, switchToTab } =
        useTabContext();

    const handleNewTab = () => {
        openNewTab();
    };

    const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation(); // Prevent switching to the tab when closing it
        closeTab(tabId);
    };

    return (
        <div className="flex items-center bg-background border-b border-border h-10 overflow-hidden">
            {/* Tab list - scrollable */}
            <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
                {tabState.tabs.map((tab) => {
                    const isActive = tab.id === activeTab?.id;
                    const methodColor =
                        methodColors[tab.method?.toUpperCase()] ||
                        'text-muted-foreground';

                    return (
                        <div
                            key={tab.id}
                            onClick={() => switchToTab(tab.id)}
                            className={cn(
                                'group flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-border min-w-[140px] max-w-[200px] transition-colors',
                                isActive
                                    ? 'bg-muted/50 border-b-2 border-b-primary'
                                    : 'hover:bg-muted/30'
                            )}
                        >
                            {/* Method badge */}
                            <span
                                className={cn(
                                    'text-xs font-bold uppercase flex-shrink-0',
                                    methodColor
                                )}
                            >
                                {tab.method || 'GET'}
                            </span>

                            {/* Tab name + dirty indicator */}
                            <span className="text-sm truncate flex-1 text-foreground/80">
                                {tab.name || 'Untitled'}
                                {tab.isDirty && (
                                    <span className="ml-1 text-orange-500">
                                        •
                                    </span>
                                )}
                            </span>

                            {/* Close button */}
                            <button
                                onClick={(e) => handleCloseTab(e, tab.id)}
                                className={cn(
                                    'p-0.5 rounded hover:bg-muted-foreground/20 flex-shrink-0 transition-opacity',
                                    isActive
                                        ? 'opacity-100'
                                        : 'opacity-0 group-hover:opacity-100'
                                )}
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* New tab button */}
            <button
                onClick={handleNewTab}
                className="flex items-center justify-center h-full px-3 hover:bg-muted/30 border-l border-border transition-colors"
                title="New Tab"
            >
                <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
        </div>
    );
}
