#include "ContextMenuManager.h"
#include "TabManager.h"
#include "HistoryManager.h"
#include "SettingsManager.h"
#include "cef_browser.h"
#include "cef_client.h"
#include "cef_frame.h"
#include "cef_menu_model.h"
#include <windows.h>
#include <shellapi.h>

ContextMenuManager& ContextMenuManager::Instance() {
    static ContextMenuManager instance;
    return instance;
}

void ContextMenuManager::OnBeforeContextMenu(CefRefPtr<CefBrowser> browser,
                                             CefRefPtr<CefFrame> frame,
                                             CefRefPtr<CefContextMenuParams> params,
                                             CefRefPtr<CefMenuModel> model) {
    // Clear default menu
    model->Clear();
    
    // Build context menu based on context
    if (params->HasImageContents()) {
        BuildImageMenu(model, params);
    } else if (params->IsEditable()) {
        BuildEditableMenu(model, params);
    } else if (params->GetLinkUrl().length() > 0) {
        BuildLinkMenu(model, params);
    } else if (params->GetSelectionText().length() > 0) {
        BuildSelectionMenu(model, params);
    } else {
        BuildPageMenu(model, params);
    }
    
    // Add FRW-specific options for all contexts
    BuildFRWMenu(model, params);
}

bool ContextMenuManager::OnContextMenuCommand(CefRefPtr<CefBrowser> browser,
                                              CefRefPtr<CefFrame> frame,
                                              CefRefPtr<CefContextMenuParams> params,
                                              int command_id,
                                              cef_event_flags_t event_flags) {
    // Handle menu commands
    switch (command_id) {
        // Page menu
        case 1001: ContextMenuManager::Instance().OnBack(); return true;
        case 1002: ContextMenuManager::Instance().OnForward(); return true;
        case 1003: ContextMenuManager::Instance().OnReload(); return true;
        case 1004: ContextMenuManager::Instance().OnViewSource(); return true;
        case 1005: ContextMenuManager::Instance().OnInspectElement(); return true;
        case 1006: ContextMenuManager::Instance().OnAddToBookmarks(); return true;
        case 1007: ContextMenuManager::Instance().OnSavePageAs(); return true;
        case 1008: ContextMenuManager::Instance().OnPrintPage(); return true;
        case 1009: ContextMenuManager::Instance().OnTranslatePage(); return true;
        
        // Link menu
        case 2001: ContextMenuManager::Instance().OnOpenLink(); return true;
        case 2002: ContextMenuManager::Instance().OnOpenLinkInNewTab(); return true;
        case 2003: ContextMenuManager::Instance().OnOpenLinkInIncognitoTab(); return true;
        case 2004: ContextMenuManager::Instance().OnCopyLinkAddress(); return true;
        case 2005: ContextMenuManager::Instance().OnSaveLinkAs(); return true;
        case 2006: ContextMenuManager::Instance().OnSendLinkTo(); return true;
        
        // Image menu
        case 3001: ContextMenuManager::Instance().OnOpenImage(); return true;
        case 3002: ContextMenuManager::Instance().OnOpenImageInNewTab(); return true;
        case 3003: ContextMenuManager::Instance().OnSaveImageAs(); return true;
        case 3004: ContextMenuManager::Instance().OnCopyImage(); return true;
        case 3005: ContextMenuManager::Instance().OnCopyImageAddress(); return true;
        case 3006: ContextMenuManager::Instance().OnSearchImageWithGoogle(); return true;
        
        // Media menu
        case 4001: ContextMenuManager::Instance().OnPlay(); return true;
        case 4002: ContextMenuManager::Instance().OnPause(); return true;
        case 4003: ContextMenuManager::Instance().OnMute(); return true;
        case 4004: ContextMenuManager::Instance().OnUnmute(); return true;
        case 4005: ContextMenuManager::Instance().OnToggleControls(); return true;
        case 4006: ContextMenuManager::Instance().OnToggleLoop(); return true;
        case 4007: ContextMenuManager::Instance().OnSaveMedia(); return true;
        case 4008: ContextMenuManager::Instance().OnCopyMediaAddress(); return true;
        
        // Editable menu
        case 5001: ContextMenuManager::Instance().OnUndo(); return true;
        case 5002: ContextMenuManager::Instance().OnRedo(); return true;
        case 5003: ContextMenuManager::Instance().OnCut(); return true;
        case 5004: ContextMenuManager::Instance().OnCopy(); return true;
        case 5005: ContextMenuManager::Instance().OnPaste(); return true;
        case 5006: ContextMenuManager::Instance().OnDelete(); return true;
        case 5007: ContextMenuManager::Instance().OnSelectAll(); return true;
        
        // Selection menu
        case 6001: ContextMenuManager::Instance().OnSearchSelection(); return true;
        case 6002: ContextMenuManager::Instance().OnCopySelection(); return true;
        case 6003: ContextMenuManager::Instance().OnTranslateSelection(); return true;
        
        // FRW menu
        case 7001: ContextMenuManager::Instance().OnRegisterAsFRWName(); return true;
        case 7002: ContextMenuManager::Instance().OnPublishToFRW(); return true;
        case 7003: ContextMenuManager::Instance().OnViewFRWInfo(); return true;
        case 7004: ContextMenuManager::Instance().OnCopyFRWLink(); return true;
        case 7005: ContextMenuManager::Instance().OnShareOnFRW(); return true;
    }
    
    return false;
}

