//! Recording commands for session capture
//!
//! This module provides Tauri commands for controlling session recording,
//! including start/stop recording, listing sessions, and exporting.

use crate::core::session_recorder::SessionRecorder;
use crate::security::generate_secure_session_id;
use crate::state::AppState;
use crate::storage::SessionInfo;
use tauri::State;

/// Start recording a new session
#[tauri::command]
pub async fn start_recording(
    state: State<'_, AppState>,
    session_name: Option<String>,
) -> Result<String, String> {
    let mut recorder_state = state.recorder.lock().await;

    if recorder_state.is_some() {
        return Err("Recording is already active".to_string());
    }

    let session_id = generate_secure_session_id();
    let name = session_name.unwrap_or_else(|| format!("Session {}", chrono_format(&session_id)));

    // Get transport type from proxy state
    let transport_type = "stdio".to_string(); // TODO: Get from actual transport

    let recorder = SessionRecorder::new(session_id.clone(), name, transport_type);

    *recorder_state = Some(recorder);

    tracing::info!("Started recording session: {}", session_id);
    Ok(session_id)
}

/// Stop recording and save the session
#[tauri::command]
pub async fn stop_recording(state: State<'_, AppState>) -> Result<String, String> {
    let mut recorder_state = state.recorder.lock().await;

    if let Some(recorder) = recorder_state.take() {
        let session = recorder
            .finalize()
            .await
            .map_err(|e| format!("Failed to finalize recording: {e}"))?;

        let session_id = session.id.clone();
        let message_count = session.messages.len();

        // Only save sessions with at least one message
        if message_count == 0 {
            tracing::warn!("Discarding empty recording session: {}", session_id);
            return Err("Cannot save empty session (no messages recorded)".to_string());
        }

        // Save to storage
        state
            .storage
            .save_session(&session)
            .await
            .map_err(|e| format!("Failed to save session: {e}"))?;

        tracing::info!(
            "Stopped and saved recording: {} ({} messages)",
            session_id,
            message_count
        );
        Ok(session_id)
    } else {
        Err("No active recording".to_string())
    }
}

/// Get current recording status
#[tauri::command]
pub async fn get_recording_status(state: State<'_, AppState>) -> Result<RecordingStatus, String> {
    let recorder_state = state.recorder.lock().await;

    if let Some(recorder) = recorder_state.as_ref() {
        let stats = recorder.get_stats().await;
        Ok(RecordingStatus {
            is_recording: true,
            session_id: Some(stats.session_id),
            message_count: stats.message_count,
            duration_seconds: stats.duration_seconds,
        })
    } else {
        Ok(RecordingStatus {
            is_recording: false,
            session_id: None,
            message_count: 0,
            duration_seconds: 0,
        })
    }
}

/// List all recorded sessions
#[tauri::command]
pub async fn list_recorded_sessions(
    state: State<'_, AppState>,
) -> Result<Vec<SessionInfo>, String> {
    state
        .storage
        .list_sessions()
        .await
        .map_err(|e| format!("Failed to list sessions: {e}"))
}

/// Load a recorded session
#[tauri::command]
pub async fn load_recorded_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<serde_json::Value, String> {
    let session = state
        .storage
        .load_session(&session_id)
        .await
        .map_err(|e| format!("Failed to load session: {e}"))?;

    serde_json::to_value(session).map_err(|e| format!("Failed to serialize session: {e}"))
}

/// Delete a recorded session
#[tauri::command]
pub async fn delete_recorded_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    state
        .storage
        .delete_session(&session_id)
        .await
        .map_err(|e| format!("Failed to delete session: {e}"))
}

/// Export a session to JSON file
#[tauri::command]
pub async fn export_session(
    state: State<'_, AppState>,
    session_id: String,
    export_path: String,
) -> Result<(), String> {
    let session = state
        .storage
        .load_session(&session_id)
        .await
        .map_err(|e| format!("Failed to load session: {e}"))?;

    let json = serde_json::to_string_pretty(&session)
        .map_err(|e| format!("Failed to serialize session: {e}"))?;

    std::fs::write(&export_path, json).map_err(|e| format!("Failed to write export file: {e}"))?;

    tracing::info!("Exported session {} to {}", session_id, export_path);
    Ok(())
}

