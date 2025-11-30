#include "MenuManager.h"
#include "BrowserWindow.h"
#include "TabManager.h"
#include "HistoryManager.h"
#include "SettingsManager.h"
#include "DownloadManager.h"
#include "CEFConfig.h"
#include "cef_browser.h"
#include "cef_client.h"
#include "internal/cef_types_wrappers.h"

// Windows headers - include in correct order to avoid conflicts
#include <windows.h>
#include <shellapi.h>
#include <commdlg.h>

MenuManager& MenuManager::Instance() {
    static MenuManager instance;
    return instance;
}

void MenuManager::CreateMenuBar(HWND hwnd) {
    hwnd_ = hwnd;
    
    HMENU hMenuBar = CreateMenu();
    
    CreateFileMenu(hMenuBar);
    CreateEditMenu(hMenuBar);
    CreateViewMenu(hMenuBar);
    CreateHistoryMenu(hMenuBar);
    CreateBookmarksMenu(hMenuBar);
    CreateToolsMenu(hMenuBar);
    CreateFRWMenu(hMenuBar);
    CreateHelpMenu(hMenuBar);
    
    SetMenu(hwnd, hMenuBar);
    UpdateMenuStates();
}

void MenuManager::UpdateMenuStates() {
    // Update menu states based on current browser state
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    
    bool canGoBack = activeTab && activeTab->canGoBack;
    bool canGoForward = activeTab && activeTab->canGoForward;
    
    EnableMenuItem(1001, canGoBack); // Back
    EnableMenuItem(1002, canGoForward); // Forward
    EnableMenuItem(1003, activeTab != nullptr); // Reload
    EnableMenuItem(1004, activeTab != nullptr); // Stop
}

void MenuManager::EnableMenuItem(int menuId, bool enabled) {
    if (hwnd_) {
        HMENU hMenu = GetMenu(hwnd_);
        ::EnableMenuItem(hMenu, menuId, MF_BYCOMMAND | (enabled ? MF_ENABLED : MF_GRAYED));
    }
}

void MenuManager::CheckMenuItem(int menuId, bool checked) {
    if (hwnd_) {
        HMENU hMenu = GetMenu(hwnd_);
        ::CheckMenuItem(hMenu, menuId, MF_BYCOMMAND | (checked ? MF_CHECKED : MF_UNCHECKED));
    }
}

void MenuManager::CreateFileMenu(HMENU hMenuBar) {
    HMENU hFileMenu = CreatePopupMenu();
    
    CreateMenuItem(hFileMenu, "New Window", 2001, "Ctrl+N");
    CreateMenuItem(hFileMenu, "New Tab", 2002, "Ctrl+T");
    CreateMenuItem(hFileMenu, "New Incognito Window", 2003, "Ctrl+Shift+N");
    CreateSeparator(hFileMenu);
    CreateMenuItem(hFileMenu, "Open File...", 2004, "Ctrl+O");
    CreateSeparator(hFileMenu);
    CreateMenuItem(hFileMenu, "Save Page As...", 2005, "Ctrl+S");
    CreateSeparator(hFileMenu);
    CreateMenuItem(hFileMenu, "Print...", 2006, "Ctrl+P");
    CreateSeparator(hFileMenu);
    CreateMenuItem(hFileMenu, "Exit", 2007, "Alt+F4");
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hFileMenu, L"&File");
}

void MenuManager::CreateEditMenu(HMENU hMenuBar) {
    HMENU hEditMenu = CreatePopupMenu();
    
    CreateMenuItem(hEditMenu, "Undo", 3001, "Ctrl+Z");
    CreateMenuItem(hEditMenu, "Redo", 3002, "Ctrl+Y");
    CreateSeparator(hEditMenu);
    CreateMenuItem(hEditMenu, "Cut", 3003, "Ctrl+X");
    CreateMenuItem(hEditMenu, "Copy", 3004, "Ctrl+C");
    CreateMenuItem(hEditMenu, "Paste", 3005, "Ctrl+V");
    CreateMenuItem(hEditMenu, "Select All", 3006, "Ctrl+A");
    CreateSeparator(hEditMenu);
    CreateMenuItem(hEditMenu, "Find...", 3007, "Ctrl+F");
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hEditMenu, L"&Edit");
}