void ContextMenuManager::OnContextMenuDismissed(CefRefPtr<CefBrowser> browser,
                                                CefRefPtr<CefFrame> frame) {
    // Context menu was dismissed
}

void ContextMenuManager::BuildPageMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params) {
    model->AddSeparator();
    model->AddItem(1001, "Back");
    model->AddItem(1002, "Forward");
    model->AddItem(1003, "Reload");
    model->AddSeparator();
    model->AddItem(1004, "View Page Source");
    model->AddItem(1005, "Inspect Element");
    model->AddSeparator();
    model->AddItem(1006, "Add to Bookmarks");
    model->AddItem(1007, "Save Page As...");
    model->AddItem(1008, "Print...");
    model->AddItem(1009, "Translate to English");
}

void ContextMenuManager::BuildLinkMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params) {
    std::string linkUrl = params->GetLinkUrl();
    std::string linkText = ""; // GetLinkText() doesn't exist in CEF 142
    
    model->AddSeparator();
    model->AddItem(2001, "Open Link");
    model->AddItem(2002, "Open Link in New Tab");
    model->AddItem(2003, "Open Link in Incognito Tab");
    model->AddSeparator();
    model->AddItem(2004, "Copy Link Address");
    model->AddItem(2005, "Save Link As...");
    model->AddItem(2006, "Send Link to...");
}

void ContextMenuManager::BuildImageMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params) {
    std::string imageUrl = ""; // GetImageUrl() doesn't exist in CEF 142
    
    model->AddSeparator();
    model->AddItem(3001, "Open Image");
    model->AddItem(3002, "Open Image in New Tab");
    model->AddSeparator();
    model->AddItem(3003, "Save Image As...");
    model->AddItem(3004, "Copy Image");
    model->AddItem(3005, "Copy Image Address");
    model->AddSeparator();
    model->AddItem(3006, "Search Image with Google");
}

void ContextMenuManager::BuildMediaMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params) {
    model->AddSeparator();
    
    // CEF_MEDIA_TYPE_VIDEO doesn't exist in CEF 142, assume all media
    model->AddItem(4001, "Play");
    model->AddItem(4002, "Pause");
    model->AddItem(4003, "Mute");
    model->AddItem(4004, "Unmute");
    model->AddItem(4005, "Toggle Controls");
    model->AddItem(4006, "Toggle Loop");
    
    model->AddSeparator();
    model->AddItem(4007, "Save Media As...");
    model->AddItem(4008, "Copy Media Address");
}

void ContextMenuManager::BuildEditableMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params) {
    model->AddSeparator();
    model->AddItem(5001, "Undo");
    model->AddItem(5002, "Redo");
    model->AddSeparator();
    model->AddItem(5003, "Cut");
    model->AddItem(5004, "Copy");
    model->AddItem(5005, "Paste");
    model->AddItem(5006, "Delete");
    model->AddSeparator();
    model->AddItem(5007, "Select All");
}

void ContextMenuManager::BuildSelectionMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params) {
    std::string selection = params->GetSelectionText();
    
    model->AddSeparator();
    model->AddItem(6001, "Search '" + selection.substr(0, 30) + (selection.length() > 30 ? "..." : "") + "' on Google");
    model->AddItem(6002, "Copy");
    model->AddItem(6003, "Translate to English");
}

void ContextMenuManager::BuildFRWMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params) {
    model->AddSeparator();
    model->AddItem(7001, "Register as FRW Name");
    model->AddItem(7002, "Publish to FRW");
    model->AddItem(7003, "View FRW Info");
    model->AddItem(7004, "Copy FRW Link");
    model->AddItem(7005, "Share on FRW");
}

