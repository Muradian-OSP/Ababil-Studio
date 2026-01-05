use serde::{Deserialize, Serialize};

use super::variable::Variable;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Environment {
    pub id: Option<String>,
    pub name: String,
    pub values: Option<Vec<Variable>>,
    #[serde(rename = "_postman_variable_scope")]
    pub postman_variable_scope: Option<String>,
    #[serde(rename = "_postman_exported_at")]
    pub postman_exported_at: Option<String>,
    #[serde(rename = "_postman_exported_using")]
    pub postman_exported_using: Option<String>,
}

