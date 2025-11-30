#include "App.h"
#include "cef_command_line.h"
#include "wrapper/cef_helpers.h"

#include "FrwSchemeHandler.h"

void FrwApp::OnBeforeCommandLineProcessing(const CefString& process_type,
                                           CefRefPtr<CefCommandLine> command_line) {
    // Disable GPU acceleration to avoid compatibility issues
    command_line->AppendSwitch("disable-gpu");
    // Disable WebRTC/other features not needed for FRW
    command_line->AppendSwitch("disable-webrtc");
    // Enable remote debugging on port 9222
    command_line->AppendSwitchWithValue("remote-debugging-port", "9222");
}

void FrwApp::OnContextInitialized() {
    // Register custom frw:// scheme
    CefRegisterSchemeHandlerFactory("frw", "frw", new FrwSchemeHandlerFactory());
}