void MenuManager::CreateViewMenu(HMENU hMenuBar) {
    HMENU hViewMenu = CreatePopupMenu();
    
    CreateMenuItem(hViewMenu, "Always on Top", 4001);
    CreateMenuItem(hViewMenu, "Fullscreen", 4002, "F11");
    CreateSeparator(hViewMenu);
    CreateMenuItem(hViewMenu, "Zoom In", 4003, "Ctrl++");
    CreateMenuItem(hViewMenu, "Zoom Out", 4004, "Ctrl+-");
    CreateMenuItem(hViewMenu, "Reset Zoom", 4005, "Ctrl+0");
    CreateMenuItem(hViewMenu, "Actual Size", 4006, "Ctrl+1");
    CreateSeparator(hViewMenu);
    
    HMENU hEncodingMenu;
    CreateSubMenu(hViewMenu, "Encoding", hEncodingMenu);
    CreateMenuItem(hEncodingMenu, "Auto-detect", 4010);
    CreateMenuItem(hEncodingMenu, "UTF-8", 4011);
    CreateMenuItem(hEncodingMenu, "Windows-1252", 4012);
    CreateMenuItem(hEncodingMenu, "ISO-8859-1", 4013);
    
    CreateSeparator(hViewMenu);
    CreateMenuItem(hViewMenu, "Developer Tools", 4007, "F12");
    CreateMenuItem(hViewMenu, "Task Manager", 4008, "Shift+Esc");
    CreateMenuItem(hViewMenu, "Extensions", 4009);
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hViewMenu, L"&View");
}

void MenuManager::CreateHistoryMenu(HMENU hMenuBar) {
    HMENU hHistoryMenu = CreatePopupMenu();
    
    CreateMenuItem(hHistoryMenu, "Back", 5001, "Alt+Left");
    CreateMenuItem(hHistoryMenu, "Forward", 5002, "Alt+Right");
    CreateMenuItem(hHistoryMenu, "Home", 5003, "Alt+Home");
    CreateSeparator(hHistoryMenu);
    CreateMenuItem(hHistoryMenu, "Show Full History", 5004, "Ctrl+H");
    CreateSeparator(hHistoryMenu);
    CreateMenuItem(hHistoryMenu, "Clear Browsing Data...", 5005);
    
    // Add recent history items
    auto& history = HistoryManager::Instance();
    auto recent = history.GetRecentEntries(10);
    if (!recent.empty()) {
        CreateSeparator(hHistoryMenu);
        int index = 0;
        for (const auto& entry : recent) {
            std::string title = entry.title.substr(0, 50);
            if (entry.title.length() > 50) title += "...";
            CreateMenuItem(hHistoryMenu, title, 6000 + index, "");
            index++;
        }
    }
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hHistoryMenu, L"&History");
}

void MenuManager::CreateBookmarksMenu(HMENU hMenuBar) {
    HMENU hBookmarksMenu = CreatePopupMenu();
    
    CreateMenuItem(hBookmarksMenu, "Add Bookmark...", 7001, "Ctrl+D");
    CreateMenuItem(hBookmarksMenu, "Show All Bookmarks", 7002, "Ctrl+Shift+B");
    CreateMenuItem(hBookmarksMenu, "Bookmark All Tabs...", 7003);
    CreateSeparator(hBookmarksMenu);
    
    // Add favorite bookmarks
    // TODO: Load from settings
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hBookmarksMenu, L"&Bookmarks");
}

void MenuManager::CreateToolsMenu(HMENU hMenuBar) {
    HMENU hToolsMenu = CreatePopupMenu();
    
    CreateMenuItem(hToolsMenu, "Downloads", 8001, "Ctrl+J");
    CreateMenuItem(hToolsMenu, "Extensions", 8002);
    CreateMenuItem(hToolsMenu, "Settings", 8003);
    CreateSeparator(hToolsMenu);
    CreateMenuItem(hToolsMenu, "Task Manager", 8004, "Shift+Esc");
    CreateMenuItem(hToolsMenu, "Clear Browsing Data...", 8005);
    CreateSeparator(hToolsMenu);
    CreateMenuItem(hToolsMenu, "Import Bookmarks...", 8006);
    CreateMenuItem(hToolsMenu, "Export Bookmarks...", 8007);
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hToolsMenu, L"&Tools");
}

