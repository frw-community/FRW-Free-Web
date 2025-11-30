#include "BrowserWindow.h"
#include "CEFClient.h"
#include "CEFConfig.h"
#include "cef_browser.h"
#include "cef_frame.h"
#include "internal/cef_types_wrappers.h"
#include "TabManager.h"
#include "HistoryManager.h"
#include "DevToolsManager.h"
#include "SettingsManager.h"
#include "MenuManager.h"
#include "ContextMenuManager.h"
#include "ExtensionsManager.h"
#include "PrivacyManager.h"

#ifdef _WIN32
#include <windows.h>
#include <commctrl.h>
#include <shellapi.h>
#pragma comment(lib, "comctl32.lib")
#endif

// Browser window implementation details
class BrowserWindow::Impl {
public:
    CefRefPtr<CefBrowser> browser;
    HWND hwnd;
    HWND hwndToolbar;
    HWND hwndAddress;
    HWND hwndStatus;
    HWND hwndFavorites;
    bool isLoading;
    std::vector<Favorite> favorites;
    std::string currentURL;

    Impl() : hwnd(nullptr), hwndToolbar(nullptr), hwndAddress(nullptr), 
             hwndStatus(nullptr), hwndFavorites(nullptr), isLoading(false) {
        LoadFavorites();
    }

    void LoadFavorites() {
        // TODO: Load from persistent storage
        favorites = {
            {"FRW Home", "frw://home", ""},
            {"Documentation", "frw://docs", ""},
            {"Community", "frw://community", ""}
        };
    }

    void SaveFavorites() {
        // TODO: Save to persistent storage (JSON file)
    }

    void CreateToolbar() {
#ifdef _WIN32
        // Create toolbar with navigation buttons
        hwndToolbar = CreateWindowEx(0, TOOLBARCLASSNAME, NULL,
                                     WS_CHILD | WS_VISIBLE | TBSTYLE_FLAT | TBSTYLE_TOOLTIPS,
                                     0, 0, 0, 0, hwnd, (HMENU)100, GetModuleHandle(NULL), NULL);
        
        // Add toolbar buttons
        TBBUTTON tbb[] = {
            {0, 101, TBSTATE_ENABLED, BTNS_BUTTON, {0}, 0, (INT_PTR)L"Back"},
            {1, 102, TBSTATE_ENABLED, BTNS_BUTTON, {0}, 0, (INT_PTR)L"Forward"},
            {2, 103, TBSTATE_ENABLED, BTNS_BUTTON, {0}, 0, (INT_PTR)L"Reload"},
            {3, 104, TBSTATE_ENABLED, BTNS_BUTTON, {0}, 0, (INT_PTR)L"Stop"},
            {4, 105, TBSTATE_ENABLED, BTNS_BUTTON, {0}, 0, (INT_PTR)L"Home"}
        };
        
        SendMessage(hwndToolbar, TB_BUTTONSTRUCTSIZE, sizeof(TBBUTTON), 0);
        SendMessage(hwndToolbar, TB_ADDBUTTONS, 5, (LPARAM)tbb);
#endif
    }

    void CreateAddressBar() {
#ifdef _WIN32
        hwndAddress = CreateWindowExW(WS_EX_CLIENTEDGE, L"EDIT", L"",
                                     WS_CHILD | WS_VISIBLE | ES_AUTOHSCROLL | WS_TABSTOP,
                                     150, 2, 400, 24, hwnd, (HMENU)200,
                                     GetModuleHandle(NULL), NULL);
        
        // Set default text and give it focus
        SetWindowTextW(hwndAddress, L"frw://home");
        SetFocus(hwndAddress);
#endif
    }

    void CreateFavoritesBar() {
#ifdef _WIN32
        hwndFavorites = CreateWindowExW(0, L"BUTTON", L"Favorites",
                                     WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON,
                                     10, 2, 130, 24, hwnd, (HMENU)201,
                                     GetModuleHandle(NULL), NULL);
#endif
    }

    void CreateStatusBar() {
#ifdef _WIN32
        hwndStatus = CreateWindowEx(0, STATUSCLASSNAME, NULL,
                                    WS_CHILD | WS_VISIBLE,
                                    0, 0, 0, 0, hwnd, (HMENU)400,
                                    GetModuleHandle(NULL), NULL);
        
        int statwidths[] = {200, -1};
        SendMessage(hwndStatus, SB_SETPARTS, 2, (LPARAM)statwidths);
        SendMessage(hwndStatus, SB_SETTEXT, 0, (LPARAM)L"Ready");
#endif
    }

