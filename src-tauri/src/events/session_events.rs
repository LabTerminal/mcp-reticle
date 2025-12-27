use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::error::{AppError, Result};

/// Session start event sent to frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStartEvent {
    pub id: String,
    pub name: String,
    pub started_at: u64,
}

/// Emit a session-start event to the frontend
pub fn emit_session_start(app_handle: &AppHandle, event: SessionStartEvent) -> Result<()> {
    app_handle
        .emit("session-start", event)
        .map_err(|e| AppError::EventEmissionFailed(e.to_string()))
}
