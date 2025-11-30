#pragma once

#include <string>
#include <vector>
#include <map>

struct Settings {
    // Network settings
    std::vector<std::string> bootstrapNodes;
    std::vector<std::string> ipfsGateways;
    bool useLocalIPFS;
    std::string localIPFSApi;
    
    // UI settings
    std::string theme;
    int fontSize;
    bool showBookmarksBar;
    bool showStatusBar;
    
    // Privacy settings
    bool enableJavaScript;
    bool enableCookies;
    bool clearDataOnExit;
    
    // Advanced settings
    bool enableRemoteDebugging;
    int remoteDebuggingPort;
    std::string userAgent;
};

class SettingsManager {
public:
    static SettingsManager& Instance();
    
    // Load/save settings
    bool LoadSettings();
    bool SaveSettings();
    
    // Get/set settings
    const Settings& GetSettings() const { return settings_; }
    void SetSettings(const Settings& newSettings);
    
    // Individual settings
    std::vector<std::string> GetBootstrapNodes() const;
    void SetBootstrapNodes(const std::vector<std::string>& nodes);
    
    std::vector<std::string> GetIPFSGateways() const;
    void SetIPFSGateways(const std::vector<std::string>& gateways);
    
    bool GetUseLocalIPFS() const;
    void SetUseLocalIPFS(bool use);
    
    std::string GetTheme() const;
    void SetTheme(const std::string& theme);
    
    // Reset to defaults
    void ResetToDefaults();

private:
    SettingsManager() = default;
    Settings settings_;
    std::string settingsFile_;
    
    void InitializeDefaults();
    std::string GetSettingsFilePath() const;
    
    // Helper methods for string list parsing/joining
    std::vector<std::string> ParseStringList(const std::string& str) const;
    std::string JoinStringList(const std::vector<std::string>& list) const;
};
