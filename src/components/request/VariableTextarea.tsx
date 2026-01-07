import { useState, useRef, useEffect, useMemo } from 'react';
import { Textarea } from '../ui/textarea';
import { Environment } from '../../types/environment';
import { getVariableValue } from '../../services/environmentService';
import { VariableInfoPopup } from './VariableInfoPopup';
import { useEnvironment } from '../../contexts/EnvironmentContext';

interface VariableTextareaProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    activeEnvironment: Environment | null;
    onEnvironmentUpdate?: () => void;
}

interface VariableInfo {
    key: string;
    match: string;
    startIndex: number;
    endIndex: number;
}

export function VariableTextarea({
    value,
    onChange,
    onKeyDown,
    placeholder,
    className,
    rows = 8,
    activeEnvironment,
    onEnvironmentUpdate,
}: VariableTextareaProps) {
    // Get revision from context to force re-render on any environment change
    const { revision } = useEnvironment();
    const [selectedVariable, setSelectedVariable] = useState<{
        key: string;
        position: { top: number; left: number };
    } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Find all variables in text
    const findVariables = (text: string): VariableInfo[] => {
        const variables: VariableInfo[] = [];
        const pattern = /\{\{([^}]+)\}\}/g;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text)) !== null) {
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

        if (!textareaRef.current) return;

        const position = variablePositions[index];
        if (!position) return;

        const textareaRect = textareaRef.current.getBoundingClientRect();
        const popupTop = textareaRect.bottom + 8;
        const popupLeft = textareaRect.left + position.left;

        setSelectedVariable({
            key: variableKey,
            position: { top: popupTop, left: popupLeft },
        });
    };

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectedVariable && textareaRef.current) {
                const target = e.target as HTMLElement;
                if (
                    !textareaRef.current.contains(target) &&
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

    // Calculate positions for variable overlays
    const [variablePositions, setVariablePositions] = useState<
        Record<number, { left: number; width: number; top: number }>
    >({});

    useEffect(() => {
        if (!textareaRef.current || !hasVariables || !isFocused) {
            setVariablePositions({});
            return;
        }

        // Create a hidden span with the same styling to measure text
        const measurer = document.createElement('span');
        const styles = window.getComputedStyle(textareaRef.current);
        measurer.style.position = 'absolute';
        measurer.style.visibility = 'hidden';
        measurer.style.whiteSpace = 'pre-wrap';
        measurer.style.wordWrap = 'break-word';
        measurer.style.font = styles.font;
        measurer.style.fontSize = styles.fontSize;
        measurer.style.fontFamily = styles.fontFamily;
        measurer.style.fontWeight = styles.fontWeight;
        measurer.style.letterSpacing = styles.letterSpacing;
        measurer.style.padding = styles.padding;
        measurer.style.width = `${textareaRef.current.offsetWidth}px`;
        document.body.appendChild(measurer);

        const positions: Record<
            number,
            { left: number; width: number; top: number }
        > = {};
        const textareaPadding = 12; // px-3 = 12px

        variables.forEach((variable, index) => {
            // Get text before variable
            const textBefore = value.substring(0, variable.startIndex);
            measurer.textContent = textBefore;
            const heightBefore = measurer.offsetHeight;

            // Measure variable width
            measurer.textContent = variable.match;
            const variableWidth = measurer.offsetWidth;

            // Calculate which line the variable is on
            const linesBefore = textBefore.split('\n');
            const currentLine = linesBefore.length - 1;
            const textOnCurrentLine = linesBefore[currentLine] || '';

            // Measure width of text on current line before variable
            measurer.textContent = textOnCurrentLine;
            const widthBefore = measurer.offsetWidth;

            positions[index] = {
                left: widthBefore + textareaPadding,
                width: variableWidth,
                top: heightBefore,
            };
        });

        document.body.removeChild(measurer);
        setVariablePositions(positions);
    }, [value, variables, hasVariables, isFocused]);

    return (
        <div className="flex-1 relative">
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
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
                rows={rows}
                className={`font-mono text-sm resize-none ${className || ''}`}
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
                        const hasValue =
                            variableValue != null &&
                            variableValue.trim() !== '';

                        // Color classes: green if exists with value, red otherwise
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
                                    top: `${position.top}px`,
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
                            setSelectedVariable(null);
                        }}
                        onVariableUpdated={() => {
                            onEnvironmentUpdate?.();
                            setSelectedVariable(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
