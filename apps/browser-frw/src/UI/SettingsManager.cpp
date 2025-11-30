#include "SettingsManager.h"
#include "../Utils.h"
#include <fstream>
#include <sstream>
#include <algorithm>
#include <locale>
#include <codecvt>
#include <filesystem>

#ifdef _WIN32
#include <windows.h>
#include <shlobj.h>
#endif

// Helper function to convert string to wstring
std::wstring StringToWString(const std::string& str) {
    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
    return converter.from_bytes(str);
}

SettingsManager& SettingsManager::Instance() {
    static SettingsManager instance;
    return instance;
}

bool SettingsManager::LoadSettings() {
    std::string filePath = GetSettingsFilePath();
    std::ifstream file(filePath);
    
    if (!file.is_open()) {
        InitializeDefaults();
        return SaveSettings();
    }
    
    try {
        std::string line;
        while (std::getline(file, line)) {
            size_t pos = line.find('=');
            if (pos != std::string::npos) {
                std::string key = line.substr(0, pos);
                std::string value = line.substr(pos + 1);
                
                // Parse different setting types
                if (key == "bootstrap_nodes") {
                    settings_.bootstrapNodes = ParseStringList(value);
                } else if (key == "ipfs_gateways") {
                    settings_.ipfsGateways = ParseStringList(value);
                } else if (key == "use_local_ipfs") {
                    settings_.useLocalIPFS = (value == "true");
                } else if (key == "local_ipfs_api") {
                    settings_.localIPFSApi = value;
                } else if (key == "theme") {
                    settings_.theme = value;
                } else if (key == "font_size") {
                    settings_.fontSize = std::stoi(value);
                } else if (key == "show_bookmarks_bar") {
                    settings_.showBookmarksBar = (value == "true");
                } else if (key == "show_status_bar") {
                    settings_.showStatusBar = (value == "true");
                } else if (key == "enable_javascript") {
                    settings_.enableJavaScript = (value == "true");
                } else if (key == "enable_cookies") {
                    settings_.enableCookies = (value == "true");
                } else if (key == "clear_data_on_exit") {
                    settings_.clearDataOnExit = (value == "true");
                } else if (key == "enable_remote_debugging") {
                    settings_.enableRemoteDebugging = (value == "true");
                } else if (key == "remote_debugging_port") {
                    settings_.remoteDebuggingPort = std::stoi(value);
                } else if (key == "user_agent") {
                    settings_.userAgent = value;
                }
            }
        }
        file.close();
        return true;
    } catch (...) {
        InitializeDefaults();
        return false;
    }
}

bool SettingsManager::SaveSettings() {
    std::string filePath = GetSettingsFilePath();
    std::ofstream file(filePath);
    
    if (!file.is_open()) {
        return false;
    }
    
    file << "bootstrap_nodes=" << JoinStringList(settings_.bootstrapNodes) << "\n";
    file << "ipfs_gateways=" << JoinStringList(settings_.ipfsGateways) << "\n";
    file << "use_local_ipfs=" << (settings_.useLocalIPFS ? "true" : "false") << "\n";
    file << "local_ipfs_api=" << settings_.localIPFSApi << "\n";
    file << "theme=" << settings_.theme << "\n";
    file << "font_size=" << settings_.fontSize << "\n";
    file << "show_bookmarks_bar=" << (settings_.showBookmarksBar ? "true" : "false") << "\n";
    file << "show_status_bar=" << (settings_.showStatusBar ? "true" : "false") << "\n";
    file << "enable_javascript=" << (settings_.enableJavaScript ? "true" : "false") << "\n";
    file << "enable_cookies=" << (settings_.enableCookies ? "true" : "false") << "\n";
    file << "clear_data_on_exit=" << (settings_.clearDataOnExit ? "true" : "false") << "\n";
    file << "enable_remote_debugging=" << (settings_.enableRemoteDebugging ? "true" : "false") << "\n";
    file << "remote_debugging_port=" << settings_.remoteDebuggingPort << "\n";
    file << "user_agent=" << settings_.userAgent << "\n";
    
    file.close();
    return true;
}

