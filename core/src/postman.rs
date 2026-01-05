use crate::models::collection::Collection;
use crate::models::environment::Environment;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::ptr;

/// Parse a Postman collection JSON string into a Collection struct
#[no_mangle]
pub extern "C" fn parse_postman_collection(json_str: *const c_char) -> *mut c_char {
    if json_str.is_null() {
        return ptr::null_mut();
    }

    let json = unsafe {
        match CStr::from_ptr(json_str).to_str() {
            Ok(s) => s,
            Err(_) => return ptr::null_mut(),
        }
    };

    match Collection::from_json(json) {
        Ok(collection) => {
            match serde_json::to_string(&collection) {
                Ok(result_json) => CString::new(result_json).unwrap().into_raw(),
                Err(_) => ptr::null_mut(),
            }
        }
        Err(e) => {
            let error_json = format!(r#"{{"error": "{}"}}"#, e);
            CString::new(error_json).unwrap().into_raw()
        }
    }
}

/// Convert a Collection struct to Postman-compatible JSON
#[no_mangle]
pub extern "C" fn collection_to_json(collection_json: *const c_char) -> *mut c_char {
    if collection_json.is_null() {
        return ptr::null_mut();
    }

    let json = unsafe {
        match CStr::from_ptr(collection_json).to_str() {
            Ok(s) => s,
            Err(_) => return ptr::null_mut(),
        }
    };

    match serde_json::from_str::<Collection>(json) {
        Ok(collection) => {
            match collection.to_json() {
                Ok(result_json) => CString::new(result_json).unwrap().into_raw(),
                Err(_) => ptr::null_mut(),
            }
        }
        Err(e) => {
            let error_json = format!(r#"{{"error": "{}"}}"#, e);
            CString::new(error_json).unwrap().into_raw()
        }
    }
}

/// Parse a Postman environment JSON string
#[no_mangle]
pub extern "C" fn parse_postman_environment(json_str: *const c_char) -> *mut c_char {
    if json_str.is_null() {
        return ptr::null_mut();
    }

    let json = unsafe {
        match CStr::from_ptr(json_str).to_str() {
            Ok(s) => s,
            Err(_) => return ptr::null_mut(),
        }
    };

    match serde_json::from_str::<Environment>(json) {
        Ok(environment) => {
            match serde_json::to_string(&environment) {
                Ok(result_json) => CString::new(result_json).unwrap().into_raw(),
                Err(_) => ptr::null_mut(),
            }
        }
        Err(e) => {
            let error_json = format!(r#"{{"error": "{}"}}"#, e);
            CString::new(error_json).unwrap().into_raw()
        }
    }
}

/// Convert an Environment struct to Postman-compatible JSON
#[no_mangle]
pub extern "C" fn environment_to_json(environment_json: *const c_char) -> *mut c_char {
    if environment_json.is_null() {
        return ptr::null_mut();
    }

    let json = unsafe {
        match CStr::from_ptr(environment_json).to_str() {
            Ok(s) => s,
            Err(_) => return ptr::null_mut(),
        }
    };

    match serde_json::from_str::<Environment>(json) {
        Ok(environment) => {
            match serde_json::to_string_pretty(&environment) {
                Ok(result_json) => CString::new(result_json).unwrap().into_raw(),
                Err(_) => ptr::null_mut(),
            }
        }
        Err(e) => {
            let error_json = format!(r#"{{"error": "{}"}}"#, e);
            CString::new(error_json).unwrap().into_raw()
        }
    }
}

