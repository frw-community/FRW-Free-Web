#include "DevToolsManager.h"
#include "cef_browser.h"
#include "cef_client.h"
#include "cef_command_line.h"
#include "wrapper/cef_helpers.h"
#include "internal/cef_types_wrappers.h"
#include <iostream>

DevToolsManager& DevToolsManager::Instance() {
    static DevToolsManager instance;
    return instance;
}

void DevToolsManager::ShowDevTools(CefRefPtr<CefBrowser> browser) {
    if (browser && browser->GetHost()) {
        CefWindowInfo windowInfo;
        CefBrowserSettings settings;
        CefPoint inspect_point(0, 0); // Default position
        
#ifdef _WIN32
        windowInfo.SetAsPopup(browser->GetHost()->GetWindowHandle(), L"Developer Tools");
#endif
        
        browser->GetHost()->ShowDevTools(windowInfo, nullptr, settings, inspect_point);
        devToolsBrowser_ = browser;
    }
}

void DevToolsManager::CloseDevTools(CefRefPtr<CefBrowser> browser) {
    if (browser && browser->GetHost()) {
        browser->GetHost()->CloseDevTools();
        if (devToolsBrowser_ == browser) {
            devToolsBrowser_ = nullptr;
        }
    }
}

void DevToolsManager::ToggleDevTools(CefRefPtr<CefBrowser> browser) {
    if (IsDevToolsOpen(browser)) {
        CloseDevTools(browser);
    } else {
        ShowDevTools(browser);
    }
}

bool DevToolsManager::IsDevToolsOpen(CefRefPtr<CefBrowser> browser) {
    return devToolsBrowser_ == browser;
}

void DevToolsManager::EnableRemoteDebugging(int port) {
    remoteDebuggingEnabled_ = true;
    remoteDebuggingPort_ = port;
    
    // Note: Remote debugging must be enabled at CEF initialization
    // This is handled in CEFIntegration.cpp via command line args
    LogInfo("Remote debugging enabled on port " + std::to_string(port));
}

void DevToolsManager::DisableRemoteDebugging() {
    remoteDebuggingEnabled_ = false;
    LogInfo("Remote debugging disabled");
}

bool DevToolsManager::IsRemoteDebuggingEnabled() const {
    return remoteDebuggingEnabled_;
}

int DevToolsManager::GetRemoteDebuggingPort() const {
    return remoteDebuggingPort_;
}

void DevToolsManager::LogToConsole(const std::string& message, const std::string& level) {
    std::string logMessage = "[" + level + "] " + message;
    std::cout << logMessage << std::endl;
    
    // Also send to browser console if DevTools is open
    if (devToolsBrowser_ && devToolsBrowser_->GetMainFrame()) {
        std::string jsCommand = "console." + level + "('" + message + "');";
        devToolsBrowser_->GetMainFrame()->ExecuteJavaScript(jsCommand, devToolsBrowser_->GetMainFrame()->GetURL(), 0);
    }
}

void DevToolsManager::LogError(const std::string& error) {
    LogToConsole(error, "error");
}

void DevToolsManager::LogWarning(const std::string& warning) {
    LogToConsole(warning, "warn");
}

void DevToolsManager::LogInfo(const std::string& info) {
    LogToConsole(info, "info");
}

// CefDevToolsMessageObserver methods
bool DevToolsManager::OnDevToolsMessage(CefRefPtr<CefBrowser> browser,
                                       const void* message,
                                       size_t message_size) {
    // Handle DevTools protocol messages
    // This is advanced functionality for custom DevTools extensions
    return false;
}

void DevToolsManager::OnDevToolsMethodResult(CefRefPtr<CefBrowser> browser,
                                             int message_id,
                                             bool success,
                                             const void* result,
                                             size_t result_size) {
    // Handle DevTools method results
}

void DevToolsManager::OnDevToolsEvent(CefRefPtr<CefBrowser> browser,
                                     const CefString& method,
                                     const void* params,
                                     size_t params_size) {
    // Handle DevTools events
}

void DevToolsManager::OnDevToolsAgentAttached(CefRefPtr<CefBrowser> browser) {
    LogInfo("DevTools agent attached");
}

void DevToolsManager::OnDevToolsAgentDetached(CefRefPtr<CefBrowser> browser) {
    LogInfo("DevTools agent detached");
    if (devToolsBrowser_ == browser) {
        devToolsBrowser_ = nullptr;
    }
}
