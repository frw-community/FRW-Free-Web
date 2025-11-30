#pragma once

#include "cef_resource_handler.h"
#include "cef_response.h"
#include "cef_request.h"
#include "cef_scheme.h"
#include "wrapper/cef_helpers.h"

class FrwSchemeHandler : public CefResourceHandler {
public:
    FrwSchemeHandler(const CefString& url);
    ~FrwSchemeHandler() override = default;

    // CefResourceHandler methods
    bool ProcessRequest(CefRefPtr<CefRequest> request,
                        CefRefPtr<CefCallback> callback) override;
    void GetResponseHeaders(CefRefPtr<CefResponse> response,
                            int64_t& response_length,
                            CefString& redirect_url) override;
    bool ReadResponse(void* data_out,
                      int bytes_to_read,
                      int& bytes_read,
                      CefRefPtr<CefCallback> callback) override;
    void Cancel() override;

private:
    CefString url_;
    std::string content_;
    size_t offset_;
    bool handled_;

    IMPLEMENT_REFCOUNTING(FrwSchemeHandler);
    DISALLOW_COPY_AND_ASSIGN(FrwSchemeHandler);
};

class FrwSchemeHandlerFactory : public CefSchemeHandlerFactory {
public:
    FrwSchemeHandlerFactory() = default;

    CefRefPtr<CefResourceHandler> Create(CefRefPtr<CefBrowser> browser,
                                        CefRefPtr<CefFrame> frame,
                                        const CefString& scheme_name,
                                        CefRefPtr<CefRequest> request) override;

private:
    IMPLEMENT_REFCOUNTING(FrwSchemeHandlerFactory);
    DISALLOW_COPY_AND_ASSIGN(FrwSchemeHandlerFactory);
};
