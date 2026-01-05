import { Environment } from '../types/environment';
import { replaceVariables } from '../services/environmentService';

/**
 * Replace variables in a text string
 * Returns both the original text and the resolved text
 */
export function replaceVariablesInText(
    text: string,
    environment: Environment | null
): { original: string; resolved: string } {
    const resolved = replaceVariables(text, environment);
    return {
        original: text,
        resolved,
    };
}

/**
 * Replace variables in URL, handling both raw URLs and structured URLs
 */
export function replaceVariablesInUrl(
    url: string | { raw?: string; protocol?: string; host?: string[]; path?: string[]; query?: any[] } | undefined,
    environment: Environment | null
): string {
    if (!url) return '';

    // If it's a string, replace directly
    if (typeof url === 'string') {
        return replaceVariables(url, environment);
    }

    // If it's an object with raw, use raw
    if (url.raw) {
        return replaceVariables(url.raw, environment);
    }

    // Otherwise construct from parts
    const protocol = url.protocol || 'http';
    const host = url.host?.join('.') || '';
    const path = url.path?.join('/') || '';
    const query = url.query
        ?.filter((q: any) => !q.disabled && q.value)
        .map((q: any) => {
            const key = replaceVariables(q.key, environment);
            const value = replaceVariables(q.value || '', environment);
            return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');

    const constructedUrl = `${protocol}://${host}${path ? '/' + path : ''}${query ? '?' + query : ''}`;
    return replaceVariables(constructedUrl, environment);
}

/**
 * Replace variables in request body
 */
export function replaceVariablesInBody(
    body: string | undefined,
    environment: Environment | null
): string {
    if (!body) return '';
    return replaceVariables(body, environment);
}

/**
 * Replace variables in headers object
 */
export function replaceVariablesInHeaders(
    headers: Record<string, string> | undefined,
    environment: Environment | null
): Record<string, string> {
    if (!headers) return {};

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        result[replaceVariables(key, environment)] = replaceVariables(
            value,
            environment
        );
    }
    return result;
}

