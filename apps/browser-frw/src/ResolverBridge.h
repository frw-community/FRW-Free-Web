#pragma once

#include <string>
#include <vector>

class ResolverBridge {
public:
    // Resolve an FRW name to a content CID
    static bool ResolveName(const std::string& name, std::string& out_cid);

    // Resolve an FRW name using a specific bootstrap node
    static bool ResolveFromBootstrapNode(const std::string& bootstrap_url, std::string& out_cid);

    // Fetch raw content from an IPFS gateway
    static bool FetchFromGateway(const std::string& url, std::string& out_content);

private:
    static bool QueryBootstrapNodes(const std::string& name, std::string& out_cid);
    static std::vector<std::string> GetBootstrapUrls();
};
