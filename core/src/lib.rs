mod models;
mod postman;

use crate::models::request::{Request, Url, Body, Auth};
use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;
use base64::Engine;

// Simple URL encoding helper
fn url_encode(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
            ' ' => "+".to_string(),
            _ => format!("%{:02X}", c as u8),
        })
        .collect()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status_code: u16,
    pub headers: Vec<(String, String)>,
    pub body: String,
    pub duration_ms: u64,
}

#[no_mangle]
pub extern "C" fn make_http_request(request_json: *const c_char) -> *mut c_char {
    if request_json.is_null() {
        return ptr::null_mut();
    }

    let json_str = unsafe {
        match CStr::from_ptr(request_json).to_str() {
            Ok(s) => s,
            Err(_) => return ptr::null_mut(),
        }
    };

    let request: Request = match serde_json::from_str(json_str) {
        Ok(req) => req,
        Err(e) => {
            let error_response = HttpResponse {
                status_code: 0,
                headers: Vec::new(),
                body: format!("Error parsing request: {}", e),
                duration_ms: 0,
            };
            match serde_json::to_string(&error_response) {
                Ok(json) => return CString::new(json).unwrap().into_raw(),
                Err(_) => return ptr::null_mut(),
            }
        }
    };

    let start = std::time::Instant::now();
    let response_result = execute_request_from_struct(&request);
    
    let response = match response_result {
        Ok(resp) => resp,
        Err(e) => HttpResponse {
            status_code: 0,
            headers: Vec::new(),
            body: format!("Error: {}", e),
            duration_ms: start.elapsed().as_millis() as u64,
        },
    };

    let duration_ms = start.elapsed().as_millis() as u64;
    let final_response = HttpResponse {
        duration_ms,
        ..response
    };

    match serde_json::to_string(&final_response) {
        Ok(json) => CString::new(json).unwrap().into_raw(),
        Err(_) => ptr::null_mut(),
    }
}

fn execute_request_from_struct(
    request: &Request,
) -> Result<HttpResponse, Box<dyn std::error::Error>> {
    // Extract method
    let method = request.method.as_deref().unwrap_or("GET").to_uppercase();
    
    // Build URL from Url struct
    let url_str = build_url_from_struct(request.url.as_ref())?;
    
    // Extract headers
    let mut headers: Vec<(String, String)> = Vec::new();
    if let Some(header_list) = &request.header {
        for header in header_list {
            if header.disabled.unwrap_or(false) {
                continue;
            }
            headers.push((header.key.clone(), header.value.clone()));
        }
    }
    
    // Handle authentication
    if let Some(auth) = &request.auth {
        apply_auth(auth, &mut headers)?;
    }
    
    // Build body
    let body_content = build_body_from_struct(request.body.as_ref())?;
    
    // Execute request
    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(async {
        let client = reqwest::Client::new();
        let mut request_builder = match method.as_str() {
            "GET" => client.get(&url_str),
            "POST" => client.post(&url_str),
            "PUT" => client.put(&url_str),
            "PATCH" => client.patch(&url_str),
            "DELETE" => client.delete(&url_str),
            "HEAD" => client.head(&url_str),
            "OPTIONS" => client.request(reqwest::Method::OPTIONS, &url_str),
            _ => return Err("Unsupported HTTP method".into()),
        };

        for (key, value) in &headers {
            request_builder = request_builder.header(key, value);
        }

        if let Some(body_str) = body_content {
            request_builder = request_builder.body(body_str);
        }

        let response = request_builder.send().await?;
        let status_code = response.status().as_u16();
        let response_headers: Vec<(String, String)> = response
            .headers()
            .iter()
            .map(|(k, v): (&reqwest::header::HeaderName, &reqwest::header::HeaderValue)| {
                (
                    k.to_string(),
                    v.to_str().unwrap_or("").to_string(),
                )
            })
            .collect();

        let body_text = response.text().await?;

        Ok(HttpResponse {
            status_code,
            headers: response_headers,
            body: body_text,
            duration_ms: 0, // Will be set by caller
        })
    })
}

