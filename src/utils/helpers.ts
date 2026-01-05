/**
 * Detect the programming language of a response body
 */
export function detectLanguage(body: string): string {
    const trimmed = body.trim();

    // Try to parse as JSON
    try {
        JSON.parse(trimmed);
        return 'json';
    } catch {
        // Not JSON
    }

    // Check for XML
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
        return 'xml';
    }

    // Check for HTML
    if (
        trimmed.match(/^<html[\s>]/i) ||
        trimmed.match(/^<!DOCTYPE html/i)
    ) {
        return 'html';
    }

    // Check for CSS
    if (
        trimmed.includes('{') &&
        trimmed.includes('}') &&
        trimmed.includes(':')
    ) {
        const cssPattern = /[a-zA-Z-]+\s*:\s*[^;]+;/;
        if (cssPattern.test(trimmed)) {
            return 'css';
        }
    }

    // Check for JavaScript
    if (
        trimmed.includes('function') ||
        trimmed.includes('=>') ||
        trimmed.includes('const ') ||
        trimmed.includes('let ')
    ) {
        return 'javascript';
    }

    // Default to plain text
    return 'text';
}

/**
 * Format response body (pretty print JSON)
 */
export function formatBody(body: string): string {
    try {
        const parsed = JSON.parse(body);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return body;
    }
}

/**
 * Get status badge variant based on status code
 */
export function getStatusVariant(
    code: number
): 'default' | 'success' | 'warning' | 'destructive' {
    if (code === 0) return 'destructive';
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'warning';
    if (code >= 400) return 'destructive';
    return 'default';
}

/**
 * Get color class for HTTP method
 */
export function getMethodColor(m: string): string {
    const colors: Record<string, string> = {
        GET: 'text-green-600 dark:text-green-400',
        POST: 'text-yellow-600 dark:text-yellow-400',
        PUT: 'text-blue-600 dark:text-blue-400',
        PATCH: 'text-purple-600 dark:text-purple-400',
        DELETE: 'text-red-600 dark:text-red-400',
        HEAD: 'text-cyan-600 dark:text-cyan-400',
        OPTIONS: 'text-gray-600 dark:text-gray-400',
    };
    return colors[m] || '';
}

