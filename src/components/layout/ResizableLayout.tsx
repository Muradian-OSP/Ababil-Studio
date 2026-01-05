import { useState, useEffect, useRef, ReactNode } from 'react';
import { ArrowLeft01Icon, ArrowRight01Icon } from 'hugeicons-react';

interface ResizableLayoutProps {
    sidebar: ReactNode | null;
    mainContent: ReactNode;
    defaultSidebarWidth?: number;
    minSidebarWidth?: number;
    maxSidebarWidth?: number;
}

export function ResizableLayout({
    sidebar,
    mainContent,
    defaultSidebarWidth = 250,
    minSidebarWidth = 200,
    maxSidebarWidth = 400,
}: ResizableLayoutProps) {
    const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);

    // Load saved width from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('ababil_sidebar_width');
        if (saved) {
            const width = parseInt(saved, 10);
            if (width >= minSidebarWidth && width <= maxSidebarWidth) {
                setSidebarWidth(width);
            }
        }
    }, [minSidebarWidth, maxSidebarWidth]);

    // Save width to localStorage
    useEffect(() => {
        if (!isCollapsed) {
            localStorage.setItem(
                'ababil_sidebar_width',
                sidebarWidth.toString()
            );
        }
    }, [sidebarWidth, isCollapsed]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = e.clientX;
            if (newWidth >= minSidebarWidth && newWidth <= maxSidebarWidth) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, minSidebarWidth, maxSidebarWidth]);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    if (!sidebar) {
        // No sidebar, just show main content
        return <div className="h-full w-full overflow-hidden bg-background">{mainContent}</div>;
    }

    return (
        <div className="flex h-full overflow-hidden relative">
            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`bg-card border-r border-border transition-all duration-300 relative ${
                    isCollapsed ? 'w-0 overflow-hidden' : ''
                }`}
                style={{
                    width: isCollapsed ? 0 : `${sidebarWidth}px`,
                    minWidth: isCollapsed ? 0 : `${minSidebarWidth}px`,
                }}
            >
                {!isCollapsed && (
                    <div className="h-full overflow-y-auto">{sidebar}</div>
                )}
            </div>

            {/* Toggle Button - Always visible */}
            <button
                onClick={toggleCollapse}
                className="absolute top-1/2 -translate-y-1/2 z-20 bg-card border border-border rounded-r-lg p-1.5 hover:bg-accent transition-all duration-300 shadow-sm"
                style={{
                    left: isCollapsed ? 0 : `${sidebarWidth}px`,
                }}
            >
                {isCollapsed ? (
                    <ArrowRight01Icon className="w-4 h-4" />
                ) : (
                    <ArrowLeft01Icon className="w-4 h-4" />
                )}
            </button>

            {/* Resize Handle */}
            {!isCollapsed && (
                <div
                    ref={resizeRef}
                    onMouseDown={handleMouseDown}
                    className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors ${
                        isResizing ? 'bg-primary' : ''
                    }`}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-hidden bg-background">{mainContent}</div>
        </div>
    );
}
