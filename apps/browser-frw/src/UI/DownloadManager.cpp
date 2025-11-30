#include "DownloadManager.h"
#include "../Utils.h"
#include <algorithm>
#include <filesystem>
#include <sstream>
#include <regex>
#include <iomanip>
#include <locale>
#include <codecvt>

#ifdef _WIN32
#include <windows.h>
#include <shlobj.h>
#endif

DownloadManager& DownloadManager::Instance() {
    static DownloadManager instance;
    return instance;
}

int DownloadManager::StartDownload(const std::string& url, const std::string& suggestedFilename) {
    auto download = std::make_unique<Download>();
    download->id = nextDownloadId_++;
    download->url = url;
    download->filename = GenerateFilename(url, suggestedFilename);
    download->savePath = GetDefaultDownloadDirectory() + "/" + download->filename;
    download->totalSize = 0;
    download->receivedSize = 0;
    download->state = DownloadState::Pending;
    download->startTime = std::chrono::system_clock::now();
    download->speed = 0.0;
    
    // TODO: Start actual download using CEF or HTTP client
    // For now, simulate download
    download->state = DownloadState::InProgress;
    
    int downloadId = download->id;
    downloads_.push_back(std::move(download));
    
    return downloadId;
}

void DownloadManager::CancelDownload(int downloadId) {
    Download* download = FindDownload(downloadId);
    if (download && (download->state == DownloadState::Pending || download->state == DownloadState::InProgress)) {
        download->state = DownloadState::Cancelled;
        download->endTime = std::chrono::system_clock::now();
        // TODO: Cancel actual download
    }
}

void DownloadManager::RetryDownload(int downloadId) {
    Download* download = FindDownload(downloadId);
    if (download && (download->state == DownloadState::Failed || download->state == DownloadState::Cancelled)) {
        // Reset download state
        download->receivedSize = 0;
        download->state = DownloadState::Pending;
        download->startTime = std::chrono::system_clock::now();
        download->speed = 0.0;
        download->errorMessage.clear();
        // TODO: Restart download
    }
}

void DownloadManager::RemoveDownload(int downloadId) {
    downloads_.erase(std::remove_if(downloads_.begin(), downloads_.end(),
                                   [downloadId](const auto& d) { return d->id == downloadId; }),
                    downloads_.end());
}

void DownloadManager::ClearCompleted() {
    downloads_.erase(std::remove_if(downloads_.begin(), downloads_.end(),
                                   [](const auto& d) { 
                                       return d->state == DownloadState::Completed || 
                                              d->state == DownloadState::Failed || 
                                              d->state == DownloadState::Cancelled; 
                                   }),
                    downloads_.end());
}

void DownloadManager::ClearAll() {
    // Cancel all active downloads first
    for (auto& download : downloads_) {
        if (download->state == DownloadState::Pending || download->state == DownloadState::InProgress) {
            download->state = DownloadState::Cancelled;
            download->endTime = std::chrono::system_clock::now();
        }
    }
    downloads_.clear();
}

Download* DownloadManager::GetDownload(int downloadId) {
    return FindDownload(downloadId);
}

std::vector<Download*> DownloadManager::GetAllDownloads() {
    std::vector<Download*> result;
    for (const auto& download : downloads_) {
        result.push_back(download.get());
    }
    return result;
}

std::vector<Download*> DownloadManager::GetActiveDownloads() {
    std::vector<Download*> result;
    for (const auto& download : downloads_) {
        if (download->state == DownloadState::Pending || download->state == DownloadState::InProgress) {
            result.push_back(download.get());
        }
    }
    return result;
}

std::vector<Download*> DownloadManager::GetCompletedDownloads() {
    std::vector<Download*> result;
    for (const auto& download : downloads_) {
        if (download->state == DownloadState::Completed) {
            result.push_back(download.get());
        }
    }
    return result;
}

int DownloadManager::GetActiveDownloadCount() const {
    int count = 0;
    for (const auto& download : downloads_) {
        if (download->state == DownloadState::Pending || download->state == DownloadState::InProgress) {
            count++;
        }
    }
    return count;
}

int64_t DownloadManager::GetTotalDownloadSize() const {
    int64_t total = 0;
    for (const auto& download : downloads_) {
        if (download->state == DownloadState::Completed) {
            total += download->totalSize;
        }
    }
    return total;
}

double DownloadManager::GetCurrentDownloadSpeed() const {
    double totalSpeed = 0.0;
    for (const auto& download : downloads_) {
        if (download->state == DownloadState::InProgress) {
            totalSpeed += download->speed;
        }
    }
    return totalSpeed;
}

void DownloadManager::SetDefaultDownloadPath(const std::string& path) {
    defaultDownloadPath_ = path;
}

std::string DownloadManager::GetDefaultDownloadPath() const {
    return defaultDownloadPath_.empty() ? GetDefaultDownloadDirectory() : defaultDownloadPath_;
}

Download* DownloadManager::FindDownload(int downloadId) {
    auto it = std::find_if(downloads_.begin(), downloads_.end(),
                          [downloadId](const auto& d) { return d->id == downloadId; });
    return (it != downloads_.end()) ? it->get() : nullptr;
}

std::string DownloadManager::GenerateFilename(const std::string& url, const std::string& suggested) {
    if (!suggested.empty()) {
        return suggested;
    }
    
    // Extract filename from URL
    std::regex filename_regex(R"([^/]+\.(?:html|htm|css|js|png|jpg|jpeg|gif|svg|pdf|txt|json|xml)$)");
    std::smatch match;
    if (std::regex_search(url, match, filename_regex)) {
        return match[0].str();
    }
    
    // Default filename
    return "download";
}

std::string DownloadManager::GetDefaultDownloadDirectory() const {
    std::string downloadDir;
    
#ifdef _WIN32
    wchar_t* path = nullptr;
    if (SUCCEEDED(SHGetKnownFolderPath(FOLDERID_Downloads, 0, nullptr, &path))) {
        downloadDir = Utils::WStringToString(std::wstring(path, wcslen(path)));
        CoTaskMemFree(path);
    }
    std::replace(downloadDir.begin(), downloadDir.end(), '\\', '/');
#else
    downloadDir = std::getenv("HOME") ? std::string(std::getenv("HOME")) + "/Downloads" : "";
#endif
    
    // Create directory if it doesn't exist
    if (!downloadDir.empty() && !std::filesystem::exists(downloadDir)) {
        std::filesystem::create_directories(downloadDir);
    }
    
    return downloadDir;
}
