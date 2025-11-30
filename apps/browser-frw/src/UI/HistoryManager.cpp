#include "HistoryManager.h"
#include "../Utils.h"
#include <fstream>
#include <sstream>
#include <algorithm>
#include <locale>
#include <codecvt>
#include <filesystem>

#ifdef _WIN32
#include <windows.h>
#include <shlobj.h>
#endif

HistoryManager& HistoryManager::Instance() {
    static HistoryManager instance;
    return instance;
}

void HistoryManager::AddEntry(const std::string& url, const std::string& title) {
    // Check if entry already exists
    auto it = std::find_if(history_.begin(), history_.end(),
                           [&url](const HistoryEntry& entry) { return entry.url == url; });
    
    if (it != history_.end()) {
        // Update existing entry
        it->title = title;
        it->timestamp = std::chrono::system_clock::now();
        it->visitCount++;
    } else {
        // Add new entry
        HistoryEntry entry;
        entry.url = url;
        entry.title = title;
        entry.timestamp = std::chrono::system_clock::now();
        entry.visitCount = 1;
        history_.push_back(entry);
    }
    
    // Keep history size manageable (keep last 1000 entries)
    if (history_.size() > 1000) {
        std::sort(history_.begin(), history_.end(),
                  [](const HistoryEntry& a, const HistoryEntry& b) {
                      return a.timestamp > b.timestamp;
                  });
        history_.resize(1000);
    }
    
    SaveHistory();
}

void HistoryManager::RemoveEntry(const std::string& url) {
    history_.erase(std::remove_if(history_.begin(), history_.end(),
                                  [&url](const HistoryEntry& entry) { return entry.url == url; }),
                   history_.end());
    SaveHistory();
}

void HistoryManager::ClearHistory() {
    history_.clear();
    SaveHistory();
}

std::vector<HistoryEntry> HistoryManager::GetHistory() const {
    // Return sorted by most recent
    auto sorted = history_;
    std::sort(sorted.begin(), sorted.end(),
              [](const HistoryEntry& a, const HistoryEntry& b) {
                  return a.timestamp > b.timestamp;
              });
    return sorted;
}

std::vector<HistoryEntry> HistoryManager::SearchHistory(const std::string& query) const {
    std::vector<HistoryEntry> results;
    std::string lowerQuery = query;
    std::transform(lowerQuery.begin(), lowerQuery.end(), lowerQuery.begin(), ::tolower);
    
    for (const auto& entry : history_) {
        std::string lowerUrl = entry.url;
        std::string lowerTitle = entry.title;
        std::transform(lowerUrl.begin(), lowerUrl.end(), lowerUrl.begin(), ::tolower);
        std::transform(lowerTitle.begin(), lowerTitle.end(), lowerTitle.begin(), ::tolower);
        
        if (lowerUrl.find(lowerQuery) != std::string::npos ||
            lowerTitle.find(lowerQuery) != std::string::npos) {
            results.push_back(entry);
        }
    }
    
    // Sort by relevance (visit count and recency)
    std::sort(results.begin(), results.end(),
              [](const HistoryEntry& a, const HistoryEntry& b) {
                  if (a.visitCount != b.visitCount) {
                      return a.visitCount > b.visitCount;
                  }
                  return a.timestamp > b.timestamp;
              });
    
    return results;
}

std::vector<HistoryEntry> HistoryManager::GetRecentEntries(int count) const {
    auto sorted = history_;
    std::sort(sorted.begin(), sorted.end(),
              [](const HistoryEntry& a, const HistoryEntry& b) {
                  return a.timestamp > b.timestamp;
              });
    
    if (sorted.size() > static_cast<size_t>(count)) {
        sorted.resize(count);
    }
    
    return sorted;
}

std::vector<std::string> HistoryManager::GetSuggestions(const std::string& partial) const {
    std::vector<std::string> suggestions;
    std::string lowerPartial = partial;
    std::transform(lowerPartial.begin(), lowerPartial.end(), lowerPartial.begin(), ::tolower);
    
    for (const auto& entry : history_) {
        std::string lowerUrl = entry.url;
        std::transform(lowerUrl.begin(), lowerUrl.end(), lowerUrl.begin(), ::tolower);
        
        if (lowerUrl.find(lowerPartial) == 0) {
            suggestions.push_back(entry.url);
            if (suggestions.size() >= 10) break; // Limit suggestions
        }
    }
    
    return suggestions;
}

bool HistoryManager::LoadHistory() {
    std::string filePath = GetHistoryFilePath();
    std::ifstream file(filePath);
    
    if (!file.is_open()) {
        return true; // No history file yet, that's OK
    }
    
    try {
        std::string line;
        while (std::getline(file, line)) {
            // Parse CSV format: url,title,timestamp,visitCount
            std::stringstream ss(line);
            std::string field;
            std::vector<std::string> fields;
            
            while (std::getline(ss, field, ',')) {
                // Remove quotes if present
                if (field.size() >= 2 && field.front() == '"' && field.back() == '"') {
                    field = field.substr(1, field.size() - 2);
                }
                fields.push_back(field);
            }
            
            if (fields.size() >= 4) {
                HistoryEntry entry;
                entry.url = fields[0];
                entry.title = fields[1];
                
                // Parse timestamp
                std::tm tm = {};
                std::istringstream ss_time(fields[2]);
                ss_time >> std::get_time(&tm, "%Y-%m-%d %H:%M:%S");
                entry.timestamp = std::chrono::system_clock::from_time_t(std::mktime(&tm));
                
                // Parse visit count
                entry.visitCount = std::stoi(fields[3]);
                
                history_.push_back(entry);
            }
        }
        file.close();
        return true;
    } catch (...) {
        history_.clear();
        return false;
    }
}

bool HistoryManager::SaveHistory() {
    std::string filePath = GetHistoryFilePath();
    
    // Create directory if it doesn't exist
    std::filesystem::path dir = std::filesystem::path(filePath).parent_path();
    if (!std::filesystem::exists(dir)) {
        std::filesystem::create_directories(dir);
    }
    
    std::ofstream file(filePath);
    if (!file.is_open()) {
        return false;
    }
    
    for (const auto& entry : history_) {
        // Convert timestamp to string
        auto time_t = std::chrono::system_clock::to_time_t(entry.timestamp);
        std::tm tm = *std::localtime(&time_t);
        
        file << "\"" << entry.url << "\","
             << "\"" << entry.title << "\","
             << std::put_time(&tm, "%Y-%m-%d %H:%M:%S") << ","
             << entry.visitCount << "\n";
    }
    
    file.close();
    return true;
}

std::string HistoryManager::GetHistoryFilePath() const {
    std::string appDataDir;
#ifdef _WIN32
    wchar_t* path = nullptr;
    if (SUCCEEDED(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &path))) {
        appDataDir = Utils::WStringToString(std::wstring(path, wcslen(path)));
        CoTaskMemFree(path);
    }
    std::replace(appDataDir.begin(), appDataDir.end(), '\\', '/');
#else
    appDataDir = std::getenv("HOME") ? std::getenv("HOME") : "";
#endif
    
    return appDataDir + "/FRW Browser/history.csv";
}

void HistoryManager::CleanupOldEntries() {
    // Remove entries older than 6 months
    auto now = std::chrono::system_clock::now();
    auto six_months_ago = now - std::chrono::hours(24 * 30 * 6);
    
    history_.erase(std::remove_if(history_.begin(), history_.end(),
                                 [six_months_ago](const HistoryEntry& entry) {
                                     return entry.timestamp < six_months_ago;
                                 }),
                  history_.end());
}