// Menu action implementations
void ContextMenuManager::OnBack() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.GoBack(activeTab->id);
    }
}

void ContextMenuManager::OnForward() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.GoForward(activeTab->id);
    }
}

void ContextMenuManager::OnReload() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.ReloadTab(activeTab->id);
    }
}

void ContextMenuManager::OnViewSource() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        std::string url = "view-source:" + activeTab->url;
        tabManager.LoadURL(activeTab->id, url);
    }
}

void ContextMenuManager::OnInspectElement() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        CefWindowInfo windowInfo;
        CefBrowserSettings settings;
        CefPoint inspect_point(0, 0); // Default position
        
#ifdef _WIN32
        windowInfo.SetAsPopup(activeTab->browser->GetHost()->GetWindowHandle(), L"Developer Tools");
#endif
        
        activeTab->browser->GetHost()->ShowDevTools(windowInfo, nullptr, settings, inspect_point);
    }
}

void ContextMenuManager::OnAddToBookmarks() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        // TODO: Show bookmark dialog
    }
}

void ContextMenuManager::OnSavePageAs() {
    // TODO: Implement save page as
}

void ContextMenuManager::OnPrintPage() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetHost()->Print();
    }
}

void ContextMenuManager::OnTranslatePage() {
    // TODO: Implement page translation
}

void ContextMenuManager::OnOpenLink() {
    // TODO: Open link in current tab
}

void ContextMenuManager::OnOpenLinkInNewTab() {
    // TODO: Open link in new tab
}

void ContextMenuManager::OnOpenLinkInIncognitoTab() {
    // TODO: Open link in incognito tab
}

void ContextMenuManager::OnCopyLinkAddress() {
    // TODO: Copy link to clipboard
}

void ContextMenuManager::OnSaveLinkAs() {
    // TODO: Save link as
}

void ContextMenuManager::OnSendLinkTo() {
    // TODO: Send link to
}

void ContextMenuManager::OnOpenImage() {
    // TODO: Open image
}

void ContextMenuManager::OnOpenImageInNewTab() {
    // TODO: Open image in new tab
}

void ContextMenuManager::OnSaveImageAs() {
    // TODO: Save image as
}

void ContextMenuManager::OnCopyImage() {
    // TODO: Copy image to clipboard
}

void ContextMenuManager::OnCopyImageAddress() {
    // TODO: Copy image address
}

void ContextMenuManager::OnSearchImageWithGoogle() {
    // TODO: Search image with Google
}

void ContextMenuManager::OnPlay() {
    // TODO: Play media
}

void ContextMenuManager::OnPause() {
    // TODO: Pause media
}

void ContextMenuManager::OnMute() {
    // TODO: Mute media
}

void ContextMenuManager::OnUnmute() {
    // TODO: Unmute media
}

void ContextMenuManager::OnToggleControls() {
    // TODO: Toggle media controls
}

void ContextMenuManager::OnToggleLoop() {
    // TODO: Toggle media loop
}

void ContextMenuManager::OnSaveMedia() {
    // TODO: Save media
}

void ContextMenuManager::OnCopyMediaAddress() {
    // TODO: Copy media address
}

void ContextMenuManager::OnUndo() {
    // TODO: Send undo command
}

void ContextMenuManager::OnRedo() {
    // TODO: Send redo command
}

void ContextMenuManager::OnCut() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->Cut();
    }
}

void ContextMenuManager::OnCopy() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->Copy();
    }
}

void ContextMenuManager::OnPaste() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->Paste();
    }
}

void ContextMenuManager::OnDelete() {
    // TODO: Send delete command
}

void ContextMenuManager::OnSelectAll() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->SelectAll();
    }
}

void ContextMenuManager::OnSearchSelection() {
    // TODO: Search selection on Google
}

void ContextMenuManager::OnCopySelection() {
    OnCopy();
}

void ContextMenuManager::OnTranslateSelection() {
    // TODO: Translate selection
}

void ContextMenuManager::OnRegisterAsFRWName() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://register");
    }
}

void ContextMenuManager::OnPublishToFRW() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://publish");
    }
}

void ContextMenuManager::OnViewFRWInfo() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://info");
    }
}

void ContextMenuManager::OnCopyFRWLink() {
    // TODO: Copy FRW link to clipboard
}

void ContextMenuManager::OnShareOnFRW() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://share");
    }
}
