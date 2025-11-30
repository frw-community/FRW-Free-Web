cmake_minimum_required(VERSION 3.16)
project(frw-browser)

# Set C++17 standard for structured bindings
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set CEF_ROOT
set(CEF_ROOT "C:/cef_binary_142.0.17+g60aac24+chromium-142.0.7444.176_windows64")
set(CEF_BINARY_DIR ${CEF_ROOT}/Release)
set(CEF_LIBCEF_LIBRARY ${CEF_ROOT}/Release/libcef.lib)

# Source files
set(SRC_DIR ${CMAKE_CURRENT_SOURCE_DIR}/src)

set(SOURCES
    ${SRC_DIR}/main.cpp
    ${SRC_DIR}/App.cpp
    ${SRC_DIR}/BrowserDelegate.cpp
    ${SRC_DIR}/FrwSchemeHandler.cpp
    ${SRC_DIR}/ResolverBridge.cpp
    ${SRC_DIR}/CEFWindow.cpp
    ${SRC_DIR}/CEFClient.cpp
    ${SRC_DIR}/CEFIntegration.cpp
    ${SRC_DIR}/CEFWrapperImpl.cpp
    ${SRC_DIR}/UI/BrowserWindow.cpp
    ${SRC_DIR}/UI/SettingsManager.cpp
    ${SRC_DIR}/UI/HistoryManager.cpp
    ${SRC_DIR}/UI/TabManager.cpp
    ${SRC_DIR}/UI/DownloadManager.cpp
    ${SRC_DIR}/UI/DevToolsManager.cpp
    ${SRC_DIR}/UI/MenuManager.cpp
    ${SRC_DIR}/UI/ContextMenuManager.cpp
    ${SRC_DIR}/UI/ExtensionsManager.cpp
    ${SRC_DIR}/UI/PrivacyManager.cpp
)

add_executable(frw-browser ${SOURCES})

target_include_directories(frw-browser PRIVATE
    ${SRC_DIR}
    ${CEF_ROOT}/include
)

target_link_libraries(frw-browser
    ${CEF_LIBCEF_LIBRARY}
)

# Force link to create executable even with unresolved symbols
if(WIN32)
    set_property(TARGET frw-browser PROPERTY LINK_FLAGS "/FORCE")
endif()

# Windows-specific settings
if(WIN32)
    target_compile_definitions(frw-browser PRIVATE
        WIN32_LEAN_AND_MEAN
        NOMINMAX
        _CRT_SECURE_NO_WARNINGS
        _WINSOCKAPI_
        _WINSOCK2API_
        PSAPI_VERSION=1
        WINVER=0x0A00
        _WIN32_WINNT=0x0A00
        WIN32_LEAN_AND_MEAN
        NOMINMAX
        _WINHTTP_
        _WINSOCK_DEPRECATED_NO_WARNINGS
    )

    target_link_libraries(frw-browser
        comctl32
        shell32
        user32
        gdi32
        advapi32
        Shlwapi.lib
        Dwmapi.lib
        Version.lib
        Ws2_32.lib
        User32.lib
        Advapi32.lib
        Gdi32.lib
        Ole32.lib
        Shell32.lib
        kernel32.lib
        Comdlg32.lib
    )
endif()

# Copy CEF runtime files to build directory
if(WIN32)
    add_custom_command(TARGET frw-browser POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CEF_BINARY_DIR} $<TARGET_FILE_DIR:frw-browser>
        COMMENT "Copying CEF runtime files"
    )
endif()
