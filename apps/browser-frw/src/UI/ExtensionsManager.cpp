#include "ExtensionsManager.h"
#include "../Utils.h"
#include "SettingsManager.h"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <regex>
#include <random>
#include <chrono>
#include <locale>
#include <codecvt>

#ifdef _WIN32
#include <windows.h>
#include <shlobj.h>
#endif

ExtensionsManager& ExtensionsManager::Instance() {
    static ExtensionsManager instance;
    return instance;
}

bool ExtensionsManager::InstallExtension(const std::string& path) {
    // Validate extension path
    if (!std::filesystem::exists(path)) {
        return false;
    }
    
    // Load and validate manifest
    Extension extension;
    if (!LoadExtensionManifest(path, extension)) {
        return false;
    }
    
    // Generate extension ID
    extension.id = GenerateExtensionId(path);
    extension.path = path;
    extension.enabled = true;
    extension.installTime = std::chrono::system_clock::now();
    
    // Check if extension already exists
    if (FindExtension(extension.id) != nullptr) {
        return false;
    }
    
    // Validate extension
    if (!ValidateExtension(extension)) {
        return false;
    }
    
    // Add extension
    extensions_.push_back(std::make_unique<Extension>(extension));
    
    return true;
}

bool ExtensionsManager::UninstallExtension(const std::string& id) {
    auto it = std::find_if(extensions_.begin(), extensions_.end(),
                          [&id](const auto& ext) { return ext->id == id; });
    
    if (it != extensions_.end()) {
        // Remove extension storage
        ClearExtensionStorage(id);
        
        // Remove extension
        extensions_.erase(it);
        return true;
    }
    
    return false;
}

bool ExtensionsManager::EnableExtension(const std::string& id) {
    Extension* extension = FindExtension(id);
    if (extension) {
        extension->enabled = true;
        return true;
    }
    return false;
}

bool ExtensionsManager::DisableExtension(const std::string& id) {
    Extension* extension = FindExtension(id);
    if (extension) {
        extension->enabled = false;
        return true;
    }
    return false;
}

bool ExtensionsManager::ReloadExtension(const std::string& id) {
    Extension* extension = FindExtension(id);
    if (extension) {
        std::string path = extension->path;
        UninstallExtension(id);
        return InstallExtension(path);
    }
    return false;
}

Extension* ExtensionsManager::GetExtension(const std::string& id) {
    return FindExtension(id);
}

std::vector<Extension*> ExtensionsManager::GetAllExtensions() {
    std::vector<Extension*> result;
    for (const auto& extension : extensions_) {
        result.push_back(extension.get());
    }
    return result;
}

std::vector<Extension*> ExtensionsManager::GetEnabledExtensions() {
    std::vector<Extension*> result;
    for (const auto& extension : extensions_) {
        if (extension->enabled) {
            result.push_back(extension.get());
        }
    }
    return result;
}

std::vector<Extension*> ExtensionsManager::GetDisabledExtensions() {
    std::vector<Extension*> result;
    for (const auto& extension : extensions_) {
        if (!extension->enabled) {
            result.push_back(extension.get());
        }
    }
    return result;
}

std::vector<ExtensionAction> ExtensionsManager::GetExtensionActions() {
    std::vector<ExtensionAction> actions;
    
    for (const auto& extension : extensions_) {
        if (extension->enabled) {
            // TODO: Check if extension has action (browser action)
            ExtensionAction action;
            action.extensionId = extension->id;
            action.title = extension->name;
            action.enabled = true;
            actions.push_back(action);
        }
    }
    
    return actions;
}

bool ExtensionsManager::ExecuteExtensionAction(const std::string& extensionId) {
    Extension* extension = FindExtension(extensionId);
    if (extension && extension->enabled) {
        // TODO: Send message to extension
        return true;
    }
    return false;
}

bool ExtensionsManager::GrantPermissions(const std::string& id, const std::vector<std::string>& permissions) {
    Extension* extension = FindExtension(id);
    if (extension) {
        for (const auto& permission : permissions) {
            if (std::find(extension->permissions.begin(), extension->permissions.end(), permission) == extension->permissions.end()) {
                extension->permissions.push_back(permission);
            }
        }
        return true;
    }
    return false;
}

bool ExtensionsManager::RevokePermissions(const std::string& id, const std::vector<std::string>& permissions) {
    Extension* extension = FindExtension(id);
    if (extension) {
        for (const auto& permission : permissions) {
            extension->permissions.erase(
                std::remove(extension->permissions.begin(), extension->permissions.end(), permission),
                extension->permissions.end()
            );
        }
        return true;
    }
    return false;
}

std::vector<std::string> ExtensionsManager::GetGrantedPermissions(const std::string& id) {
    Extension* extension = FindExtension(id);
    if (extension) {
        return extension->permissions;
    }
    return {};
}

bool ExtensionsManager::SetExtensionStorage(const std::string& id, const std::string& key, const std::string& value) {
    // TODO: Implement extension storage
    return false;
}

std::string ExtensionsManager::GetExtensionStorage(const std::string& id, const std::string& key) {
    // TODO: Implement extension storage
    return "";
}

bool ExtensionsManager::ClearExtensionStorage(const std::string& id) {
    // TODO: Implement extension storage clearing
    return false;
}

