#include "PrivacyManager.h"
#include "SettingsManager.h"
#include <fstream>
#include <sstream>
#include <algorithm>
#include <filesystem>

#ifdef _WIN32
#include <windows.h>
#include <shlobj.h>
#endif

PrivacyManager& PrivacyManager::Instance() {
    static PrivacyManager instance;
    return instance;
}

void PrivacyManager::SetSettings(const PrivacySettings& settings) {
    settings_ = settings;
    SaveSettings();
}

void PrivacyManager::ResetToDefaults() {
    InitializeDefaults();
    SaveSettings();
}

void PrivacyManager::SetCookiePolicy(CookiePolicy policy) {
    settings_.cookiePolicy = policy;
    SaveSettings();
}

CookiePolicy PrivacyManager::GetCookiePolicy() const {
    return settings_.cookiePolicy;
}

void PrivacyManager::AllowCookie(const std::string& domain) {
    // Remove from blocked list if present
    auto it = std::find(settings_.blockedCookies.begin(), settings_.blockedCookies.end(), domain);
    if (it != settings_.blockedCookies.end()) {
        settings_.blockedCookies.erase(it);
    }
    
    // Add to allowed list if not present
    if (std::find(settings_.allowedCookies.begin(), settings_.allowedCookies.end(), domain) == settings_.allowedCookies.end()) {
        settings_.allowedCookies.push_back(domain);
    }
    
    SaveSettings();
}

void PrivacyManager::BlockCookie(const std::string& domain) {
    // Remove from allowed list if present
    auto it = std::find(settings_.allowedCookies.begin(), settings_.allowedCookies.end(), domain);
    if (it != settings_.allowedCookies.end()) {
        settings_.allowedCookies.erase(it);
    }
    
    // Add to blocked list if not present
    if (std::find(settings_.blockedCookies.begin(), settings_.blockedCookies.end(), domain) == settings_.blockedCookies.end()) {
        settings_.blockedCookies.push_back(domain);
    }
    
    SaveSettings();
}

void PrivacyManager::ClearAllCookies() {
    // TODO: Clear all cookies via CEF
}

void PrivacyManager::ClearCookiesForDomain(const std::string& domain) {
    // TODO: Clear cookies for specific domain via CEF
}

void PrivacyManager::SetTrackingProtection(TrackingProtection level) {
    settings_.trackingProtection = level;
    SaveSettings();
}

TrackingProtection PrivacyManager::GetTrackingProtection() const {
    return settings_.trackingProtection;
}

void PrivacyManager::AllowTracker(const std::string& tracker) {
    // Remove from blocked list if present
    auto it = std::find(settings_.blockedTrackers.begin(), settings_.blockedTrackers.end(), tracker);
    if (it != settings_.blockedTrackers.end()) {
        settings_.blockedTrackers.erase(it);
    }
    
    // Add to allowed list if not present
    if (std::find(settings_.allowedTrackers.begin(), settings_.allowedTrackers.end(), tracker) == settings_.allowedTrackers.end()) {
        settings_.allowedTrackers.push_back(tracker);
    }
    
    SaveSettings();
}

void PrivacyManager::BlockTracker(const std::string& tracker) {
    // Remove from allowed list if present
    auto it = std::find(settings_.allowedTrackers.begin(), settings_.allowedTrackers.end(), tracker);
    if (it != settings_.allowedTrackers.end()) {
        settings_.allowedTrackers.erase(it);
    }
    
    // Add to blocked list if not present
    if (std::find(settings_.blockedTrackers.begin(), settings_.blockedTrackers.end(), tracker) == settings_.blockedTrackers.end()) {
        settings_.blockedTrackers.push_back(tracker);
    }
    
    SaveSettings();
}

bool PrivacyManager::IsTrackerBlocked(const std::string& tracker) const {
    if (settings_.trackingProtection == TrackingProtection::Off) {
        return false;
    }
    
    if (settings_.trackingProtection == TrackingProtection::Strict) {
        return true;
    }
    
    // Standard protection - check blocked list
    return std::find(settings_.blockedTrackers.begin(), settings_.blockedTrackers.end(), tracker) != settings_.blockedTrackers.end();
}

void PrivacyManager::ClearBrowsingData(bool history, bool cookies, bool cache, bool formData, bool passwords) {
    if (history) {
        // TODO: Clear browsing history
    }
    
    if (cookies) {
        ClearAllCookies();
    }
    
    if (cache) {
        // TODO: Clear cache via CEF
    }
    
    if (formData) {
        // TODO: Clear form data via CEF
    }
    
    if (passwords) {
        // TODO: Clear passwords via CEF
    }
}

