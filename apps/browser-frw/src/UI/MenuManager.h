#pragma once

#include <string>
#include <vector>
#include <functional>

#ifdef _WIN32
#include <windows.h>
#endif

struct MenuItem {
    int id;
    std::string text;
    std::string shortcut;
    bool enabled;
    bool checked;
    std::vector<MenuItem> subItems;
    std::function<void()> action;
};

class MenuManager {
public:
    static MenuManager& Instance();
    
    // Menu creation and management
    void CreateMenuBar(HWND hwnd);
    void UpdateMenuStates();
    void EnableMenuItem(int menuId, bool enabled);
    void CheckMenuItem(int menuId, bool checked);
    
    // Menu categories
    void CreateFileMenu(HMENU hMenu);
    void CreateEditMenu(HMENU hMenu);
    void CreateViewMenu(HMENU hMenu);
    void CreateHistoryMenu(HMENU hMenu);
    void CreateBookmarksMenu(HMENU hMenu);
    void CreateToolsMenu(HMENU hMENU);
    void CreateHelpMenu(HMENU hMenu);
    void CreateFRWMenu(HMENU hMenu);
    
    // Menu actions
    void OnFileNewWindow();
    void OnFileNewTab();
    void OnFileNewIncognitoWindow();
    void OnFileOpenFile();
    void OnFileSavePageAs();
    void OnFilePrint();
    void OnFileExit();
    
    void OnEditUndo();
    void OnEditRedo();
    void OnEditCut();
    void OnEditCopy();
    void OnEditPaste();
    void OnEditSelectAll();
    void OnEditFind();
    
    void OnViewAlwaysOnTop();
    void OnViewFullscreen();
    void OnViewZoomIn();
    void OnViewZoomOut();
    void OnViewZoomReset();
    void OnViewActualSize();
    void OnViewEncoding(const std::string& encoding);
    void OnViewDeveloperTools();
    void OnViewTaskManager();
    void OnViewExtensions();
    
    void OnHistoryBack();
    void OnHistoryForward();
    void OnHistoryHome();
    void OnHistoryShowHistory();
    void OnHistoryClearHistory();
    
    void OnBookmarksAddBookmark();
    void OnBookmarksShowBookmarks();
    void OnBookmarksBookmarkAllTabs();
    void OnBookmarkClick(const std::string& url);
    
    void OnToolsDownloads();
    void OnToolsExtensions();
    void OnToolsSettings();
    void OnToolsTaskManager();
    void OnToolsClearBrowsingData();
    void OnToolsImportBookmarks();
    void OnToolsExportBookmarks();
    
    void OnHelpAbout();
    void OnHelpHelpCenter();
    void OnHelpReportIssue();
    
    // FRW-specific menu actions
    void OnFRWRegisterName();
    void OnFRWPublishSite();
    void OnFRWManageNames();
    void OnFRWBootstrapNodes();
    void OnFRWIPFSStatus();
    void OnFRWNetworkStats();
    void OnFRWSettings();

private:
    MenuManager() = default;
    HWND hwnd_;
    std::vector<MenuItem> menuItems_;
    
    void CreateMenuItem(HMENU hMenu, const std::string& text, int id, const std::string& shortcut = "");
    void CreateSeparator(HMENU hMenu);
    void CreateSubMenu(HMENU hMenu, const std::string& text, HMENU& hSubMenu);
};
