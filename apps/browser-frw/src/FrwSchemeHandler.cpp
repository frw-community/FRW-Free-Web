#include "FrwSchemeHandler.h"
#include "cef_parser.h"
#include "wrapper/cef_stream_resource_handler.h"
#include "UI/SettingsManager.h"

#include <regex>
#include <sstream>

// TODO: Replace with real resolver bridge calls
#include "ResolverBridge.h"

FrwSchemeHandler::FrwSchemeHandler(const CefString& url)
    : url_(url), offset_(0), handled_(false) {
}

bool FrwSchemeHandler::ProcessRequest(CefRefPtr<CefRequest> request,
                                       CefRefPtr<CefCallback> callback) {
    const std::string& url = request->GetURL();
    std::regex frw_regex(R"(frw://([^/]+)(/.*)?)");
    std::cmatch match;
    if (!std::regex_match(url.c_str(), match, frw_regex)) {
        handled_ = false;
        callback->Continue();
        return true;
    }

    std::string name = match[1].str();
    std::string path = match[2].str();
    if (path.empty()) path = "/index.html";

    // First resolve the name using FRW bootstrap nodes from settings
    std::vector<std::string> bootstrap_nodes = SettingsManager::Instance().GetBootstrapNodes();

    std::string cid;
    bool resolved = false;
    
    // Try each bootstrap node until we get a resolution
    for (const auto& node : bootstrap_nodes) {
        std::string resolve_url = node + "/api/resolve/" + name;
        if (ResolverBridge::ResolveFromBootstrapNode(resolve_url, cid)) {
            resolved = true;
            break;
        }
    }
    
    if (!resolved) {
        // Return a simple error page
        std::ostringstream html;
        html << "<!DOCTYPE html><html><head><title>FRW - Not Found</title></head><body>";
        html << "<h1>FRW Site Not Found</h1>";
        html << "<p>The site <strong>" << name << "</strong> could not be resolved.</p>";
        html << "<p>Checked " << bootstrap_nodes.size() << " bootstrap nodes.</p>";
        html << "</body></html>";
        content_ = html.str();
        handled_ = true;
        callback->Continue();
        return true;
    }

    // Now fetch content via IPFS gateways from settings
    std::vector<std::string> ipfs_gateways = SettingsManager::Instance().GetIPFSGateways();

    bool fetched = false;
    for (const auto& gw : ipfs_gateways) {
        std::string fetch_url = gw + "/ipfs/" + cid + path;
        if (ResolverBridge::FetchFromGateway(fetch_url, content_)) {
            fetched = true;
            break;
        }
    }

    if (!fetched) {
        std::ostringstream html;
        html << "<!DOCTYPE html><html><head><title>FRW - Fetch Error</title></head><body>";
        html << "<h1>FRW Content Unavailable</h1>";
        html << "<p>Content for <strong>" << name << "</strong> could not be fetched.</p>";
        html << "<p>CID: " << cid << "</p>";
        html << "</body></html>";
        content_ = html.str();
    }

    handled_ = true;
    callback->Continue();
    return true;
}

void FrwSchemeHandler::GetResponseHeaders(CefRefPtr<CefResponse> response,
                                           int64_t& response_length,
                                           CefString& redirect_url) {
    if (!handled_) {
        response_length = 0;
        response->SetStatus(404);
        response->SetMimeType("text/plain");
        return;
    }

    response_length = content_.size();
    response->SetStatus(200);

    // Simple MIME detection
    std::string url_str = url_.ToString();
    if (url_str.find(".html") != std::string::npos || content_.find("<!DOCTYPE") == 0) {
        response->SetMimeType("text/html");
    } else if (url_str.find(".css") != std::string::npos) {
        response->SetMimeType("text/css");
    } else if (url_str.find(".js") != std::string::npos) {
        response->SetMimeType("application/javascript");
    } else if (url_str.find(".json") != std::string::npos) {
        response->SetMimeType("application/json");
    } else if (url_str.find(".png") != std::string::npos) {
        response->SetMimeType("image/png");
    } else if (url_str.find(".jpg") != std::string::npos || url_str.find(".jpeg") != std::string::npos) {
        response->SetMimeType("image/jpeg");
    } else if (url_str.find(".gif") != std::string::npos) {
        response->SetMimeType("image/gif");
    } else if (url_str.find(".svg") != std::string::npos) {
        response->SetMimeType("image/svg+xml");
    } else {
        response->SetMimeType("text/plain");
    }
}

bool FrwSchemeHandler::ReadResponse(void* data_out,
                                     int bytes_to_read,
                                     int& bytes_read,
                                     CefRefPtr<CefCallback> callback) {
    if (!handled_ || offset_ >= content_.size()) {
        bytes_read = 0;
        return false;
    }

    int remaining = static_cast<int>(content_.size() - offset_);
    bytes_read = std::min(bytes_to_read, remaining);
    memcpy(data_out, content_.data() + offset_, bytes_read);
    offset_ += bytes_read;
    return bytes_read > 0;
}

void FrwSchemeHandler::Cancel() {
}

CefRefPtr<CefResourceHandler> FrwSchemeHandlerFactory::Create(CefRefPtr<CefBrowser> browser,
                                                              CefRefPtr<CefFrame> frame,
                                                              const CefString& scheme_name,
                                                              CefRefPtr<CefRequest> request) {
    return new FrwSchemeHandler(request->GetURL());
}
