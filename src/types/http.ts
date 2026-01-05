// HTTP Request Types - matching Rust struct format

export interface QueryParam {
    key: string;
    value?: string;
    disabled?: boolean;
    description?: string;
}

export interface RequestHeader {
    key: string;
    value: string;
    disabled?: boolean;
    description?: string;
}

export interface FormData {
    key: string;
    value?: string;
    type?: string;
    disabled?: boolean;
    description?: string;
}

export interface GraphQLBody {
    query?: string;
    variables?: string;
}

export interface RequestBody {
    mode?: 'raw' | 'urlencoded' | 'formdata' | 'graphql' | 'none';
    raw?: string;
    urlencoded?: FormData[];
    formdata?: FormData[];
    graphql?: GraphQLBody;
}

export interface AuthVariable {
    key: string;
    value: string;
    type?: string;
}

export interface RequestAuth {
    type?:
        | 'noauth'
        | 'bearer'
        | 'basic'
        | 'digest'
        | 'oauth1'
        | 'oauth2'
        | 'apikey';
    bearer?: AuthVariable[];
    basic?: AuthVariable[];
    apikey?: AuthVariable[];
}

export interface RequestUrl {
    raw?: string;
    protocol?: string;
    host?: string[];
    path?: string[];
    query?: QueryParam[];
}

export interface HttpRequest {
    method?: string;
    header?: RequestHeader[];
    body?: RequestBody;
    url?: RequestUrl;
    description?: string;
    auth?: RequestAuth;
}

export interface HttpResponse {
    status_code: number;
    headers: [string, string][];
    body: string;
    duration_ms: number;
}

// Helper to create a simple request
export function createSimpleRequest(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    body?: string
): HttpRequest {
    return {
        method,
        url: { raw: url },
        header: Object.entries(headers).map(([key, value]) => ({ key, value })),
        body: body ? { mode: 'raw', raw: body } : undefined,
    };
}
