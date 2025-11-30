#pragma once

#include "cef_app.h"
#include "cef_browser_process_handler.h"

class FrwApp : public CefApp, public CefBrowserProcessHandler {
public:
    FrwApp() = default;

    // CefApp methods
    void OnBeforeCommandLineProcessing(const CefString& process_type,
                                       CefRefPtr<CefCommandLine> command_line) override;

    // CefBrowserProcessHandler methods
    void OnContextInitialized() override;

private:
    IMPLEMENT_REFCOUNTING(FrwApp);
    DISALLOW_COPY_AND_ASSIGN(FrwApp);
};
