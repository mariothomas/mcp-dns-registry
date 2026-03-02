# Client Usage Guide

This guide shows how to query the MCP DNS Registry at `mcp.mariothomas.com` using curl.

All endpoints use JSON-RPC 2.0 over HTTP POST.

## Discovery

The registry is discoverable via a DNS TXT record. Resolve it to find the registry endpoint:

```bash
dig TXT _mcp.mariothomas.com +short
```

See [DNS.md](DNS.md) for the full DNS record format and operator guidance.

## Registry

### List available tools

```bash
curl -X POST https://mcp.mariothomas.com/registry \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Discover all servers

```bash
curl -X POST https://mcp.mariothomas.com/registry \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"discover_servers","arguments":{}}}'
```

### Get details for a specific server

```bash
curl -X POST https://mcp.mariothomas.com/registry \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_server_details","arguments":{"server_id":"articles"}}}'
```

## Articles

### List available tools

```bash
curl -X POST https://mcp.mariothomas.com/articles \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### List all articles

```bash
curl -X POST https://mcp.mariothomas.com/articles \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_articles","arguments":{}}}'
```

### Filter articles by tag

```bash
curl -X POST https://mcp.mariothomas.com/articles \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_articles","arguments":{"tag":"ai-governance"}}}'
```

### Filter articles by date range

```bash
curl -X POST https://mcp.mariothomas.com/articles \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_articles","arguments":{"after":"2025-01-01","before":"2025-12-31"}}}'
```

### Get a specific article summary

```bash
curl -X POST https://mcp.mariothomas.com/articles \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_article_summary","arguments":{"slug":"your-article-slug"}}}'
```

## Locations

### List available tools

```bash
curl -X POST https://mcp.mariothomas.com/locations \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### List all locations

```bash
curl -X POST https://mcp.mariothomas.com/locations \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_locations","arguments":{}}}'
```

### Filter locations by country

```bash
curl -X POST https://mcp.mariothomas.com/locations \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_locations","arguments":{"country":"United Kingdom"}}}'
```

### Get a specific location

```bash
curl -X POST https://mcp.mariothomas.com/locations \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_location_detail","arguments":{"location_id":"your-location-id"}}}'
```

## Documents (authenticated)

The documents server requires a Bearer token. This demonstrates the authentication pattern described in the [specification](SPEC.md).

To request an access token, open an issue or contact the repository maintainer.

### List available tools

```bash
curl -X POST https://mcp.mariothomas.com/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### List all documents

```bash
curl -X POST https://mcp.mariothomas.com/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_documents","arguments":{}}}'
```

### Get a specific document

```bash
curl -X POST https://mcp.mariothomas.com/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_document_metadata","arguments":{"doc_id":"your-doc-id"}}}'
```