void PrivacyManager::ClearDataOnExit() {
    if (settings_.clearHistoryOnExit) {
        // TODO: Clear history
    }
    
    if (settings_.clearCookiesOnExit) {
        ClearAllCookies();
    }
    
    if (settings_.clearCacheOnExit) {
        // TODO: Clear cache
    }
    
    if (settings_.clearFormDataOnExit) {
        // TODO: Clear form data
    }
    
    if (settings_.clearPasswordsOnExit) {
        // TODO: Clear passwords
    }
}

bool PrivacyManager::ShouldAllowCookie(const std::string& domain, bool isThirdParty) const {
    switch (settings_.cookiePolicy) {
        case CookiePolicy::AllowAll:
            return true;
            
        case CookiePolicy::BlockAll:
            return false;
            
        case CookiePolicy::BlockThirdParty:
            if (isThirdParty) {
                return false;
            }
            break;
    }
    
    // Check explicit allow/block lists
    if (std::find(settings_.blockedCookies.begin(), settings_.blockedCookies.end(), domain) != settings_.blockedCookies.end()) {
        return false;
    }
    
    if (std::find(settings_.allowedCookies.begin(), settings_.allowedCookies.end(), domain) != settings_.allowedCookies.end()) {
        return true;
    }
    
    // Default behavior based on policy
    return settings_.cookiePolicy != CookiePolicy::BlockAll;
}

bool PrivacyManager::ShouldBlockTracker(const std::string& tracker) const {
    return IsTrackerBlocked(tracker);
}

bool PrivacyManager::ShouldBlockPopup() const {
    return settings_.blockPopups;
}

bool PrivacyManager::IsSafeBrowsingEnabled() const {
    return settings_.enableSafeBrowsing;
}

void PrivacyManager::SetSendDoNotTrack(bool send) {
    settings_.sendDoNotTrack = send;
    SaveSettings();
}

bool PrivacyManager::GetSendDoNotTrack() const {
    return settings_.sendDoNotTrack;
}

bool PrivacyManager::IsIncognitoMode() const {
    return incognitoMode_;
}

void PrivacyManager::SetIncognitoMode(bool incognito) {
    incognitoMode_ = incognito;
}

std::vector<std::string> PrivacyManager::GetBlockedTrackers() const {
    return settings_.blockedTrackers;
}

std::vector<std::string> PrivacyManager::GetAllowedTrackers() const {
    return settings_.allowedTrackers;
}

std::vector<std::string> PrivacyManager::GetBlockedCookies() const {
    return settings_.blockedCookies;
}

std::vector<std::string> PrivacyManager::GetAllowedCookies() const {
    return settings_.allowedCookies;
}

void PrivacyManager::GeneratePrivacyReport() {
    // TODO: Generate comprehensive privacy report
}

void PrivacyManager::ExportPrivacySettings(const std::string& filePath) {
    std::ofstream file(filePath);
    if (!file.is_open()) {
        return;
    }
    
    file << "[Privacy Settings]\n";
    file << "CookiePolicy=" << static_cast<int>(settings_.cookiePolicy) << "\n";
    file << "TrackingProtection=" << static_cast<int>(settings_.trackingProtection) << "\n";
    file << "SendDoNotTrack=" << (settings_.sendDoNotTrack ? "true" : "false") << "\n";
    file << "ClearHistoryOnExit=" << (settings_.clearHistoryOnExit ? "true" : "false") << "\n";
    file << "ClearCookiesOnExit=" << (settings_.clearCookiesOnExit ? "true" : "false") << "\n";
    file << "ClearCacheOnExit=" << (settings_.clearCacheOnExit ? "true" : "false") << "\n";
    file << "ClearFormDataOnExit=" << (settings_.clearFormDataOnExit ? "true" : "false") << "\n";
    file << "ClearPasswordsOnExit=" << (settings_.clearPasswordsOnExit ? "true" : "false") << "\n";
    file << "BlockPopups=" << (settings_.blockPopups ? "true" : "false") << "\n";
    file << "BlockMaliciousContent=" << (settings_.blockMaliciousContent ? "true" : "false") << "\n";
    file << "WarnOnMaliciousContent=" << (settings_.warnOnMaliciousContent ? "true" : "false") << "\n";
    file << "EnableSafeBrowsing=" << (settings_.enableSafeBrowsing ? "true" : "false") << "\n";
    
    file << "\n[Allowed Cookies]\n";
    for (const auto& cookie : settings_.allowedCookies) {
        file << cookie << "\n";
    }
    
    file << "\n[Blocked Cookies]\n";
    for (const auto& cookie : settings_.blockedCookies) {
        file << cookie << "\n";
    }
    
    file << "\n[Allowed Trackers]\n";
    for (const auto& tracker : settings_.allowedTrackers) {
        file << tracker << "\n";
    }
    
    file << "\n[Blocked Trackers]\n";
    for (const auto& tracker : settings_.blockedTrackers) {
        file << tracker << "\n";
    }
    
    file.close();
}

