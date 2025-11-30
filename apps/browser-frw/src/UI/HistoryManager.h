#pragma once

#include <string>
#include <vector>
#include <chrono>

struct HistoryEntry {
    std::string url;
    std::string title;
    std::chrono::system_clock::time_point timestamp;
    int visitCount;
};

class HistoryManager {
public:
    static HistoryManager& Instance();
    
    // History management
    void AddEntry(const std::string& url, const std::string& title);
    void RemoveEntry(const std::string& url);
    void ClearHistory();
    
    // Query history
    std::vector<HistoryEntry> GetHistory() const;
    std::vector<HistoryEntry> SearchHistory(const std::string& query) const;
    std::vector<HistoryEntry> GetRecentEntries(int count = 10) const;
    
    // Auto-complete suggestions
    std::vector<std::string> GetSuggestions(const std::string& partial) const;
    
    // Persistence
    bool LoadHistory();
    bool SaveHistory();

private:
    HistoryManager() = default;
    std::vector<HistoryEntry> history_;
    std::string historyFile_;
    
    std::string GetHistoryFilePath() const;
    void CleanupOldEntries();
};
