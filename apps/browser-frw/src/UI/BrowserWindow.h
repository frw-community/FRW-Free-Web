#pragma once

#include "cef_browser.h"
#include <string>
#include <vector>
#include <memory>

struct Favorite {
    std::string name;
    std::string url;
    std::string favicon;
};

class BrowserWindow {
public:
    BrowserWindow();
    ~BrowserWindow();

    // Window management
    void Create();
    void Show();
    void Hide();
    void Close();

    // Browser management
    void LoadURL(const std::string& url);
    void GoBack();
    void GoForward();
    void Reload();
    void Stop();

    // Favorites management
    void AddFavorite(const std::string& name, const std::string& url);
    void RemoveFavorite(const std::string& url);
    std::vector<Favorite> GetFavorites() const;

    // Menu management
    void CreateMenuBar();
    void ShowSettings();
    void ShowAbout();
    void ShowDevTools();
    void ShowFavoritesMenu();

    // Status and title
    void UpdateTitle(const std::string& title);
    void UpdateStatus(const std::string& status);
    void ShowLoading(bool loading);

private:
    class Impl;
    std::unique_ptr<Impl> pImpl;
};