void MenuManager::CreateFRWMenu(HMENU hMenuBar) {
    HMENU hFRWMenu = CreatePopupMenu();
    
    CreateMenuItem(hFRWMenu, "Register FRW Name...", 9001);
    CreateMenuItem(hFRWMenu, "Publish Site...", 9002);
    CreateSeparator(hFRWMenu);
    CreateMenuItem(hFRWMenu, "Manage Names", 9003);
    CreateMenuItem(hFRWMenu, "Bootstrap Nodes", 9004);
    CreateMenuItem(hFRWMenu, "IPFS Status", 9005);
    CreateMenuItem(hFRWMenu, "Network Statistics", 9006);
    CreateSeparator(hFRWMenu);
    CreateMenuItem(hFRWMenu, "FRW Settings...", 9007);
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hFRWMenu, L"&FRW");
}

void MenuManager::CreateHelpMenu(HMENU hMenuBar) {
    HMENU hHelpMenu = CreatePopupMenu();
    
    CreateMenuItem(hHelpMenu, "Help Center", 10001);
    CreateMenuItem(hHelpMenu, "Report Issue...", 10002);
    CreateSeparator(hHelpMenu);
    CreateMenuItem(hHelpMenu, "About FRW Browser", 10003);
    
    AppendMenuW(hMenuBar, MF_POPUP, (UINT_PTR)hHelpMenu, L"&Help");
}

void MenuManager::CreateMenuItem(HMENU hMenu, const std::string& text, int id, const std::string& shortcut) {
    std::string menuText = text;
    if (!shortcut.empty()) {
        menuText += "\t" + shortcut;
    }
    // Convert to wide string for Unicode API
    std::wstring wMenuText(menuText.begin(), menuText.end());
    AppendMenuW(hMenu, MF_STRING, id, wMenuText.c_str());
}

void MenuManager::CreateSeparator(HMENU hMenu) {
    AppendMenuW(hMenu, MF_SEPARATOR, 0, NULL);
}

void MenuManager::CreateSubMenu(HMENU hMenu, const std::string& text, HMENU& hSubMenu) {
    hSubMenu = CreatePopupMenu();
    // Convert to wide string for Unicode API
    std::wstring wText(text.begin(), text.end());
    AppendMenuW(hMenu, MF_POPUP, (UINT_PTR)hSubMenu, wText.c_str());
}

// Menu action implementations
void MenuManager::OnFileNewWindow() {
    // TODO: Create new browser window
}

void MenuManager::OnFileNewTab() {
    auto& tabManager = TabManager::Instance();
    tabManager.CreateNewTab();
}

void MenuManager::OnFileNewIncognitoWindow() {
    // TODO: Create incognito window
}

void MenuManager::OnFileOpenFile() {
    OPENFILENAMEW ofn;
    wchar_t fileName[MAX_PATH] = L"";
    
    ZeroMemory(&ofn, sizeof(ofn));
    ofn.lStructSize = sizeof(ofn);
    ofn.hwndOwner = hwnd_;
    ofn.lpstrFilter = L"HTML Files\0*.html;*.htm\0All Files\0*.*\0";
    ofn.lpstrFile = fileName;
    ofn.nMaxFile = MAX_PATH;
    ofn.Flags = OFN_FILEMUSTEXIST | OFN_HIDEREADONLY;
    
    if (GetOpenFileNameW(&ofn)) {
        // Convert wide string to narrow string properly
        std::wstring wfileName(fileName);
        std::string fileNameStr;
        fileNameStr.reserve(wfileName.length());
        for (wchar_t wc : wfileName) {
            if (wc < 128) {
                fileNameStr.push_back(static_cast<char>(wc));
            } else {
                fileNameStr.push_back('?'); // Replace non-ASCII chars
            }
        }
        std::string url = "file:///" + fileNameStr;
        std::replace(url.begin(), url.end(), '\\', '/');
        auto& tabManager = TabManager::Instance();
        Tab* activeTab = tabManager.GetActiveTab();
        if (activeTab) {
            tabManager.LoadURL(activeTab->id, url);
        }
    }
}

void MenuManager::OnFileSavePageAs() {
    // TODO: Implement save page as
}

void MenuManager::OnFilePrint() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetHost()->Print();
    }
}

void MenuManager::OnFileExit() {
    if (hwnd_) {
        PostMessage(hwnd_, WM_CLOSE, 0, 0);
    }
}

