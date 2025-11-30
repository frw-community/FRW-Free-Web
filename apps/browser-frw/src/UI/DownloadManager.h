#pragma once

#include <string>
#include <vector>
#include <chrono>
#include <memory>

enum class DownloadState {
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled
};

struct Download {
    int id;
    std::string url;
    std::string filename;
    std::string savePath;
    int64_t totalSize;
    int64_t receivedSize;
    DownloadState state;
    std::chrono::system_clock::time_point startTime;
    std::chrono::system_clock::time_point endTime;
    double speed; // bytes per second
    std::string errorMessage;
};

class DownloadManager {
public:
    static DownloadManager& Instance();
    
    // Download management
    int StartDownload(const std::string& url, const std::string& suggestedFilename = "");
    void CancelDownload(int downloadId);
    void RetryDownload(int downloadId);
    void RemoveDownload(int downloadId);
    void ClearCompleted();
    void ClearAll();
    
    // Download queries
    Download* GetDownload(int downloadId);
    std::vector<Download*> GetAllDownloads();
    std::vector<Download*> GetActiveDownloads();
    std::vector<Download*> GetCompletedDownloads();
    
    // Statistics
    int GetActiveDownloadCount() const;
    int64_t GetTotalDownloadSize() const;
    double GetCurrentDownloadSpeed() const;
    
    // Settings
    void SetDefaultDownloadPath(const std::string& path);
    std::string GetDefaultDownloadPath() const;

private:
    DownloadManager() : nextDownloadId_(1) {}
    std::vector<std::unique_ptr<Download>> downloads_;
    int nextDownloadId_;
    std::string defaultDownloadPath_;
    
    Download* FindDownload(int downloadId);
    std::string GenerateFilename(const std::string& url, const std::string& suggested);
    std::string GetDefaultDownloadDirectory() const;
};
