use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Variable {
    pub key: String,
    pub value: String,
    #[serde(rename = "type")]
    pub var_type: Option<String>,
    pub disabled: Option<bool>,
}

