# Ababil Core

Rust core library for Ababil HTTP client, providing FFI bindings for use with Flutter (and future Electron UI).

## Building

```bash
cargo build --release
```

## FFI Functions

### `make_http_request`

Makes an HTTP request and returns a JSON-encoded response.

**Parameters:**
- `method`: HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- `url`: Request URL
- `headers_json`: JSON array of header key-value pairs: `[["key1", "value1"], ["key2", "value2"]]`
- `body`: Request body (can be null for GET, HEAD, OPTIONS)

**Returns:**
JSON-encoded `HttpResponse` object:
```json
{
  "status_code": 200,
  "headers": [["header-name", "header-value"]],
  "body": "response body",
  "duration_ms": 123
}
```

### `free_string`

Frees a string pointer returned by `make_http_request`. Must be called after using the response.

## Example Usage (C)

```c
#include "ababil_core.h"

char* response = make_http_request(
    "GET",
    "https://api.example.com",
    "[[\"Content-Type\", \"application/json\"]]",
    NULL
);

// Use response...

free_string(response);
```

## Dependencies

- `reqwest` - HTTP client
- `tokio` - Async runtime
- `serde` / `serde_json` - JSON serialization
- `cbindgen` - C header generation