    void UpdateLayout() {
#ifdef _WIN32
        RECT rc;
        GetClientRect(hwnd, &rc);
        
        // Toolbar area
        MoveWindow(hwndToolbar, 0, 0, rc.right, 28, TRUE);
        
        // Address bar
        MoveWindow(hwndAddress, 150, 2, 400, 24, TRUE);
        
        // Favorites button
        MoveWindow(hwndFavorites, 560, 2, 80, 24, TRUE);
        
        // Browser area (below toolbar)
        int browserTop = 30;
        int browserHeight = rc.bottom - browserTop - 20;
        
        if (browser && browser->GetHost()) {
            HWND browserHwnd = browser->GetHost()->GetWindowHandle();
            if (browserHwnd) {
                MoveWindow(browserHwnd, 0, browserTop, rc.right, browserHeight, TRUE);
            }
        }
        
        // Status bar
        SendMessage(hwndStatus, WM_SIZE, 0, 0);
#endif
    }
};

BrowserWindow::BrowserWindow() : pImpl(std::make_unique<Impl>()) {}

BrowserWindow::~BrowserWindow() = default;

void BrowserWindow::Create() {
#ifdef _WIN32
    // Register window class
    WNDCLASSEXW wc = {0};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.lpfnWndProc = [](HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) -> LRESULT {
        BrowserWindow* window = reinterpret_cast<BrowserWindow*>(GetWindowLongPtr(hwnd, GWLP_USERDATA));
        if (!window && msg == WM_CREATE) {
            CREATESTRUCT* cs = reinterpret_cast<CREATESTRUCT*>(lParam);
            window = static_cast<BrowserWindow*>(cs->lpCreateParams);
            SetWindowLongPtr(hwnd, GWLP_USERDATA, reinterpret_cast<LONG_PTR>(window));
        }
        
        if (window) {
            switch (msg) {
                case WM_SIZE:
                    window->pImpl->UpdateLayout();
                    return 0;
                case WM_KEYDOWN:
                    if (wParam == VK_RETURN && GetFocus() == window->pImpl->hwndAddress) {
                        // User pressed Enter in address bar
                        wchar_t buffer[1024];
                        GetWindowTextW(window->pImpl->hwndAddress, buffer, 1024);
                        std::wstring url(buffer);
                        std::string urlStr(url.begin(), url.end());
                        if (!urlStr.empty()) {
                            window->LoadURL(urlStr);
                        }
                        return 0;
                    }
                    break;
                case WM_COMMAND:
                    if (LOWORD(wParam) == 101) window->GoBack();
                    else if (LOWORD(wParam) == 102) window->GoForward();
                    else if (LOWORD(wParam) == 103) window->Reload();
                    else if (LOWORD(wParam) == 104) window->Stop();
                    else if (LOWORD(wParam) == 105) window->LoadURL("frw://home");
                    else if (LOWORD(wParam) == 300) {
                        // Show favorites menu
                        window->ShowFavoritesMenu();
                    } else if (LOWORD(wParam) == 200) {
                        // Address bar - handle focus events
                        if (HIWORD(wParam) == EN_CHANGE) {
                            // Text changed, could update suggestions here
                        } else if (HIWORD(wParam) == EN_KILLFOCUS) {
                            // User left the address bar, load the URL
                            wchar_t buffer[1024];
                            GetWindowTextW(window->pImpl->hwndAddress, buffer, 1024);
                            std::wstring url(buffer);
                            std::string urlStr(url.begin(), url.end());
                            if (!urlStr.empty()) {
                                window->LoadURL(urlStr);
                            }
                        }
                    } else {
                        // Handle menu commands through MenuManager
                        // MenuManager will process the command ID
                    }
                    return 0;
                case WM_DESTROY:
                    PostQuitMessage(0);
                    return 0;
            }
        }
        return DefWindowProc(hwnd, msg, wParam, lParam);
    };
    
    wc.hInstance = GetModuleHandle(NULL);
    wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.lpszClassName = L"FRWBrowser";
    
    RegisterClassExW(&wc);
    
    // Create window
    RECT rc;
    GetClientRect(GetDesktopWindow(), &rc);
    
    pImpl->hwnd = CreateWindowExW(0, L"FRWBrowser", L"FRW Browser",
                                 WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN | WS_CLIPSIBLINGS,
                                 rc.left + 100, rc.top + 100,
                                 FRWCEF::DEFAULT_WIDTH, FRWCEF::DEFAULT_HEIGHT,
                                 NULL, NULL, GetModuleHandle(NULL), this);
    
    if (!pImpl->hwnd) {
        throw std::runtime_error("Failed to create browser window");
    }
    
    // Create UI components
    pImpl->CreateToolbar();
    pImpl->CreateAddressBar();
    pImpl->CreateFavoritesBar();
    pImpl->CreateStatusBar();
    
    // Create CEF browser
    CefWindowInfo window_info;
    CefBrowserSettings browser_settings;
    
    window_info.SetAsChild(pImpl->hwnd, CefRect(0, 30, FRWCEF::DEFAULT_WIDTH, FRWCEF::DEFAULT_HEIGHT - 50));
    
    // Most browser settings fields don't exist in CEF 142, using defaults
    browser_settings.webgl = STATE_ENABLED;
    
    std::string start_url = "file:///C:/Projects/FRW - Free Web Modern/apps/browser/dist/index.html";
    std::replace(start_url.begin(), start_url.end(), '\\', '/');
    
    CefRefPtr<FrwClient> client = new FrwClient();
    pImpl->browser = CefBrowserHost::CreateBrowserSync(window_info, client, start_url, browser_settings,
                                                        nullptr, nullptr);
#endif
}

