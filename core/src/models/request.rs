use serde::{Deserialize, Serialize};

use super::variable::Variable;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Url {
    pub raw: Option<String>,
    pub protocol: Option<String>,
    pub host: Option<Vec<String>>,
    pub path: Option<Vec<String>>,
    pub query: Option<Vec<QueryParam>>,
    pub variable: Option<Vec<Variable>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QueryParam {
    pub key: String,
    pub value: Option<String>,
    pub disabled: Option<bool>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Header {
    pub key: String,
    pub value: String,
    pub disabled: Option<bool>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Body {
    pub mode: Option<String>,
    pub raw: Option<String>,
    pub urlencoded: Option<Vec<FormData>>,
    pub formdata: Option<Vec<FormData>>,
    pub file: Option<FileBody>,
    pub graphql: Option<GraphQLBody>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FormData {
    pub key: String,
    pub value: Option<String>,
    #[serde(rename = "type")]
    pub data_type: Option<String>,
    pub disabled: Option<bool>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FileBody {
    pub src: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GraphQLBody {
    pub query: Option<String>,
    pub variables: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Auth {
    #[serde(rename = "type")]
    pub auth_type: Option<String>,
    pub bearer: Option<Vec<Variable>>,
    pub basic: Option<Vec<Variable>>,
    pub digest: Option<Vec<Variable>>,
    pub awsv4: Option<Vec<Variable>>,
    pub hawk: Option<Vec<Variable>>,
    pub noauth: Option<serde_json::Value>,
    pub oauth1: Option<Vec<Variable>>,
    pub oauth2: Option<Vec<Variable>>,
    pub ntlm: Option<Vec<Variable>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Event {
    pub listen: Option<String>,
    pub script: Option<Script>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Script {
    #[serde(rename = "type")]
    pub script_type: Option<String>,
    pub exec: Option<Vec<String>>,
    pub src: Option<Url>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Request {
    pub method: Option<String>,
    pub header: Option<Vec<Header>>,
    pub body: Option<Body>,
    pub url: Option<Url>,
    pub description: Option<String>,
    pub auth: Option<Auth>,
}

