#pragma once

#include "cef_client.h"

class FrwClient : public CefClient,
                 public CefLifeSpanHandler,
                 public CefDisplayHandler,
                 public CefLoadHandler,
                 public CefContextMenuHandler {
public:
    FrwClient() = default;

    // CefClient methods
    CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override;
    CefRefPtr<CefDisplayHandler> GetDisplayHandler() override;
    CefRefPtr<CefLoadHandler> GetLoadHandler() override;
    CefRefPtr<CefContextMenuHandler> GetContextMenuHandler() override;

    // CefLifeSpanHandler methods
    void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
    void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

    // CefDisplayHandler methods
    void OnTitleChange(CefRefPtr<CefBrowser> browser,
                       const CefString& title) override;
    void OnAddressChange(CefRefPtr<CefBrowser> browser,
                         CefRefPtr<CefFrame> frame,
                         const CefString& url) override;

    // CefLoadHandler methods
    void OnLoadingStateChange(CefRefPtr<CefBrowser> browser,
                              bool isLoading,
                              bool canGoBack,
                              bool canGoForward) override;

    // CefContextMenuHandler methods
    void OnBeforeContextMenu(CefRefPtr<CefBrowser> browser,
                             CefRefPtr<CefFrame> frame,
                             CefRefPtr<CefContextMenuParams> params,
                             CefRefPtr<CefMenuModel> model) override;
    bool OnContextMenuCommand(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              CefRefPtr<CefContextMenuParams> params,
                              int command_id,
                              cef_event_flags_t event_flags) override;
    void OnContextMenuDismissed(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefFrame> frame) override;

private:
    IMPLEMENT_REFCOUNTING(FrwClient);
    DISALLOW_COPY_AND_ASSIGN(FrwClient);
};
