#pragma once

#include "cef_client.h"
#include "cef_browser.h"
#include "cef_command_line.h"
#include "wrapper/cef_closure_task.h"
#include "wrapper/cef_helpers.h"

class FrwBrowserDelegate : public CefClient,
                          public CefLifeSpanHandler,
                          public CefDisplayHandler {
public:
    static void CreateMainWindow();

    // CefClient methods
    CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override { return this; }
    CefRefPtr<CefDisplayHandler> GetDisplayHandler() override { return this; }

    // CefLifeSpanHandler methods
    void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
    void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

    // CefDisplayHandler methods
    void OnTitleChange(CefRefPtr<CefBrowser> browser,
                       const CefString& title) override;

private:
    FrwBrowserDelegate() = default;
    ~FrwBrowserDelegate() = default;

    void LoadInitialUI(CefRefPtr<CefBrowser> browser);

    IMPLEMENT_REFCOUNTING(FrwBrowserDelegate);
    DISALLOW_COPY_AND_ASSIGN(FrwBrowserDelegate);
};
