#include "ResolverBridge.h"
#include "UI/SettingsManager.h"
#include <iostream>
#include <sstream>
#include <regex>
#include <future>
#include <thread>

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#pragma comment(lib, "winhttp.lib")
#else
// Add Linux/macOS HTTP client later if needed
#endif

std::vector<std::string> ResolverBridge::GetBootstrapUrls() {
    // Use configured bootstrap nodes from settings
    return SettingsManager::Instance().GetBootstrapNodes();
}

bool ResolverBridge::ResolveFromBootstrapNode(const std::string& bootstrap_url, std::string& out_cid) {
    std::string response;
    bool ok = FetchFromGateway(bootstrap_url, response);
    if (ok) {
        // Parse JSON for contentCID field
        std::regex cid_regex("\"contentCID\"\\s*:\\s*\"([^\"]+)\"");
        std::smatch match;
        if (std::regex_search(response, match, cid_regex)) {
            out_cid = match[1].str();
            return true;
        }
    }
    return false;
}

bool ResolverBridge::QueryBootstrapNodes(const std::string& name, std::string& out_cid) {
    auto nodes = GetBootstrapUrls();
    std::vector<std::future<std::pair<std::string, bool>>> futures;

    for (const auto& node : nodes) {
        futures.emplace_back(std::async(std::launch::async, [node, name]() -> std::pair<std::string, bool> {
            std::string url = node + "/api/resolve/" + name;
            std::string response;
            bool ok = FetchFromGateway(url, response);
            if (ok) {
                // Parse JSON for contentCID field
                std::regex cid_regex("\"contentCID\"\\s*:\\s*\"([^\"]+)\"");
                std::smatch match;
                if (std::regex_search(response, match, cid_regex)) {
                    return {match[1].str(), true};
                }
            }
            return {"", false};
        }));
    }

    // Wait for first successful response
    for (auto& f : futures) {
        auto [cid, ok] = f.get();
        if (ok && !cid.empty()) {
            out_cid = cid;
            return true;
        }
    }
    return false;
}

bool ResolverBridge::ResolveName(const std::string& name, std::string& out_cid) {
    return QueryBootstrapNodes(name, out_cid);
}

bool ResolverBridge::FetchFromGateway(const std::string& url, std::string& out_content) {
    out_content.clear();

#ifdef _WIN32
    // Use WinHTTP for Windows
    std::wstring host, path;
    BOOL secure = FALSE;
    INTERNET_PORT port = 80;

    // Parse URL (very naive, just for demo)
    std::wregex url_regex(L"^(https?://)([^:/]+)(?::(\\d+))?(/.*)?$");
    std::wsmatch match;
    std::wstring wurl(url.begin(), url.end());
    if (!std::regex_match(wurl, match, url_regex)) return false;

    secure = match[1].str() == L"https://";
    host = match[2].str();
    if (match[3].matched) {
        port = static_cast<INTERNET_PORT>(std::stoul(match[3].str()));
    } else {
        port = secure ? 443 : 80;
    }
    path = match[4].matched ? match[4].str() : L"/";

    HINTERNET hSession = WinHttpOpen(L"FRW Browser/1.0", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
                                    WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!hSession) return false;

    HINTERNET hConnect = WinHttpConnect(hSession, host.c_str(), port, 0);
    if (!hConnect) {
        WinHttpCloseHandle(hSession);
        return false;
    }

    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"GET", path.c_str(),
                                            NULL, WINHTTP_NO_REFERER,
                                            WINHTTP_DEFAULT_ACCEPT_TYPES,
                                            secure ? WINHTTP_FLAG_SECURE : 0);
    if (!hRequest) {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }

    BOOL result = WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
                                     WINHTTP_NO_REQUEST_DATA, 0, 0, 0);
    if (!result) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }

    result = WinHttpReceiveResponse(hRequest, NULL);
    if (!result) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }

    DWORD status_code = 0;
    DWORD size = sizeof(status_code);
    WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                        WINHTTP_HEADER_NAME_BY_INDEX, &status_code, &size, WINHTTP_NO_HEADER_INDEX);

    if (status_code != 200) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }

    DWORD available = 0;
    do {
        if (!WinHttpQueryDataAvailable(hRequest, &available)) break;
        if (available > 0) {
            std::vector<char> buffer(available + 1);
            DWORD downloaded = 0;
            if (WinHttpReadData(hRequest, buffer.data(), available, &downloaded)) {
                buffer[downloaded] = '\0';
                out_content.append(buffer.data(), downloaded);
            }
        }
    } while (available > 0);

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return !out_content.empty();
#else
    // TODO: Add libcurl or similar for Linux/macOS
    return false;
#endif
}
