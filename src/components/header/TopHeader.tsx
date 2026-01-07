import { LockIcon, Settings01Icon } from 'hugeicons-react';
import { Button } from '../ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { useEnvironment } from '../../contexts/EnvironmentContext';

interface TopHeaderProps {
    onSettingsClick?: () => void;
}

export function TopHeader({ onSettingsClick }: TopHeaderProps) {
    const {
        activeEnvironment,
        environments,
        setActiveEnvironment,
        clearActiveEnvironment,
    } = useEnvironment();

    const handleEnvironmentChange = (value: string) => {
        if (value === 'none') {
            clearActiveEnvironment();
        } else {
            setActiveEnvironment(value);
        }
    };

    return (
        <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                {/* Workspace */}
                <div className="flex items-center gap-2">
                    <LockIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        Personal Workspace
                    </span>
                </div>

                {/* Environment Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        Environment:
                    </span>
                    <Select
                        value={activeEnvironment?.id || 'none'}
                        onValueChange={handleEnvironmentChange}
                    >
                        <SelectTrigger className="w-[200px] h-8">
                            <SelectValue placeholder="No Environment">
                                {activeEnvironment?.name || 'No Environment'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No Environment</SelectItem>
                            {environments.map((env) => (
                                <SelectItem key={env.id} value={env.id}>
                                    {env.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Settings Button */}
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onSettingsClick}
            >
                <Settings01Icon className="w-4 h-4" />
            </Button>
        </div>
    );
}