/// Recording status for UI
#[derive(Debug, serde::Serialize)]
pub struct RecordingStatus {
    pub is_recording: bool,
    pub session_id: Option<String>,
    pub message_count: usize,
    pub duration_seconds: u64,
}

// Helper functions

fn chrono_format(session_id: &str) -> String {
    // Extract timestamp from session-{timestamp}-{random} format
    // or legacy session-{timestamp} format
    if let Some(rest) = session_id.strip_prefix("session-") {
        // Get the timestamp part (first segment after "session-")
        let ts_str = rest.split('-').next().unwrap_or(rest);
        if let Ok(ts) = ts_str.parse::<i64>() {
            // Convert timestamp to human-readable format
            // Simple implementation without chrono dependency
            let secs_per_day = 86400;
            let days = ts / secs_per_day;
            let remaining_secs = ts % secs_per_day;
            let hours = remaining_secs / 3600;
            let mins = (remaining_secs % 3600) / 60;
            let secs = remaining_secs % 60;

            // Unix epoch is 1970-01-01, calculate approximate date
            let year = 1970 + (days / 365);
            let month = ((days % 365) / 30) + 1;
            let day = ((days % 365) % 30) + 1;

            return format!("{year:04}-{month:02}-{day:02} {hours:02}:{mins:02}:{secs:02}");
        }
    }
    session_id.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recording_status_not_recording() {
        let status = RecordingStatus {
            is_recording: false,
            session_id: None,
            message_count: 0,
            duration_seconds: 0,
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"is_recording\":false"));
        assert!(json.contains("\"session_id\":null"));
        assert!(json.contains("\"message_count\":0"));
    }

    #[test]
    fn test_recording_status_active() {
        let status = RecordingStatus {
            is_recording: true,
            session_id: Some("session-123".to_string()),
            message_count: 42,
            duration_seconds: 300,
        };

        let json = serde_json::to_string(&status).unwrap();
        assert!(json.contains("\"is_recording\":true"));
        assert!(json.contains("\"session_id\":\"session-123\""));
        assert!(json.contains("\"message_count\":42"));
        assert!(json.contains("\"duration_seconds\":300"));
    }

    #[test]
    fn test_chrono_format_valid_session_id() {
        // Test with a known timestamp: 1700000000 = 2023-11-14 22:13:20 UTC
        let formatted = chrono_format("session-1700000000");

        // Should return a formatted date string
        assert!(formatted.contains("2023")); // Year
        assert!(formatted.contains(":")); // Time separator
    }

    #[test]
    fn test_chrono_format_secure_session_id() {
        // Test with new format: session-{timestamp}-{random}
        let formatted = chrono_format("session-1700000000-abcdef1234567890");

        // Should return a formatted date string (extracts timestamp)
        assert!(formatted.contains("2023")); // Year
        assert!(formatted.contains(":")); // Time separator
    }

    #[test]
    fn test_chrono_format_invalid_session_id() {
        let result = chrono_format("not-a-session-id");

        // Should return the original string
        assert_eq!(result, "not-a-session-id");
    }

    #[test]
    fn test_chrono_format_invalid_number() {
        let result = chrono_format("session-notanumber");

        // Should return the original string
        assert_eq!(result, "session-notanumber");
    }

    #[test]
    fn test_chrono_format_zero_timestamp() {
        let formatted = chrono_format("session-0");

        // Should format to Unix epoch
        assert!(formatted.contains("1970"));
    }

    #[test]
    fn test_recording_status_debug() {
        let status = RecordingStatus {
            is_recording: true,
            session_id: Some("test".to_string()),
            message_count: 10,
            duration_seconds: 60,
        };

        // Debug trait should work
        let debug_str = format!("{:?}", status);
        assert!(debug_str.contains("RecordingStatus"));
    }
}