void PrivacyManager::ImportPrivacySettings(const std::string& filePath) {
    std::ifstream file(filePath);
    if (!file.is_open()) {
        return;
    }
    
    std::string line;
    std::string section;
    
    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') {
            continue;
        }
        
        if (line[0] == '[' && line.back() == ']') {
            section = line.substr(1, line.length() - 2);
            continue;
        }
        
        size_t pos = line.find('=');
        if (pos != std::string::npos) {
            std::string key = line.substr(0, pos);
            std::string value = line.substr(pos + 1);
            
            if (section == "Privacy Settings") {
                if (key == "CookiePolicy") {
                    settings_.cookiePolicy = static_cast<CookiePolicy>(std::stoi(value));
                } else if (key == "TrackingProtection") {
                    settings_.trackingProtection = static_cast<TrackingProtection>(std::stoi(value));
                } else if (key == "SendDoNotTrack") {
                    settings_.sendDoNotTrack = (value == "true");
                } else if (key == "ClearHistoryOnExit") {
                    settings_.clearHistoryOnExit = (value == "true");
                } else if (key == "ClearCookiesOnExit") {
                    settings_.clearCookiesOnExit = (value == "true");
                } else if (key == "ClearCacheOnExit") {
                    settings_.clearCacheOnExit = (value == "true");
                } else if (key == "ClearFormDataOnExit") {
                    settings_.clearFormDataOnExit = (value == "true");
                } else if (key == "ClearPasswordsOnExit") {
                    settings_.clearPasswordsOnExit = (value == "true");
                } else if (key == "BlockPopups") {
                    settings_.blockPopups = (value == "true");
                } else if (key == "BlockMaliciousContent") {
                    settings_.blockMaliciousContent = (value == "true");
                } else if (key == "WarnOnMaliciousContent") {
                    settings_.warnOnMaliciousContent = (value == "true");
                } else if (key == "EnableSafeBrowsing") {
                    settings_.enableSafeBrowsing = (value == "true");
                }
            } else if (section == "Allowed Cookies") {
                settings_.allowedCookies.push_back(value);
            } else if (section == "Blocked Cookies") {
                settings_.blockedCookies.push_back(value);
            } else if (section == "Allowed Trackers") {
                settings_.allowedTrackers.push_back(value);
            } else if (section == "Blocked Trackers") {
                settings_.blockedTrackers.push_back(value);
            }
        }
    }
    
    file.close();
    SaveSettings();
}

void PrivacyManager::InitializeDefaults() {
    settings_.cookiePolicy = CookiePolicy::BlockThirdParty;
    settings_.trackingProtection = TrackingProtection::Standard;
    settings_.sendDoNotTrack = false;
    settings_.clearHistoryOnExit = false;
    settings_.clearCookiesOnExit = false;
    settings_.clearCacheOnExit = false;
    settings_.clearFormDataOnExit = false;
    settings_.clearPasswordsOnExit = false;
    settings_.blockPopups = true;
    settings_.blockMaliciousContent = true;
    settings_.warnOnMaliciousContent = true;
    settings_.enableSafeBrowsing = true;
    
    // Default known trackers
    settings_.blockedTrackers = {
        "google-analytics.com",
        "doubleclick.net",
        "facebook.com",
        "connect.facebook.net",
        "googleadservices.com",
        "googletagmanager.com",
        "googlesyndication.com"
    };
    
    incognitoMode_ = false;
}

void PrivacyManager::SaveSettings() {
    // Save to main settings file
    auto& mainSettings = SettingsManager::Instance();
    // TODO: Save privacy settings to main settings
}

void PrivacyManager::LoadSettings() {
    // Load from main settings file
    auto& mainSettings = SettingsManager::Instance();
    // TODO: Load privacy settings from main settings
}

bool PrivacyManager::IsThirdPartyCookie(const std::string& domain, const std::string& currentDomain) const {
    return domain != currentDomain;
}

bool PrivacyManager::IsKnownTracker(const std::string& domain) const {
    return std::find(settings_.blockedTrackers.begin(), settings_.blockedTrackers.end(), domain) != settings_.blockedTrackers.end();
}
