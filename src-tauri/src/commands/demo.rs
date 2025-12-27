use std::sync::Arc;
use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::config::AppConfig;
use crate::core::session_recorder::{MessageDirection, SessionRecorder};
use crate::error::Result;
use crate::events::{emit_log_event, emit_session_start};
use crate::mock_data::MockData;
use crate::state::ProxyState;

/// Load and emit pre-generated demo data
pub async fn load_demo_data(
    app_handle: AppHandle,
    proxy_state: Arc<Mutex<ProxyState>>,
    config: AppConfig,
    recorder: Arc<Mutex<Option<SessionRecorder>>>,
) -> Result<()> {
    let mock_data = MockData::generate();

    println!(
        "Starting demo data load - {} messages",
        mock_data.logs.len()
    );

    // Emit session start event
    emit_session_start(&app_handle, mock_data.session.clone())?;
    println!("Emitted session-start event");

    // Small delay to ensure session is registered
    tokio::time::sleep(tokio::time::Duration::from_millis(
        config.demo.startup_delay_ms,
    ))
    .await;

    let log_count = mock_data.logs.len();

    // Emit all logs with configured delay
    for (idx, log) in mock_data.logs.into_iter().enumerate() {
        // Check if demo has been stopped
        {
            let state = proxy_state.lock().await;
            if !state.is_running() {
                println!("Demo stopped by user at message {idx}");
                return Ok(());
            }
        }

        // Emit log event
        emit_log_event(&app_handle, log.clone())?;

        // Record message if recording is active
        // Clone the recorder to avoid holding lock across await
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&log.content) {
            let recorder_clone = {
                let recorder_lock = recorder.lock().await;
                recorder_lock.clone()
            };

            if let Some(rec) = recorder_clone {
                // Determine direction based on log direction string
                let direction = match log.direction.as_str() {
                    "in" => MessageDirection::ToServer,
                    "out" => MessageDirection::ToClient,
                    _ => MessageDirection::ToClient, // Default to client
                };

                if let Err(e) = rec.record_message(json, direction).await {
                    eprintln!("Failed to record demo message: {e}");
                }
            }
        }

        // Delay between messages
        tokio::time::sleep(tokio::time::Duration::from_millis(
            config.demo.message_delay_ms,
        ))
        .await;

        // Progress logging
        if idx % config.demo.progress_batch_size == 0 {
            println!("Emitted {idx} / {log_count} messages");
        }
    }

    println!("Finished loading demo data - {log_count} messages");
    Ok(())
}
