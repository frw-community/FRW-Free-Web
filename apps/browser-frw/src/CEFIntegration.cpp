#include "CEFConfig.h"
#include "cef_app.h"
#include "CEFApp.h"
#include "CEFWindow.h"
#include "FrwSchemeHandler.h"

#ifdef _WIN32
#include <windows.h>
#endif

namespace FRWCEF {

void InitializeCEF(int argc, char* argv[]) {
    void* sandbox_info = nullptr;
    CefMainArgs main_args(GetModuleHandle(NULL));

    CefRefPtr<FrwApp> app(new FrwApp);

    CefSettings settings;
    settings.multi_threaded_message_loop = false;
    settings.no_sandbox = true;

#ifdef _WIN32
    CefString(&settings.browser_subprocess_path).FromWString(L"frw-browser subprocess.exe");
#else
    CefString(&settings.browser_subprocess_path).FromString("frw-browser subprocess");
#endif

    CefInitialize(main_args, settings, app.get(), sandbox_info);
}

void RunMessageLoop() {
    CefRunMessageLoop();
}

void ShutdownCEF() {
    CefShutdown();
}

} // namespace FRWCEF