void SettingsManager::SetSettings(const Settings& newSettings) {
    settings_ = newSettings;
    SaveSettings();
}

std::vector<std::string> SettingsManager::GetBootstrapNodes() const {
    return settings_.bootstrapNodes;
}

void SettingsManager::SetBootstrapNodes(const std::vector<std::string>& nodes) {
    settings_.bootstrapNodes = nodes;
    SaveSettings();
}

std::vector<std::string> SettingsManager::GetIPFSGateways() const {
    return settings_.ipfsGateways;
}

void SettingsManager::SetIPFSGateways(const std::vector<std::string>& gateways) {
    settings_.ipfsGateways = gateways;
    SaveSettings();
}

bool SettingsManager::GetUseLocalIPFS() const {
    return settings_.useLocalIPFS;
}

void SettingsManager::SetUseLocalIPFS(bool use) {
    settings_.useLocalIPFS = use;
    SaveSettings();
}

std::string SettingsManager::GetTheme() const {
    return settings_.theme;
}

void SettingsManager::SetTheme(const std::string& theme) {
    settings_.theme = theme;
    SaveSettings();
}

void SettingsManager::ResetToDefaults() {
    InitializeDefaults();
    SaveSettings();
}

void SettingsManager::InitializeDefaults() {
    // Default bootstrap nodes
    settings_.bootstrapNodes = {
        "http://localhost:3100",
        "http://83.228.214.189:3100",
        "http://83.228.213.45:3100",
        "http://83.228.213.240:3100",
        "http://83.228.214.72:3100",
        "http://155.117.46.244:3100",
        "http://165.73.244.107:3100",
        "http://165.73.244.74:3100"
    };
    
    // Default IPFS gateways
    settings_.ipfsGateways = {
        "http://localhost:8080",
        "https://ipfs.io",
        "https://cloudflare-ipfs.com",
        "https://dweb.link",
        "https://ipfs.fleek.co"
    };
    
    // Default settings
    settings_.useLocalIPFS = false;
    settings_.localIPFSApi = "http://localhost:5001";
    settings_.theme = "default";
    settings_.fontSize = 14;
    settings_.showBookmarksBar = true;
    settings_.showStatusBar = true;
    settings_.enableJavaScript = true;
    settings_.enableCookies = true;
    settings_.clearDataOnExit = false;
    settings_.enableRemoteDebugging = false;
    settings_.remoteDebuggingPort = 9222;
    settings_.userAgent = "FRW Browser/1.0 (Windows)";
}

std::string SettingsManager::GetSettingsFilePath() const {
    std::string appDataDir;
#ifdef _WIN32
    wchar_t* path = nullptr;
    if (SUCCEEDED(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &path))) {
        appDataDir = Utils::WStringToString(std::wstring(path, wcslen(path)));
        CoTaskMemFree(path);
    }
    std::replace(appDataDir.begin(), appDataDir.end(), '\\', '/');
#else
    appDataDir = std::getenv("HOME") ? std::getenv("HOME") : "";
#endif
    
    return appDataDir + "/FRW Browser/settings.ini";
}

std::vector<std::string> SettingsManager::ParseStringList(const std::string& str) const {
    std::vector<std::string> result;
    std::stringstream ss(str);
    std::string item;
    
    while (std::getline(ss, item, ',')) {
        // Trim whitespace
        item.erase(0, item.find_first_not_of(" \t"));
        item.erase(item.find_last_not_of(" \t") + 1);
        if (!item.empty()) {
            result.push_back(item);
        }
    }
    
    return result;
}

std::string SettingsManager::JoinStringList(const std::vector<std::string>& list) const {
    std::string result;
    for (size_t i = 0; i < list.size(); ++i) {
        if (i > 0) result += ", ";
        result += list[i];
    }
    return result;
}