bool ExtensionsManager::SendMessageToExtension(const std::string& id, const std::string& message) {
    Extension* extension = FindExtension(id);
    if (extension && extension->enabled) {
        // TODO: Send message to extension
        return true;
    }
    return false;
}

bool ExtensionsManager::BroadcastMessage(const std::string& message) {
    bool success = true;
    for (const auto& extension : extensions_) {
        if (extension->enabled) {
            success &= SendMessageToExtension(extension->id, message);
        }
    }
    return success;
}

bool ExtensionsManager::LoadUnpackedExtension(const std::string& path) {
    return InstallExtension(path);
}

bool ExtensionsManager::EnableDeveloperMode() {
    developerMode_ = true;
    return true;
}

bool ExtensionsManager::IsDeveloperModeEnabled() const {
    return developerMode_;
}

bool ExtensionsManager::CheckForUpdates() {
    // TODO: Check for extension updates
    return false;
}

bool ExtensionsManager::UpdateExtension(const std::string& id) {
    // TODO: Update specific extension
    return false;
}

bool ExtensionsManager::UpdateAllExtensions() {
    // TODO: Update all extensions
    return false;
}

void ExtensionsManager::InstallDefaultFRWExtensions() {
    // Install FRW Developer Tools
    InstallFRWDeveloperTools();
    
    // Install FRW Wallet Extension
    InstallFRWWalletExtension();
    
    // Install FRW Name Resolver
    InstallFRWNameResolver();
}

void ExtensionsManager::InstallFRWDeveloperTools() {
    // TODO: Install FRW developer tools extension
}

void ExtensionsManager::InstallFRWWalletExtension() {
    // TODO: Install FRW wallet extension
}

void ExtensionsManager::InstallFRWNameResolver() {
    // TODO: Install FRW name resolver extension
}

Extension* ExtensionsManager::FindExtension(const std::string& id) {
    auto it = std::find_if(extensions_.begin(), extensions_.end(),
                          [&id](const auto& ext) { return ext->id == id; });
    return (it != extensions_.end()) ? it->get() : nullptr;
}

bool ExtensionsManager::LoadExtensionManifest(const std::string& path, Extension& extension) {
    std::string manifestPath = path + "/manifest.json";
    
    std::ifstream file(manifestPath);
    if (!file.is_open()) {
        return false;
    }
    
    try {
        std::stringstream buffer;
        buffer << file.rdbuf();
        std::string content = buffer.str();
        file.close();
        
        // Parse JSON (simplified - in production, use a proper JSON library)
        std::smatch match;
        
        // Extract name
        std::regex nameRegex("\"name\"\\s*:\\s*\"([^\"]+)\"");
        if (std::regex_search(content, match, nameRegex)) {
            extension.name = match[1].str();
        }
        
        // Extract version
        std::regex versionRegex("\"version\"\\s*:\\s*\"([^\"]+)\"");
        if (std::regex_search(content, match, versionRegex)) {
            extension.version = match[1].str();
        }
        
        // Extract description
        std::regex descRegex("\"description\"\\s*:\\s*\"([^\"]+)\"");
        if (std::regex_search(content, match, descRegex)) {
            extension.description = match[1].str();
        }
        
        // Extract author
        std::regex authorRegex("\"author\"\\s*:\\s*\"([^\"]+)\"");
        if (std::regex_search(content, match, authorRegex)) {
            extension.author = match[1].str();
        }
        
        // Extract permissions
        std::regex permRegex("\"permissions\"\\s*:\\s*\\[([^\\]]+)\\]");
        if (std::regex_search(content, match, permRegex)) {
            std::string perms = match[1].str();
            std::regex itemRegex("\"([^\"]+)\"");
            std::sregex_iterator iter(perms.begin(), perms.end(), itemRegex);
            std::sregex_iterator end;
            
            for (; iter != end; ++iter) {
                extension.permissions.push_back((*iter)[1].str());
            }
        }
        
        return !extension.name.empty() && !extension.version.empty();
        
    } catch (...) {
        return false;
    }
}

bool ExtensionsManager::ValidateExtension(const Extension& extension) {
    // Basic validation
    if (extension.name.empty() || extension.version.empty()) {
        return false;
    }
    
    // Check for required permissions
    // TODO: Validate against known permission set
    
    return true;
}

std::string ExtensionsManager::GenerateExtensionId(const std::string& path) {
    // Generate a 32-character ID based on path hash
    std::hash<std::string> hasher;
    size_t hash = hasher(path);
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis('a', 'z');
    
    std::string id = "frwext_";
    for (int i = 0; i < 24; ++i) {
        id += static_cast<char>(dis(gen));
    }
    
    return id;
}

std::string ExtensionsManager::GetExtensionsDirectory() {
    std::string extensionsDir;
    
#ifdef _WIN32
    wchar_t* path = nullptr;
    if (SUCCEEDED(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &path))) {
        extensionsDir = Utils::WStringToString(std::wstring(path, wcslen(path)));
        CoTaskMemFree(path);
    }
    std::replace(extensionsDir.begin(), extensionsDir.end(), '\\', '/');
#else
    extensionsDir = std::getenv("HOME") ? std::string(std::getenv("HOME")) : "";
#endif
    
    extensionsDir += "/FRW Browser/Extensions";
    
    // Create directory if it doesn't exist
    if (!std::filesystem::exists(extensionsDir)) {
        std::filesystem::create_directories(extensionsDir);
    }
    
    return extensionsDir;
}
