import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '../ui/input';
import { Environment } from '../../types/environment';
import { getVariableValue } from '../../services/environmentService';
import { VariableInfoPopup } from './VariableInfoPopup';
import { useEnvironment } from '../../contexts/EnvironmentContext';

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
    // Get revision from context to force re-render on any environment change
    const { revision } = useEnvironment();
    const [selectedVariable, setSelectedVariable] = useState<{
        key: string;
        position: { top: number; left: number };
    } | null>(null);
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

    const variables = useMemo(() => findVariables(value), [value]);
    const hasVariables = variables.length > 0;

    // Memoize variable values using the revision counter from context
    // This ensures we recalculate whenever ANY environment change happens globally
    const variableValues = useMemo(() => {
        const values: Record<string, string | null> = {};
        variables.forEach((variable) => {
            const val = getVariableValue(variable.key, activeEnvironment);
            values[variable.key] = val;
        });
        return values;
        // Using revision from context ensures this updates on any environment change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variables, activeEnvironment?.id, revision]);

    const handleVariableClick = (
        variableKey: string,
        index: number,
        e: React.MouseEvent
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (!inputRef.current) return;

        const position = variablePositions[index];
        if (!position) return;

        const inputRect = inputRef.current.getBoundingClientRect();
        const popupTop = inputRect.bottom + 8; // 8px gap below input
        const popupLeft = inputRect.left + position.left;

        setSelectedVariable({
            key: variableKey,
            position: { top: popupTop, left: popupLeft },
        });
    };

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectedVariable && inputRef.current) {
                const target = e.target as HTMLElement;
                if (
                    !inputRef.current.contains(target) &&
                    !target.closest('[data-variable-popup]')
                ) {
                    setSelectedVariable(null);
                }
            }
        };

        if (selectedVariable) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [selectedVariable]);

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
        <div className="flex-1 relative">
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    // Delay blur to allow variable click to register
                    setTimeout(() => {
                        const activeElement = document.activeElement;
                        if (
                            !activeElement ||
                            (!activeElement.closest('[data-variable-popup]') &&
                                !activeElement.closest('.absolute'))
                        ) {
                            setIsFocused(false);
                        }
                    }, 100);
                }}
                placeholder={placeholder}
                className={`font-mono text-sm ${className || ''}`}
            />

            {/* Variable overlays */}
            {hasVariables && (
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

                        const variableValue = variableValues[variable.key];

                        // Determine if variable exists and has a value
                        // Check for null, undefined, or empty string (after trimming)
                        const hasValue =
                            variableValue != null &&
                            variableValue.trim() !== '';

                        // Color classes: green if exists with value, red otherwise
                        // Use more vibrant colors and normal font weight to match input text
                        const colorClasses = hasValue
                            ? 'text-green-600 dark:text-green-400 underline decoration-dotted decoration-green-500/70 hover:decoration-green-500 font-normal'
                            : 'text-red-600 dark:text-red-400 underline decoration-dotted decoration-red-500/70 hover:decoration-red-500 font-normal';

                        return (
                            <span
                                key={index}
                                className={`absolute ${
                                    isFocused
                                        ? 'pointer-events-auto cursor-pointer'
                                        : 'pointer-events-none'
                                } ${colorClasses} transition-colors`}
                                style={{
                                    left: `${position.left}px`,
                                    width: `${position.width}px`,
                                    fontFamily:
                                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.5rem',
                                    fontWeight: 'normal',
                                }}
                                onMouseDown={
                                    isFocused
                                        ? (e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleVariableClick(
                                                  variable.key,
                                                  index,
                                                  e
                                              );
                                          }
                                        : undefined
                                }
                                title={
                                    isFocused
                                        ? `Click to view ${variable.key}`
                                        : undefined
                                }
                            >
                                {variable.match}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Variable Info Popup */}
            {selectedVariable && (
                <div data-variable-popup>
                    <VariableInfoPopup
                        variableKey={selectedVariable.key}
                        environment={activeEnvironment}
                        position={selectedVariable.position}
                        onClose={() => setSelectedVariable(null)}
                        onEdit={() => {
                            // Open full edit dialog if needed
                            setSelectedVariable(null);
                        }}
                        onVariableUpdated={() => {
                            onEnvironmentUpdate?.();
                            // Close popup after update to show fresh data on next open
                            setSelectedVariable(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
