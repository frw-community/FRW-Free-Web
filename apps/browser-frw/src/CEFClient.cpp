#include "CEFClient.h"
#include "cef_browser.h"
#include "cef_display_handler.h"
#include "cef_life_span_handler.h"
#include "cef_context_menu_handler.h"
#include "wrapper/cef_helpers.h"
#include "UI/ContextMenuManager.h"
#include "UI/MenuManager.h"
#include "UI/BrowserWindow.h"
#include "UI/TabManager.h"
#include "UI/HistoryManager.h"
#include "UI/PrivacyManager.h"

// CefClient methods
CefRefPtr<CefLifeSpanHandler> FrwClient::GetLifeSpanHandler() { return this; }
CefRefPtr<CefDisplayHandler> FrwClient::GetDisplayHandler() { return this; }
CefRefPtr<CefLoadHandler> FrwClient::GetLoadHandler() { return this; }
CefRefPtr<CefContextMenuHandler> FrwClient::GetContextMenuHandler() { return this; }

// CefLifeSpanHandler methods
void FrwClient::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
    // Update tab manager
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        activeTab->browser = browser;
    }
}

void FrwClient::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
    // Update tab manager
    auto& tabManager = TabManager::Instance();
    auto tabs = tabManager.GetAllTabs();
    for (Tab* tab : tabs) {
        if (tab->browser == browser) {
            tab->browser = nullptr;
            break;
        }
    }
    
    // Trigger application exit when last browser closes
    // CefQuitMessageLoop() doesn't exist in CEF 142
    // CefQuitMessageLoop();
}

// CefDisplayHandler methods
void FrwClient::OnTitleChange(CefRefPtr<CefBrowser> browser,
                       const CefString& title) {
#ifdef _WIN32
    CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
    std::string title_str = title.ToString();
    std::wstring wtitle(title_str.begin(), title_str.end());
    SetWindowTextW(hwnd, wtitle.c_str());
#endif
    
    // Update tab manager
    auto& tabManager = TabManager::Instance();
    auto tabs = tabManager.GetAllTabs();
    for (Tab* tab : tabs) {
        if (tab->browser == browser) {
            tab->title = title.ToString();
            break;
        }
    }
    
    // Update history
    std::string url = browser->GetMainFrame()->GetURL().ToString();
    HistoryManager::Instance().AddEntry(url, title.ToString());
}

void FrwClient::OnAddressChange(CefRefPtr<CefBrowser> browser,
                         CefRefPtr<CefFrame> frame,
                         const CefString& url) {
    // Update tab manager
    auto& tabManager = TabManager::Instance();
    auto tabs = tabManager.GetAllTabs();
    for (Tab* tab : tabs) {
        if (tab->browser == browser) {
            tab->url = url.ToString();
            break;
        }
    }
    
    // Update menu states
    MenuManager::Instance().UpdateMenuStates();
}

void FrwClient::OnLoadingStateChange(CefRefPtr<CefBrowser> browser,
                              bool isLoading,
                              bool canGoBack,
                              bool canGoForward) {
        // Update tab manager
    auto& tabManager = TabManager::Instance();
    auto tabs = tabManager.GetAllTabs();
    for (Tab* tab : tabs) {
        if (tab->browser == browser) {
            tab->isLoading = isLoading;
            tab->canGoBack = canGoBack;
            tab->canGoForward = canGoForward;
            break;
        }
    }
    
    // Update menu states
    MenuManager::Instance().UpdateMenuStates();
}

// CefContextMenuHandler methods
void FrwClient::OnBeforeContextMenu(CefRefPtr<CefBrowser> browser,
                             CefRefPtr<CefFrame> frame,
                             CefRefPtr<CefContextMenuParams> params,
                             CefRefPtr<CefMenuModel> model) {
    ContextMenuManager::Instance().OnBeforeContextMenu(browser, frame, params, model);
}

bool FrwClient::OnContextMenuCommand(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              CefRefPtr<CefContextMenuParams> params,
                              int command_id,
                              cef_event_flags_t event_flags) {
    return ContextMenuManager::Instance().OnContextMenuCommand(browser, frame, params, command_id, event_flags);
}

void FrwClient::OnContextMenuDismissed(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefFrame> frame) {
    ContextMenuManager::Instance().OnContextMenuDismissed(browser, frame);
}
