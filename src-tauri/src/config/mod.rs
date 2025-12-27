//! Application configuration
//!
//! This module defines configuration types and default values:
//! - `app_config`: Configuration structure
//! - `defaults`: Default configuration values

pub mod app_config;
pub mod defaults;

// Re-export configuration types
pub use app_config::AppConfig;

// SecurityConfig is part of the public API for external configuration
#[allow(unused_imports)]
pub use app_config::SecurityConfig;
