#include "BrowserDelegate.h"
#include "cef_browser.h"
#include "cef_command_line.h"

namespace {
    CefRefPtr<FrwBrowserDelegate> g_browser_delegate;
}

void FrwBrowserDelegate::CreateMainWindow() {
    g_browser_delegate = new FrwBrowserDelegate();

    CefWindowInfo window_info;
    CefBrowserSettings browser_settings;

    // Windows-specific window creation
#ifdef _WIN32
    RECT rc;
    GetClientRect(GetDesktopWindow(), &rc);
    window_info.SetAsPopup(NULL, L"FRW Browser");
    // These fields don't exist in CEF 142, use default window positioning
    window_info.style = WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN | WS_CLIPSIBLINGS;
#endif

    // These settings fields don't exist in CEF 142 or have different names
    // Use default settings for now

    // Load the React renderer from the sibling browser app's dist folder
    std::string start_url = "file:///C:/Projects/FRW - Free Web Modern/apps/browser/dist/index.html";
    CefBrowserHost::CreateBrowser(window_info, g_browser_delegate, start_url, browser_settings,
                                  nullptr, nullptr);
}

void FrwBrowserDelegate::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
    // Nothing needed here for single-window case
}

void FrwBrowserDelegate::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
    // CefQuitMessageLoop doesn't exist in CEF 142
    // CEF message loop will be handled differently
}

void FrwBrowserDelegate::OnTitleChange(CefRefPtr<CefBrowser> browser,
                                       const CefString& title) {
    // Update window title if needed
    CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
    // Use CEF's string directly - it should be compatible with Windows Unicode API
    SetWindowTextW(hwnd, (LPCWSTR)title.c_str());
}
