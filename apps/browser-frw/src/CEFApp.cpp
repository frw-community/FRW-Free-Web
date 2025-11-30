#include "CEFApp.h"
#include "include/cef_command_line.h"
#include "include/wrapper/cef_helpers.h"

void FrwApp::OnBeforeCommandLineProcessing(const CefString& process_type,
                                           CefRefPtr<CefCommandLine> command_line) {
    // Disable GPU acceleration to avoid compatibility issues
    command_line->AppendSwitch("disable-gpu");
    // Disable WebRTC/other features not needed for FRW
    command_line->AppendSwitch("disable-webrtc");
    // Enable remote debugging
    command_line->AppendSwitchWithValue("remote-debugging-port", "9222");
    // Allow loading local files
    command_line->AppendSwitch("allow-file-access-from-files");
    command_line->AppendSwitch("allow-file-access");
    // Disable features that might interfere
    command_line->AppendSwitch("disable-extensions");
    command_line->AppendSwitch("disable-plugins");
}

void FrwApp::OnContextInitialized() {
    // Custom scheme registration is now done in main.cpp
}