fn build_url_from_struct(url: Option<&Url>) -> Result<String, Box<dyn std::error::Error>> {
    let url = match url {
        Some(u) => u,
        None => return Err("URL is required".into()),
    };
    
    // If raw URL is provided, use it directly
    if let Some(raw) = &url.raw {
        if !raw.is_empty() {
            return Ok(raw.clone());
        }
    }
    
    // Otherwise, build from components
    let mut url_string = String::new();
    
    // Protocol
    if let Some(protocol) = &url.protocol {
        url_string.push_str(protocol);
        url_string.push_str("://");
    } else {
        url_string.push_str("http://");
    }
    
    // Host
    if let Some(host_parts) = &url.host {
        url_string.push_str(&host_parts.join("."));
    } else {
        return Err("Host is required".into());
    }
    
    // Path
    if let Some(path_parts) = &url.path {
        let path = path_parts.join("/");
        if !path.is_empty() {
            url_string.push_str("/");
            url_string.push_str(&path);
        }
    }
    
    // Query parameters
    if let Some(query_params) = &url.query {
        let mut query_string = String::new();
        for param in query_params {
            if param.disabled.unwrap_or(false) {
                continue;
            }
            if let Some(value) = &param.value {
                if !query_string.is_empty() {
                    query_string.push('&');
                }
                query_string.push_str(&format!("{}={}", 
                    url_encode(&param.key),
                    url_encode(value)
                ));
            }
        }
        if !query_string.is_empty() {
            url_string.push('?');
            url_string.push_str(&query_string);
        }
    }
    
    Ok(url_string)
}

fn build_body_from_struct(body: Option<&Body>) -> Result<Option<String>, Box<dyn std::error::Error>> {
    let body = match body {
        Some(b) => b,
        None => return Ok(None),
    };
    
    let mode = body.mode.as_deref().unwrap_or("raw");
    
    match mode {
        "raw" => {
            if let Some(raw) = &body.raw {
                Ok(Some(raw.clone()))
            } else {
                Ok(None)
            }
        }
        "urlencoded" => {
            if let Some(form_data) = &body.urlencoded {
                let mut pairs = Vec::new();
                for item in form_data {
                    if item.disabled.unwrap_or(false) {
                        continue;
                    }
                    if let Some(value) = &item.value {
                        pairs.push(format!("{}={}", 
                            url_encode(&item.key),
                            url_encode(value)
                        ));
                    }
                }
                Ok(Some(pairs.join("&")))
            } else {
                Ok(None)
            }
        }
        "formdata" => {
            // For formdata, we'll use multipart/form-data
            // For simplicity, we'll convert to URL-encoded format
            // In a full implementation, you'd use multipart
            if let Some(form_data) = &body.formdata {
                let mut pairs = Vec::new();
                for item in form_data {
                    if item.disabled.unwrap_or(false) {
                        continue;
                    }
                    if let Some(value) = &item.value {
                        pairs.push(format!("{}={}", 
                            url_encode(&item.key),
                            url_encode(value)
                        ));
                    }
                }
                Ok(Some(pairs.join("&")))
            } else {
                Ok(None)
            }
        }
        "graphql" => {
            if let Some(graphql) = &body.graphql {
                let mut graphql_body = serde_json::json!({});
                if let Some(query) = &graphql.query {
                    graphql_body["query"] = serde_json::Value::String(query.clone());
                }
                if let Some(variables) = &graphql.variables {
                    // Try to parse as JSON, otherwise use as string
                    match serde_json::from_str::<serde_json::Value>(variables) {
                        Ok(vars) => {
                            graphql_body["variables"] = vars;
                        }
                        Err(_) => {
                            graphql_body["variables"] = serde_json::Value::String(variables.clone());
                        }
                    }
                }
                Ok(Some(serde_json::to_string(&graphql_body)?))
            } else {
                Ok(None)
            }
        }
        _ => Ok(None),
    }
}

fn apply_auth(auth: &Auth, headers: &mut Vec<(String, String)>) -> Result<(), Box<dyn std::error::Error>> {
    let auth_type = auth.auth_type.as_deref().unwrap_or("noauth");
    
    match auth_type {
        "bearer" => {
            if let Some(bearer_vars) = &auth.bearer {
                for var in bearer_vars {
                    if var.key == "token" || var.key == "Token" {
                        headers.push(("Authorization".to_string(), format!("Bearer {}", var.value)));
                    }
                }
            }
        }
        "basic" => {
            if let Some(basic_vars) = &auth.basic {
                let mut username = String::new();
                let mut password = String::new();
                
                for var in basic_vars {
                    match var.key.as_str() {
                        "username" | "Username" | "user" | "User" => {
                            username = var.value.clone();
                        }
                        "password" | "Password" | "pass" | "Pass" => {
                            password = var.value.clone();
                        }
                        _ => {}
                    }
                }
                
                if !username.is_empty() || !password.is_empty() {
                    let credentials = format!("{}:{}", username, password);
                    let encoded = base64::engine::general_purpose::STANDARD.encode(credentials.as_bytes());
                    headers.push(("Authorization".to_string(), format!("Basic {}", encoded)));
                }
            }
        }
        _ => {
            // Other auth types (digest, awsv4, hawk, oauth1, oauth2, ntlm) would need more complex handling
            // For now, we'll skip them
        }
    }
    
    Ok(())
}

#[no_mangle]
pub extern "C" fn free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe {
            let _ = CString::from_raw(ptr);
        }
    }
}

