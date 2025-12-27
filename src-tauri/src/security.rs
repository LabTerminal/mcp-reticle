//! Security utilities for the Reticle application
//!
//! This module provides security-related functionality including:
//! - Cryptographically secure session ID generation
//! - Command validation helpers

/// Generate a cryptographically secure session ID
///
/// The ID format is: `session-{timestamp}-{random_hex}`
/// - timestamp: Unix timestamp in seconds for ordering and debugging
/// - random_hex: 16 bytes (128 bits) of cryptographic randomness
///
/// This provides both human-readable ordering (via timestamp) and
/// cryptographic unpredictability (via random suffix).
pub fn generate_secure_session_id() -> String {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // Generate 16 bytes of cryptographic randomness
    let mut random_bytes = [0u8; 16];
    if let Err(e) = getrandom::getrandom(&mut random_bytes) {
        // Fallback to timestamp-only if getrandom fails (extremely rare)
        tracing::warn!("Failed to generate random bytes for session ID: {e}");
        return format!("session-{timestamp}");
    }

    let random_hex = hex::encode(random_bytes);
    format!("session-{timestamp}-{random_hex}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_secure_session_id_format() {
        let id = generate_secure_session_id();

        // Should start with "session-"
        assert!(id.starts_with("session-"));

        // Should have three parts: "session", timestamp, random
        let parts: Vec<&str> = id.split('-').collect();
        assert!(parts.len() >= 3, "Expected at least 3 parts in session ID");

        // Timestamp should be a valid number
        let timestamp = parts[1].parse::<u64>();
        assert!(timestamp.is_ok(), "Timestamp should be a valid number");

        // Random part should be 32 hex chars (16 bytes)
        let random_part = parts[2..].join("-");
        assert_eq!(random_part.len(), 32, "Random part should be 32 hex chars");

        // All chars in random part should be valid hex
        assert!(
            random_part.chars().all(|c| c.is_ascii_hexdigit()),
            "Random part should contain only hex chars"
        );
    }

    #[test]
    fn test_generate_secure_session_id_unique() {
        let id1 = generate_secure_session_id();
        let id2 = generate_secure_session_id();

        assert_ne!(id1, id2, "Session IDs should be unique");
    }

    #[test]
    fn test_generate_secure_session_id_entropy() {
        // Generate 100 IDs and verify they're all unique
        let mut ids = std::collections::HashSet::new();
        for _ in 0..100 {
            let id = generate_secure_session_id();
            assert!(ids.insert(id), "Duplicate session ID generated");
        }
    }
}
