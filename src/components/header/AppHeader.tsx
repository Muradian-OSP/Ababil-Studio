import { Zap } from 'lucide-react';

interface AppHeaderProps {
    libraryStatus: {
        initialized: boolean;
        error?: string;
        libraryPath?: string;
    } | null;
}

export function AppHeader({ libraryStatus }: AppHeaderProps) {
    return (
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
                আবাবিল স্টুডিও
            </h1>
            <p className="text-muted-foreground">
                Rust-powered API Testing Platform
            </p>

            {/* Library Status */}
            <div className="flex items-center gap-2">
                <div
                    className={`w-2 h-2 rounded-full ${
                        libraryStatus?.initialized
                            ? 'bg-green-500'
                            : 'bg-red-500'
                    }`}
                />
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {libraryStatus?.initialized ? (
                        <>
                            <Zap className="w-3 h-3" />
                            Rust Core Connected
                        </>
                    ) : (
                        libraryStatus?.error || 'Connecting...'
                    )}
                </span>
            </div>
        </div>
    );
}

