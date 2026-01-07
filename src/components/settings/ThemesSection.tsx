import { useState, useEffect, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';
import { applyTheme, type Theme } from '../../services/themeService';

export function ThemesSection() {
    const { theme, effectiveTheme, setTheme } = useTheme();
    const [isManual, setIsManual] = useState(theme !== 'system');
    const [manualTheme, setManualTheme] = useState<'light' | 'dark'>(
        theme === 'system' ? effectiveTheme : theme
    );
    const [hoveredCard, setHoveredCard] = useState<'day' | 'night' | null>(null);
    const originalThemeRef = useRef<Theme | null>(null);

    // Sync manual theme when theme changes externally
    useEffect(() => {
        if (theme !== 'system') {
            setManualTheme(theme);
        }
    }, [theme]);

    // Clean up hover preview when switching to system mode
    useEffect(() => {
        if (!isManual && hoveredCard) {
            // Restore original theme if we were hovering
            if (originalThemeRef.current) {
                applyTheme(originalThemeRef.current);
                originalThemeRef.current = null;
            }
            setHoveredCard(null);
        }
    }, [isManual, hoveredCard]);

    const handleModeChange = (value: string) => {
        if (value === 'system') {
            setIsManual(false);
            setTheme('system');
        } else {
            setIsManual(true);
            setTheme(manualTheme);
        }
    };

    const handleDayThemeClick = () => {
        setIsManual(true);
        setManualTheme('light');
        setTheme('light');
        // Clear hover state since we're committing to this theme
        originalThemeRef.current = null;
        setHoveredCard(null);
    };

    const handleNightThemeClick = () => {
        setIsManual(true);
        setManualTheme('dark');
        setTheme('dark');
        // Clear hover state since we're committing to this theme
        originalThemeRef.current = null;
        setHoveredCard(null);
    };

    const handleDayThemeHover = () => {
        if (!isManual) return;
        originalThemeRef.current = theme;
        applyTheme('light');
        setHoveredCard('day');
    };

    const handleNightThemeHover = () => {
        if (!isManual) return;
        originalThemeRef.current = theme;
        applyTheme('dark');
        setHoveredCard('night');
    };

    const handleCardMouseLeave = () => {
        if (!isManual || !originalThemeRef.current) return;
        // Restore the original theme by applying it again
        applyTheme(originalThemeRef.current);
        originalThemeRef.current = null;
        setHoveredCard(null);
    };

    // In manual mode, check manualTheme; in system mode, check effectiveTheme
    // (though cards aren't shown in system mode anyway)
    const isDayActive = isManual 
        ? manualTheme === 'light' 
        : effectiveTheme === 'light';
    const isNightActive = isManual 
        ? manualTheme === 'dark' 
        : effectiveTheme === 'dark';

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="max-w-6xl mx-auto p-8 space-y-8">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Themes</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Personalize your experience with themes that match
                            your style. Manually select a theme or sync with
                            system settings and let the machine set your day and
                            night themes.
                        </p>
                    </div>
                </div>

                {/* Theme Selection Mode */}
                <div className="space-y-4">
                    <Label className="text-base font-semibold">
                        Theme selection
                    </Label>
                    <RadioGroup
                        value={isManual ? 'manual' : 'system'}
                        onValueChange={handleModeChange}
                        className="flex gap-6"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="system" id="system" />
                            <Label
                                htmlFor="system"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Sync with system
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual" />
                            <Label
                                htmlFor="manual"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Manual
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Theme Preview Cards - Only show when manual mode is enabled */}
                {isManual && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* Day Theme Card */}
                        <div
                            className={`space-y-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                hoveredCard === 'day'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : isDayActive
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/50'
                                    : 'border-border hover:border-blue-300 hover:bg-accent/50'
                            }`}
                            onClick={handleDayThemeClick}
                            onMouseEnter={handleDayThemeHover}
                            onMouseLeave={handleCardMouseLeave}
                        >
                            <div className="flex items-center gap-2">
                                <Sun className="w-5 h-5" />
                                <h3 className="text-lg font-semibold">
                                    Day Theme
                                </h3>
                                {isDayActive && (
                                    <Badge
                                        variant="default"
                                        className="ml-auto bg-blue-500 hover:bg-blue-500"
                                    >
                                        ACTIVE
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Active when system is set to light.
                            </p>

                            {/* Preview Window */}
                            <div className="border border-border rounded-lg overflow-hidden bg-white shadow-lg">
                                <div className="bg-gray-100 border-b border-border px-3 py-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="pt-2">
                                        <div className="h-8 bg-blue-500 rounded w-24"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Night Theme Card */}
                        <div
                            className={`space-y-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                hoveredCard === 'night'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                    : isNightActive
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/50'
                                    : 'border-border hover:border-blue-300 hover:bg-accent/50'
                            }`}
                            onClick={handleNightThemeClick}
                            onMouseEnter={handleNightThemeHover}
                            onMouseLeave={handleCardMouseLeave}
                        >
                            <div className="flex items-center gap-2">
                                <Moon className="w-5 h-5" />
                                <h3 className="text-lg font-semibold">
                                    Night Theme
                                </h3>
                                {isNightActive && (
                                    <Badge
                                        variant="default"
                                        className="ml-auto bg-blue-500 hover:bg-blue-500"
                                    >
                                        ACTIVE
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Active when system is set to dark.
                            </p>

                            {/* Preview Window */}
                            <div className="border border-border rounded-lg overflow-hidden bg-gray-900 shadow-lg">
                                <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                                    <div className="pt-2 flex items-center gap-2">
                                        <div className="h-8 bg-orange-500 rounded w-16"></div>
                                        <div className="h-8 bg-blue-500 rounded w-24"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

