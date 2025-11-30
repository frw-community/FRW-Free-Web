#include "CEFConfig.h"
#include "cef_browser.h"
#include "CEFClient.h"
#include "internal/cef_types_wrappers.h"

#ifdef _WIN32
#include <windows.h>
#endif

namespace FRWCEF {

void CreateBrowserWindow() {
    CefWindowInfo window_info;
    CefBrowserSettings browser_settings;

#ifdef _WIN32
    RECT rc;
    GetClientRect(GetDesktopWindow(), &rc);
    window_info.SetAsPopup(NULL, L"FRW Browser");
    // x, y, width, height fields don't exist in CEF 142
    // window_info.x = rc.left + 100;
    // window_info.y = rc.top + 100;  
    // window_info.width = DEFAULT_WIDTH;
    // window_info.height = DEFAULT_HEIGHT;
    window_info.style = WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN | WS_CLIPSIBLINGS;
    window_info.ex_style = WS_EX_APPWINDOW;
#endif

    // Configure browser settings
    // Most settings don't exist in CEF 142, using defaults
    browser_settings.webgl = STATE_ENABLED;

    // Load the React renderer from the sibling browser app's dist folder
    std::string start_url = "file:///C:/Projects/FRW - Free Web Modern/apps/browser/dist/index.html";

    // Normalize path separators for file:// URLs
    std::replace(start_url.begin(), start_url.end(), '\\', '/');

    CefRefPtr<FrwClient> delegate = new FrwClient();
    CefBrowserHost::CreateBrowser(window_info, delegate, start_url, browser_settings,
                                  nullptr, nullptr);
}

} // namespace FRWCEF
