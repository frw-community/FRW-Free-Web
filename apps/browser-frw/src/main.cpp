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

int main(int argc, char* argv[]) {
    FRWCEF::InitializeCEF(argc, argv);

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
        BrowserWindow window;
        window.Create();
        window.CreateMenuBar();
        window.Show();
        
        FRWCEF::RunMessageLoop();
    } catch (const std::exception& e) {
        // Handle initialization errors
        FRWCEF::ShutdownCEF();
        return 1;
    }

    FRWCEF::ShutdownCEF();
    return 0;
}
