import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { Environment } from '../../types/environment';
import { getVariableValue } from '../../services/environmentService';
import { VariableEditDialog } from './VariableEditDialog';

interface VariableUrlInputProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    placeholder?: string;
    className?: string;
    activeEnvironment: Environment | null;
    onEnvironmentUpdate?: () => void;
}

interface VariableInfo {
    key: string;
    match: string;
    startIndex: number;
    endIndex: number;
}

export function VariableUrlInput({
    value,
    onChange,
    onKeyDown,
    placeholder,
    className,
    activeEnvironment,
    onEnvironmentUpdate,
}: VariableUrlInputProps) {
    const [editingVariable, setEditingVariable] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Find all variables in URL
    const findVariables = (url: string): VariableInfo[] => {
        const variables: VariableInfo[] = [];
        const pattern = /\{\{([^}]+)\}\}/g;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(url)) !== null) {
            variables.push({
                key: match[1].trim(),
                match: match[0],
                startIndex: match.index,
                endIndex: match.index + match[0].length,
            });
        }

        return variables;
    };

    const variables = findVariables(value);
    const hasVariables = variables.length > 0;

    const handleVariableClick = (variableKey: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingVariable(variableKey);
    };

    // Calculate positions for variable overlays using a hidden measurement element
    const [variablePositions, setVariablePositions] = useState<
        Record<number, { left: number; width: number }>
    >({});

    useEffect(() => {
        if (!inputRef.current || !hasVariables) {
            setVariablePositions({});
            return;
        }

        // Create a hidden span with the same styling to measure text
        const measurer = document.createElement('span');
        const styles = window.getComputedStyle(inputRef.current);
        measurer.style.position = 'absolute';
        measurer.style.visibility = 'hidden';
        measurer.style.whiteSpace = 'pre';
        measurer.style.font = styles.font;
        measurer.style.fontSize = styles.fontSize;
        measurer.style.fontFamily = styles.fontFamily;
        measurer.style.fontWeight = styles.fontWeight;
        measurer.style.letterSpacing = styles.letterSpacing;
        document.body.appendChild(measurer);

        const positions: Record<number, { left: number; width: number }> = {};
        const inputPadding = 12; // px-3 = 12px

        variables.forEach((variable, index) => {
            // Measure text before variable
            measurer.textContent = value.substring(0, variable.startIndex);
            const widthBefore = measurer.offsetWidth;

            // Measure variable width
            measurer.textContent = variable.match;
            const variableWidth = measurer.offsetWidth;

            positions[index] = {
                left: widthBefore + inputPadding,
                width: variableWidth,
            };
        });

        document.body.removeChild(measurer);
        setVariablePositions(positions);
    }, [value, variables, hasVariables]);

    return (
        <TooltipProvider>
            <div className="flex-1 relative">
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className={`font-mono text-sm ${className || ''}`}
                />

                {/* Variable overlays */}
                {hasVariables && isFocused && (
                    <div
                        ref={overlayRef}
                        className="absolute inset-0 pointer-events-none overflow-hidden"
                        style={{
                            padding: '0.5rem 0.75rem',
                            lineHeight: '1.5rem',
                        }}
                    >
                        {variables.map((variable, index) => {
                            const position = variablePositions[index];
                            if (!position) return null;

                            const variableValue = getVariableValue(
                                variable.key,
                                activeEnvironment
                            );

                            return (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <span
                                            className="absolute pointer-events-auto cursor-pointer underline decoration-dotted decoration-primary/60 hover:decoration-primary text-primary hover:text-primary/80 transition-colors"
                                            style={{
                                                left: `${position.left}px`,
                                                width: `${position.width}px`,
                                                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                                fontSize: '0.875rem',
                                                lineHeight: '1.5rem',
                                            }}
                                            onClick={(e) =>
                                                handleVariableClick(variable.key, e)
                                            }
                                            title={`Click to edit ${variable.key}`}
                                        >
                                            {variable.match}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-1">
                                            <div className="font-semibold">
                                                {variable.key}
                                            </div>
                                            {variableValue !== null ? (
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {variableValue}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground">
                                                    Not set
                                                </div>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}

                {/* Variable Edit Dialog */}
                {editingVariable && (
                    <VariableEditDialog
                        open={!!editingVariable}
                        onOpenChange={(open) => {
                            if (!open) setEditingVariable(null);
                        }}
                        environment={activeEnvironment}
                        variableKey={editingVariable}
                        onVariableUpdated={() => {
                            onEnvironmentUpdate?.();
                            setEditingVariable(null);
                        }}
                    />
                )}
            </div>
        </TooltipProvider>
    );
}
