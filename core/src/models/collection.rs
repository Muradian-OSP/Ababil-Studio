use serde::{Deserialize, Serialize};

use super::request::{Event, Request, Header};
use super::variable::Variable;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CollectionInfo {
    pub name: String,
    pub description: Option<String>,
    pub schema: Option<String>,
    #[serde(rename = "_postman_id")]
    pub postman_id: Option<String>,
    #[serde(rename = "_exporter_id")]
    pub exporter_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CollectionItem {
    pub name: String,
    pub item: Option<Vec<CollectionItem>>,
    pub request: Option<Request>,
    pub response: Option<Vec<Response>>,
    pub event: Option<Vec<Event>>,
    pub description: Option<String>,
    pub variable: Option<Vec<Variable>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Response {
    pub name: Option<String>,
    pub original_request: Option<Request>,
    pub status: Option<String>,
    pub code: Option<u16>,
    #[serde(rename = "_postman_previewlanguage")]
    pub postman_previewlanguage: Option<String>,
    pub header: Option<Vec<Header>>,
    pub cookie: Option<Vec<Cookie>>,
    pub body: Option<String>,
    pub response_time: Option<String>,
    pub timings: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Cookie {
    pub name: Option<String>,
    pub value: Option<String>,
    pub domain: Option<String>,
    pub path: Option<String>,
    pub expires: Option<String>,
    pub http_only: Option<bool>,
    pub secure: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub info: CollectionInfo,
    pub item: Vec<CollectionItem>,
    pub variable: Option<Vec<Variable>>,
    pub event: Option<Vec<Event>>,
    pub auth: Option<super::request::Auth>,
}

impl Collection {
    pub fn from_json(json_str: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json_str)
    }

    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}

