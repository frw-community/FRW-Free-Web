#pragma once

#include <string>
#include <vector>
#include <chrono>

enum class CookiePolicy {
    AllowAll,
    BlockThirdParty,
    BlockAll
};

enum class TrackingProtection {
    Off,
    Standard,
    Strict
};

struct PrivacySettings {
    CookiePolicy cookiePolicy;
    TrackingProtection trackingProtection;
    bool sendDoNotTrack;
    bool clearHistoryOnExit;
    bool clearCookiesOnExit;
    bool clearCacheOnExit;
    bool clearFormDataOnExit;
    bool clearPasswordsOnExit;
    bool blockPopups;
    bool blockMaliciousContent;
    bool warnOnMaliciousContent;
    bool enableSafeBrowsing;
    std::vector<std::string> allowedCookies;
    std::vector<std::string> blockedCookies;
    std::vector<std::string> allowedTrackers;
    std::vector<std::string> blockedTrackers;
};

class PrivacyManager {
public:
    static PrivacyManager& Instance();
    
    // Privacy settings management
    const PrivacySettings& GetSettings() const { return settings_; }
    void SetSettings(const PrivacySettings& settings);
    void ResetToDefaults();
    
    // Cookie management
    void SetCookiePolicy(CookiePolicy policy);
    CookiePolicy GetCookiePolicy() const;
    void AllowCookie(const std::string& domain);
    void BlockCookie(const std::string& domain);
    void ClearAllCookies();
    void ClearCookiesForDomain(const std::string& domain);
    
    // Tracking protection
    void SetTrackingProtection(TrackingProtection level);
    TrackingProtection GetTrackingProtection() const;
    void AllowTracker(const std::string& tracker);
    void BlockTracker(const std::string& tracker);
    bool IsTrackerBlocked(const std::string& tracker) const;
    
    // Data clearing
    void ClearBrowsingData(bool history, bool cookies, bool cache, bool formData, bool passwords);
    void ClearDataOnExit();
    
    // Privacy checks
    bool ShouldAllowCookie(const std::string& domain, bool isThirdParty) const;
    bool ShouldBlockTracker(const std::string& tracker) const;
    bool ShouldBlockPopup() const;
    bool IsSafeBrowsingEnabled() const;
    
    // Do Not Track
    void SetSendDoNotTrack(bool send);
    bool GetSendDoNotTrack() const;
    
    // Incognito mode
    bool IsIncognitoMode() const;
    void SetIncognitoMode(bool incognito);
    
    // Privacy reporting
    std::vector<std::string> GetBlockedTrackers() const;
    std::vector<std::string> GetAllowedTrackers() const;
    std::vector<std::string> GetBlockedCookies() const;
    std::vector<std::string> GetAllowedCookies() const;
    
    // Privacy dashboard
    void GeneratePrivacyReport();
    void ExportPrivacySettings(const std::string& filePath);
    void ImportPrivacySettings(const std::string& filePath);
    
    // Settings management
    void LoadSettings();

private:
    PrivacyManager() { InitializeDefaults(); }
    PrivacySettings settings_;
    bool incognitoMode_;
    
    void InitializeDefaults();
    void SaveSettings();
    
    bool IsThirdPartyCookie(const std::string& domain, const std::string& currentDomain) const;
    bool IsKnownTracker(const std::string& domain) const;
};
