use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub interface_type: String,
    pub connected: bool,
    pub speed_mbps: Option<u64>,
    pub ip_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WifiStatus {
    pub connected: bool,
    pub ssid: Option<String>,
    pub signal_strength: Option<u32>,
    pub channel: Option<u32>,
    pub band: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingResult {
    pub host: String,
    pub avg_ms: Option<f64>,
    pub min_ms: Option<f64>,
    pub max_ms: Option<f64>,
    pub packet_loss_pct: f64,
    pub success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessNetworkUsage {
    pub pid: u32,
    pub name: String,
    pub bytes_sent: u64,
    pub bytes_received: u64,
}

pub fn get_network_interfaces() -> Vec<NetworkInterface> {
    let output = std::process::Command::new("wmic")
        .args(["nic", "where", "NetConnectionStatus=2", "get", "Name,Speed,NetConnectionID"])
        .creation_flags(0x08000000)
        .output();
    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines().skip(1).filter(|l| !l.trim().is_empty()).map(|line| {
                let name = line.trim().to_string();
                let itype = if name.to_lowercase().contains("wi-fi") || name.to_lowercase().contains("wireless") {
                    "Wi-Fi"
                } else {
                    "Ethernet"
                };
                NetworkInterface {
                    name: name.clone(),
                    interface_type: itype.into(),
                    connected: true,
                    speed_mbps: None,
                    ip_address: None,
                }
            }).collect()
        }
        Err(_) => Vec::new(),
    }
}

pub fn get_wifi_status() -> WifiStatus {
    let output = std::process::Command::new("netsh")
        .args(["wlan", "show", "interfaces"])
        .creation_flags(0x08000000)
        .output();
    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            let mut ssid = None;
            let mut signal = None;
            let mut channel = None;
            let mut band = None;
            let connected = text.contains("State") && text.contains("connected");

            for line in text.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("SSID") && !trimmed.starts_with("BSSID") {
                    ssid = trimmed.split(':').nth(1).map(|s| s.trim().to_string());
                }
                if trimmed.starts_with("Signal") {
                    signal = trimmed.split(':').nth(1)
                        .and_then(|s| s.trim().trim_end_matches('%').parse().ok());
                }
                if trimmed.starts_with("Channel") {
                    channel = trimmed.split(':').nth(1)
                        .and_then(|s| s.trim().parse().ok());
                }
                if trimmed.starts_with("Radio type") {
                    band = trimmed.split(':').nth(1).map(|s| s.trim().to_string());
                }
            }

            WifiStatus { connected, ssid, signal_strength: signal, channel, band }
        }
        Err(_) => WifiStatus { connected: false, ssid: None, signal_strength: None, channel: None, band: None },
    }
}

pub fn run_ping_test(host: &str) -> PingResult {
    let output = std::process::Command::new("ping")
        .args(["-n", "4", host])
        .creation_flags(0x08000000)
        .output();
    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            let mut avg = None;
            let mut min = None;
            let mut max = None;
            let mut loss = 0.0;

            for line in text.lines() {
                if line.contains("Average") || line.contains("Minimum") {
                    let parts: Vec<&str> = line.split(',').collect();
                    for part in &parts {
                        if part.contains("Minimum") {
                            min = part.split('=').last().and_then(|s| s.trim().trim_end_matches("ms").parse().ok());
                        }
                        if part.contains("Maximum") {
                            max = part.split('=').last().and_then(|s| s.trim().trim_end_matches("ms").parse().ok());
                        }
                        if part.contains("Average") {
                            avg = part.split('=').last().and_then(|s| s.trim().trim_end_matches("ms").parse().ok());
                        }
                    }
                }
                if line.contains("loss") {
                    if let Some(pct) = line.split('(').nth(1) {
                        loss = pct.trim_end_matches(')').trim_end_matches("% loss").parse().unwrap_or(0.0);
                    }
                }
            }

            PingResult {
                host: host.into(),
                avg_ms: avg,
                min_ms: min,
                max_ms: max,
                packet_loss_pct: loss,
                success: avg.is_some(),
            }
        }
        Err(_) => PingResult {
            host: host.into(),
            avg_ms: None,
            min_ms: None,
            max_ms: None,
            packet_loss_pct: 100.0,
            success: false,
        },
    }
}
