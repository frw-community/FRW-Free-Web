#pragma once

#include <string>
#include <vector>
#include <memory>
#include <chrono>

struct Extension {
    std::string id;
    std::string name;
    std::string version;
    std::string description;
    std::string author;
    std::string path;
    bool enabled;
    bool incognitoEnabled;
    std::vector<std::string> permissions;
    std::vector<std::string> hostPermissions;
    std::string iconPath;
    std::chrono::system_clock::time_point installTime;
    std::chrono::system_clock::time_point lastUpdateTime;
};

struct ExtensionAction {
    std::string extensionId;
    std::string title;
    std::string iconPath;
    std::string badgeText;
    std::string badgeBackgroundColor;
    bool enabled;
};

class ExtensionsManager {
public:
    static ExtensionsManager& Instance();
    
    // Extension lifecycle
    bool InstallExtension(const std::string& path);
    bool UninstallExtension(const std::string& id);
    bool EnableExtension(const std::string& id);
    bool DisableExtension(const std::string& id);
    bool ReloadExtension(const std::string& id);
    
    // Extension queries
    Extension* GetExtension(const std::string& id);
    std::vector<Extension*> GetAllExtensions();
    std::vector<Extension*> GetEnabledExtensions();
    std::vector<Extension*> GetDisabledExtensions();
    
    // Extension actions (toolbar buttons)
    std::vector<ExtensionAction> GetExtensionActions();
    bool ExecuteExtensionAction(const std::string& extensionId);
    
    // Extension permissions
    bool GrantPermissions(const std::string& id, const std::vector<std::string>& permissions);
    bool RevokePermissions(const std::string& id, const std::vector<std::string>& permissions);
    std::vector<std::string> GetGrantedPermissions(const std::string& id);
    
    // Extension storage
    bool SetExtensionStorage(const std::string& id, const std::string& key, const std::string& value);
    std::string GetExtensionStorage(const std::string& id, const std::string& key);
    bool ClearExtensionStorage(const std::string& id);
    
    // Extension messaging
    bool SendMessageToExtension(const std::string& id, const std::string& message);
    bool BroadcastMessage(const std::string& message);
    
    // Extension development
    bool LoadUnpackedExtension(const std::string& path);
    bool EnableDeveloperMode();
    bool IsDeveloperModeEnabled() const;
    
    // Extension updates
    bool CheckForUpdates();
    bool UpdateExtension(const std::string& id);
    bool UpdateAllExtensions();
    
    // FRW-specific extensions
    void InstallDefaultFRWExtensions();
    void InstallFRWDeveloperTools();
    void InstallFRWWalletExtension();
    void InstallFRWNameResolver();

private:
    ExtensionsManager() = default;
    std::vector<std::unique_ptr<Extension>> extensions_;
    bool developerMode_;
    std::string extensionsDirectory_;
    
    Extension* FindExtension(const std::string& id);
    bool LoadExtensionManifest(const std::string& path, Extension& extension);
    bool ValidateExtension(const Extension& extension);
    std::string GenerateExtensionId(const std::string& path);
    std::string GetExtensionsDirectory();
};
