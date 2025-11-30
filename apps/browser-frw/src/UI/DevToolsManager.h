#pragma once

#include "cef_browser.h"
#include "cef_devtools_message_observer.h"
#include <string>
#include <memory>

class DevToolsManager : public CefDevToolsMessageObserver {
public:
    static DevToolsManager& Instance();
    
    // DevTools management
    void ShowDevTools(CefRefPtr<CefBrowser> browser);
    void CloseDevTools(CefRefPtr<CefBrowser> browser);
    void ToggleDevTools(CefRefPtr<CefBrowser> browser);
    bool IsDevToolsOpen(CefRefPtr<CefBrowser> browser);
    
    // Remote debugging
    void EnableRemoteDebugging(int port = 9222);
    void DisableRemoteDebugging();
    bool IsRemoteDebuggingEnabled() const;
    int GetRemoteDebuggingPort() const;
    
    // Console logging
    void LogToConsole(const std::string& message, const std::string& level = "info");
    void LogError(const std::string& error);
    void LogWarning(const std::string& warning);
    void LogInfo(const std::string& info);

    // CefDevToolsMessageObserver methods
    bool OnDevToolsMessage(CefRefPtr<CefBrowser> browser,
                           const void* message,
                           size_t message_size) override;
    
    void OnDevToolsMethodResult(CefRefPtr<CefBrowser> browser,
                                int message_id,
                                bool success,
                                const void* result,
                                size_t result_size) override;
    
    void OnDevToolsEvent(CefRefPtr<CefBrowser> browser,
                         const CefString& method,
                         const void* params,
                         size_t params_size) override;
    
    void OnDevToolsAgentAttached(CefRefPtr<CefBrowser> browser) override;
    
    void OnDevToolsAgentDetached(CefRefPtr<CefBrowser> browser) override;

private:
    DevToolsManager() = default;
    CefRefPtr<CefBrowser> devToolsBrowser_;
    bool remoteDebuggingEnabled_;
    int remoteDebuggingPort_;
    
    IMPLEMENT_REFCOUNTING(DevToolsManager);
    DISALLOW_COPY_AND_ASSIGN(DevToolsManager);
};
