#pragma once

#include "cef_browser.h"
#include "cef_frame.h"
#include <string>
#include <vector>
#include <memory>

struct Tab {
    int id;
    std::string url;
    std::string title;
    CefRefPtr<CefBrowser> browser;
    bool isLoading;
    bool canGoBack;
    bool canGoForward;
};

class TabManager {
public:
    static TabManager& Instance();
    
    // Tab lifecycle
    int CreateNewTab(const std::string& url = "frw://home");
    void CloseTab(int tabId);
    Tab* GetTab(int tabId);
    Tab* GetActiveTab();
    
    // Tab navigation
    void SwitchToTab(int tabId);
    void LoadURL(int tabId, const std::string& url);
    void ReloadTab(int tabId);
    void StopTab(int tabId);
    void GoBack(int tabId);
    void GoForward(int tabId);
    
    // Tab state
    void UpdateTabTitle(int tabId, const std::string& title);
    void UpdateTabLoading(int tabId, bool loading);
    void UpdateTabNavigationState(int tabId, bool canGoBack, bool canGoForward);
    
    // Tab queries
    std::vector<Tab*> GetAllTabs();
    std::vector<int> GetTabIds();
    int GetActiveTabId() const { return activeTabId_; }
    size_t GetTabCount() const { return tabs_.size(); }

private:
    TabManager() : activeTabId_(-1), nextTabId_(1) {}
    std::vector<std::unique_ptr<Tab>> tabs_;
    int activeTabId_;
    int nextTabId_;
    
    Tab* FindTab(int tabId);
    void RemoveTab(int tabId);
};
