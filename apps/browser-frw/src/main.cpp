#include "CEFIntegration.h"
#include "CEFWindow.h"
#include "FrwSchemeHandler.h"
#include "UI/BrowserWindow.h"
#include "UI/SettingsManager.h"
#include "UI/HistoryManager.h"
#include "UI/DevToolsManager.h"
#include "UI/MenuManager.h"
#include "UI/ContextMenuManager.h"
#include "UI/ExtensionsManager.h"
#include "UI/PrivacyManager.h"
#include "CEFConfig.h"
#include <windows.h>
#include <iostream>

int main(int argc, char* argv[]) {
    std::cout << "FRW Browser: Starting initialization..." << std::endl;
    
    FRWCEF::InitializeCEF(argc, argv);
    std::cout << "FRW Browser: CEF initialized" << std::endl;

    // Initialize all managers
    SettingsManager::Instance().LoadSettings();
    HistoryManager::Instance().LoadHistory();
    PrivacyManager::Instance().LoadSettings();
    ExtensionsManager::Instance().InstallDefaultFRWExtensions();
    
    // Configure remote debugging if enabled
    auto& settings = SettingsManager::Instance().GetSettings();
    if (settings.enableRemoteDebugging) {
        DevToolsManager::Instance().EnableRemoteDebugging(settings.remoteDebuggingPort);
    }

    // Register custom frw:// scheme
    CefRegisterSchemeHandlerFactory(FRWCEF::SCHEME_NAME, FRWCEF::SCHEME_DOMAIN, new FrwSchemeHandlerFactory());

    // Create and show the browser window
    try {
        std::cout << "FRW Browser: Creating browser window..." << std::endl;
        BrowserWindow window;
        window.Create();
        window.CreateMenuBar();
        window.Show();
        
        std::cout << "FRW Browser: Starting message loop..." << std::endl;
        FRWCEF::RunMessageLoop();
    } catch (const std::exception& e) {
        std::cout << "FRW Browser: Exception occurred: " << e.what() << std::endl;
        FRWCEF::ShutdownCEF();
        return 1;
    }

    std::cout << "FRW Browser: Shutting down..." << std::endl;
    FRWCEF::ShutdownCEF();
    return 0;
}
