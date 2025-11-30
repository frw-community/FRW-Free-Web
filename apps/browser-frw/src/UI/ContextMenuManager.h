#pragma once

#include "cef_browser.h"
#include "cef_context_menu_handler.h"
#include <string>
#include <vector>

enum class ContextMenuContext {
    Page,
    Frame,
    Link,
    Image,
    Media,
    Editable,
    Selected
};

class ContextMenuManager : public CefContextMenuHandler {
public:
    static ContextMenuManager& Instance();
    
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
    ContextMenuManager() = default;
    
    // Context menu builders
    void BuildPageMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params);
    void BuildLinkMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params);
    void BuildImageMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params);
    void BuildMediaMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params);
    void BuildEditableMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params);
    void BuildSelectionMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params);
    void BuildFRWMenu(CefRefPtr<CefMenuModel> model, CefRefPtr<CefContextMenuParams> params);
    
    // Menu action handlers
    void OnBack();
    void OnForward();
    void OnReload();
    void OnViewSource();
    void OnInspectElement();
    void OnAddToBookmarks();
    void OnSavePageAs();
    void OnPrintPage();
    void OnTranslatePage();
    
    void OnOpenLink();
    void OnOpenLinkInNewTab();
    void OnOpenLinkInIncognitoTab();
    void OnCopyLinkAddress();
    void OnSaveLinkAs();
    void OnSendLinkTo();
    
    void OnOpenImage();
    void OnOpenImageInNewTab();
    void OnSaveImageAs();
    void OnCopyImage();
    void OnCopyImageAddress();
    void OnSearchImageWithGoogle();
    
    void OnPlay();
    void OnPause();
    void OnMute();
    void OnUnmute();
    void OnToggleControls();
    void OnToggleLoop();
    void OnSaveMedia();
    void OnCopyMediaAddress();
    
    void OnUndo();
    void OnRedo();
    void OnCut();
    void OnCopy();
    void OnPaste();
    void OnDelete();
    void OnSelectAll();
    
    void OnSearchSelection();
    void OnCopySelection();
    void OnTranslateSelection();
    
    // FRW-specific actions
    void OnRegisterAsFRWName();
    void OnPublishToFRW();
    void OnViewFRWInfo();
    void OnCopyFRWLink();
    void OnShareOnFRW();
    
    IMPLEMENT_REFCOUNTING(ContextMenuManager);
    DISALLOW_COPY_AND_ASSIGN(ContextMenuManager);
};