void BrowserWindow::Show() {
#ifdef _WIN32
    ShowWindow(pImpl->hwnd, SW_SHOW);
    UpdateWindow(pImpl->hwnd);
#endif
}

void BrowserWindow::Hide() {
#ifdef _WIN32
    ShowWindow(pImpl->hwnd, SW_HIDE);
#endif
}

void BrowserWindow::Close() {
    if (pImpl->browser) {
        pImpl->browser->GetHost()->CloseBrowser(true);
    }
}

void BrowserWindow::LoadURL(const std::string& url) {
    pImpl->currentURL = url;
    
    // Add to history
    HistoryManager::Instance().AddEntry(url, "Loading...");
    
    // Load in active tab
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.LoadURL(activeTab->id, url);
    } else {
        // Create new tab if none exists
        tabManager.CreateNewTab(url);
    }
    
#ifdef _WIN32
    // Convert std::string to std::wstring properly
    std::wstring wurl(url.begin(), url.end());
    SetWindowTextW(pImpl->hwndAddress, wurl.c_str());
#endif
}

void BrowserWindow::GoBack() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.GoBack(activeTab->id);
    }
}

void BrowserWindow::GoForward() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.GoForward(activeTab->id);
    }
}

void BrowserWindow::Reload() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.ReloadTab(activeTab->id);
    }
}

void BrowserWindow::Stop() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab) {
        tabManager.StopTab(activeTab->id);
    }
}

void BrowserWindow::AddFavorite(const std::string& name, const std::string& url) {
    pImpl->favorites.push_back({name, url, ""});
    pImpl->SaveFavorites();
}

void BrowserWindow::RemoveFavorite(const std::string& url) {
    auto it = std::remove_if(pImpl->favorites.begin(), pImpl->favorites.end(),
                            [&url](const Favorite& fav) { return fav.url == url; });
    pImpl->favorites.erase(it, pImpl->favorites.end());
    pImpl->SaveFavorites();
}

std::vector<Favorite> BrowserWindow::GetFavorites() const {
    return pImpl->favorites;
}

void BrowserWindow::CreateMenuBar() {
#ifdef _WIN32
    MenuManager::Instance().CreateMenuBar(pImpl->hwnd);
#endif
}

void BrowserWindow::ShowSettings() {
    // TODO: Implement settings dialog
    LoadURL("frw://settings");
}

void BrowserWindow::ShowAbout() {
    // TODO: Implement about dialog
    LoadURL("frw://about");
}

void BrowserWindow::ShowDevTools() {
    auto& tabManager = TabManager::Instance();
    Tab* activeTab = tabManager.GetActiveTab();
    if (activeTab && activeTab->browser) {
        DevToolsManager::Instance().ShowDevTools(activeTab->browser);
    }
}

void BrowserWindow::UpdateTitle(const std::string& title) {
#ifdef _WIN32
    std::wstring windowTitle = L"FRW Browser" + std::wstring(L" - ") + std::wstring(title.begin(), title.end());
    SetWindowTextW(pImpl->hwnd, windowTitle.c_str());
#endif
}

void BrowserWindow::UpdateStatus(const std::string& status) {
#ifdef _WIN32
    SendMessage(pImpl->hwndStatus, SB_SETTEXT, 0, (LPARAM)std::wstring(status.begin(), status.end()).c_str());
#endif
}

void BrowserWindow::ShowLoading(bool loading) {
    pImpl->isLoading = loading;
    if (loading) {
        UpdateStatus("Loading...");
    } else {
        UpdateStatus("Ready");
    }
}

void BrowserWindow::ShowFavoritesMenu() {
    // TODO: Implement favorites dropdown menu
    // For now, load first favorite
    if (!pImpl->favorites.empty()) {
        LoadURL(pImpl->favorites[0].url);
    }
}