void MenuManager::OnEditUndo() {
    // TODO: Send undo command to active tab
}

void MenuManager::OnEditRedo() {
    // TODO: Send redo command to active tab
}

void MenuManager::OnEditCut() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->Cut();
    }
}

void MenuManager::OnEditCopy() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->Copy();
    }
}

void MenuManager::OnEditPaste() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->Paste();
    }
}

void MenuManager::OnEditSelectAll() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetMainFrame()->SelectAll();
    }
}

void MenuManager::OnEditFind() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        // Find() method doesn't exist in CEF 142
        // activeTab->browser->GetMainFrame()->Find("", true, false, false);
    }
}

void MenuManager::OnViewAlwaysOnTop() {
    // TODO: Implement always on top
}

void MenuManager::OnViewFullscreen() {
    if (hwnd_) {
        static bool fullscreen = false;
        if (fullscreen) {
            ShowWindow(hwnd_, SW_RESTORE);
        } else {
            ShowWindow(hwnd_, SW_MAXIMIZE);
        }
        fullscreen = !fullscreen;
    }
}

void MenuManager::OnViewZoomIn() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetHost()->SetZoomLevel(activeTab->browser->GetHost()->GetZoomLevel() + 0.5);
    }
}

void MenuManager::OnViewZoomOut() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetHost()->SetZoomLevel(activeTab->browser->GetHost()->GetZoomLevel() - 0.5);
    }
}

void MenuManager::OnViewZoomReset() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        activeTab->browser->GetHost()->SetZoomLevel(0.0);
    }
}

void MenuManager::OnViewActualSize() {
    OnViewZoomReset();
}

void MenuManager::OnViewEncoding(const std::string& encoding) {
    // TODO: Set page encoding
}

void MenuManager::OnViewDeveloperTools() {
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

void MenuManager::OnViewTaskManager() {
    // TODO: Show CEF task manager
}

void MenuManager::OnViewExtensions() {
    // TODO: Show extensions page
}

void MenuManager::OnHistoryBack() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.GoBack(activeTab->id);
    }
}

void MenuManager::OnHistoryForward() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.GoForward(activeTab->id);
    }
}

void MenuManager::OnHistoryHome() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://home");
    }
}

void MenuManager::OnHistoryShowHistory() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://history");
    }
}

void MenuManager::OnHistoryClearHistory() {
    HistoryManager::Instance().ClearHistory();
}

void MenuManager::OnBookmarksAddBookmark() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        // TODO: Show bookmark dialog
    }
}

void MenuManager::OnBookmarksShowBookmarks() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://bookmarks");
    }
}

void MenuManager::OnBookmarksBookmarkAllTabs() {
    // TODO: Bookmark all tabs
}

void MenuManager::OnBookmarkClick(const std::string& url) {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, url);
    }
}

void MenuManager::OnToolsDownloads() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://downloads");
    }
}

void MenuManager::OnToolsExtensions() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://extensions");
    }
}

void MenuManager::OnToolsSettings() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://settings");
    }
}

void MenuManager::OnToolsTaskManager() {
    OnViewTaskManager();
}

void MenuManager::OnToolsClearBrowsingData() {
    // TODO: Show clear browsing data dialog
}

void MenuManager::OnToolsImportBookmarks() {
    // TODO: Import bookmarks from file
}

void MenuManager::OnToolsExportBookmarks() {
    // TODO: Export bookmarks to file
}

void MenuManager::OnHelpAbout() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://about");
    }
}

void MenuManager::OnHelpHelpCenter() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://help");
    }
}

void MenuManager::OnHelpReportIssue() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "https://github.com/frw-community/frw-free-web-modern/issues");
    }
}

// FRW-specific menu actions
void MenuManager::OnFRWRegisterName() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://register");
    }
}

void MenuManager::OnFRWPublishSite() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://publish");
    }
}

void MenuManager::OnFRWManageNames() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://names");
    }
}

void MenuManager::OnFRWBootstrapNodes() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://bootstrap");
    }
}

void MenuManager::OnFRWIPFSStatus() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://ipfs-status");
    }
}

void MenuManager::OnFRWNetworkStats() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://network-stats");
    }
}

void MenuManager::OnFRWSettings() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, "frw://frw-settings");
    }
}
