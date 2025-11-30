#include "TabManager.h"
#include "CEFClient.h"
#include "include/cef_browser.h"
#include <algorithm>

TabManager& TabManager::Instance() {
    static TabManager instance;
    return instance;
}

int TabManager::CreateNewTab(const std::string& url) {
    auto tab = std::make_unique<Tab>();
    tab->id = nextTabId_++;
    tab->url = url;
    tab->title = "New Tab";
    tab->isLoading = true;
    tab->canGoBack = false;
    tab->canGoForward = false;
    
    // TODO: Create actual CEF browser instance
    // For now, we'll simulate it
    tab->browser = nullptr;
    
    int tabId = tab->id;
    tabs_.push_back(std::move(tab));
    
    // Switch to the new tab
    SwitchToTab(tabId);
    
    return tabId;
}

void TabManager::CloseTab(int tabId) {
    auto it = std::find_if(tabs_.begin(), tabs_.end(),
                          [tabId](const auto& tab) { return tab->id == tabId; });
    
    if (it != tabs_.end()) {
        // Close the browser if it exists
        if ((*it)->browser) {
            (*it)->browser->GetHost()->CloseBrowser(true);
        }
        
        // If this was the active tab, switch to another
        if (activeTabId_ == tabId) {
            tabs_.erase(it);
            if (!tabs_.empty()) {
                activeTabId_ = tabs_.front()->id;
            } else {
                activeTabId_ = -1;
            }
        } else {
            tabs_.erase(it);
        }
    }
}

Tab* TabManager::GetTab(int tabId) {
    return FindTab(tabId);
}

Tab* TabManager::GetActiveTab() {
    return FindTab(activeTabId_);
}

void TabManager::SwitchToTab(int tabId) {
    Tab* tab = FindTab(tabId);
    if (tab) {
        activeTabId_ = tabId;
        // TODO: Bring browser window to front if needed
    }
}

void TabManager::LoadURL(int tabId, const std::string& url) {
    Tab* tab = FindTab(tabId);
    if (tab && tab->browser && tab->browser->GetMainFrame()) {
        tab->url = url;
        tab->isLoading = true;
        tab->browser->GetMainFrame()->LoadURL(url);
    }
}

void TabManager::ReloadTab(int tabId) {
    Tab* tab = FindTab(tabId);
    if (tab && tab->browser) {
        tab->browser->Reload();
    }
}

void TabManager::StopTab(int tabId) {
    Tab* tab = FindTab(tabId);
    if (tab && tab->browser) {
        // Stop() method doesn't exist in CEF 142
        // tab->browser->GetMainFrame()->Stop();
    }
}

void TabManager::GoBack(int tabId) {
    Tab* tab = FindTab(tabId);
    if (tab && tab->browser && tab->browser->CanGoBack()) {
        tab->browser->GoBack();
    }
}

void TabManager::GoForward(int tabId) {
    Tab* tab = FindTab(tabId);
    if (tab && tab->browser && tab->browser->CanGoForward()) {
        tab->browser->GoForward();
    }
}

void TabManager::UpdateTabTitle(int tabId, const std::string& title) {
    Tab* tab = FindTab(tabId);
    if (tab) {
        tab->title = title;
    }
}

void TabManager::UpdateTabLoading(int tabId, bool loading) {
    Tab* tab = FindTab(tabId);
    if (tab) {
        tab->isLoading = loading;
    }
}

void TabManager::UpdateTabNavigationState(int tabId, bool canGoBack, bool canGoForward) {
    Tab* tab = FindTab(tabId);
    if (tab) {
        tab->canGoBack = canGoBack;
        tab->canGoForward = canGoForward;
    }
}

std::vector<Tab*> TabManager::GetAllTabs() {
    std::vector<Tab*> result;
    for (const auto& tab : tabs_) {
        result.push_back(tab.get());
    }
    return result;
}

std::vector<int> TabManager::GetTabIds() {
    std::vector<int> result;
    for (const auto& tab : tabs_) {
        result.push_back(tab->id);
    }
    return result;
}

Tab* TabManager::FindTab(int tabId) {
    auto it = std::find_if(tabs_.begin(), tabs_.end(),
                          [tabId](const auto& tab) { return tab->id == tabId; });
    return (it != tabs_.end()) ? it->get() : nullptr;
}

void TabManager::RemoveTab(int tabId) {
    tabs_.erase(std::remove_if(tabs_.begin(), tabs_.end(),
                               [tabId](const auto& tab) { return tab->id == tabId; }),
                tabs_.end());
}
