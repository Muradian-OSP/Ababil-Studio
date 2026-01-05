/**
 * HTTP Client Service
 * 
 * This service provides a clean interface for making HTTP requests
 * via the native Rust library through Electron IPC.
 */

import { HttpRequest, HttpResponse, createSimpleRequest } from '../types/http';

/**
 * Check if the native library is available
 */
export async function isNativeLibraryAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ababilAPI) {
    return false;
  }
  
  try {
    const status = await window.ababilAPI.getNativeLibraryStatus();
    return status.initialized;
  } catch {
    return false;
  }
}

/**
 * Get the native library status
 */
export async function getNativeLibraryStatus() {
  if (typeof window === 'undefined' || !window.ababilAPI) {
    return { initialized: false, error: 'Not running in Electron' };
  }
  
  return window.ababilAPI.getNativeLibraryStatus();
}

/**
 * Make an HTTP request using the native Rust library
 */
export async function makeHttpRequest(request: HttpRequest): Promise<HttpResponse> {
  // Check if running in Electron
  if (typeof window === 'undefined' || !window.ababilAPI) {
    return {
      status_code: 0,
      headers: [],
      body: 'Error: Not running in Electron environment',
      duration_ms: 0,
    };
  }

  try {
    const requestJson = JSON.stringify(request);
    const responseJson = await window.ababilAPI.makeHttpRequest(requestJson);
    const response = JSON.parse(responseJson) as HttpResponse;
    return response;
  } catch (error: any) {
    return {
      status_code: 0,
      headers: [],
      body: `Error: ${error.message}`,
      duration_ms: 0,
    };
  }
}

/**
 * Make a simple HTTP request (convenience method)
 */
export async function makeSimpleRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: string
): Promise<HttpResponse> {
  const request = createSimpleRequest(method, url, headers, body);
  return makeHttpRequest(request);
}

/**
 * Parse response headers from array format to object
 */
export function parseHeaders(headers: [string, string][]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of headers) {
    result[key] = value;
  }
  return result;
}

/**
 * Check if response is successful (2xx status code)
 */
export function isSuccessResponse(response: HttpResponse): boolean {
  return response.status_code >= 200 && response.status_code < 300;
}

/**
 * Check if response is an error (4xx or 5xx status code)
 */
export function isErrorResponse(response: HttpResponse): boolean {
  return response.status_code >= 400;
}

/**
 * Get status text for a status code
 */
export function getStatusText(statusCode: number): string {
  const statusTexts: Record<number, string> = {
    0: 'Error',
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  
  return statusTexts[statusCode] || 'Unknown';
}

