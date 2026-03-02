# DNS Configuration Guide

This guide is for operators deploying their own MCP DNS Registry. It covers how to publish your registry endpoint via DNS so that MCP clients can discover it automatically.

## How discovery works

MCP clients resolve a DNS TXT record on the `_mcp` subdomain of your domain. The record contains the registry endpoint URL. Clients that support the MCP DNS Registry specification will query this record before attempting to connect to any MCP server on your domain.

## TXT record format

```
_mcp.example.com IN TXT "mcp=1 endpoint=https://mcp.example.com registry=https://mcp.example.com/registry"
```

| Field | Required | Description |
|---|---|---|
| `mcp` | Yes | Protocol version. Currently `1`. |
| `endpoint` | Yes | Base URL of the MCP deployment. |
| `registry` | Yes | Full URL of the registry endpoint. |

## Reference implementation

The reference implementation at `mcp.mariothomas.com` uses the following record:

```
_mcp.mariothomas.com IN TXT "mcp=1 endpoint=https://mcp.mariothomas.com registry=https://mcp.mariothomas.com/registry"
```

Verify it with:

```bash
dig TXT _mcp.mariothomas.com +short
```

## Setting the record

### Route 53 (AWS)

In the AWS Console or via CLI:

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_mcp.example.com",
        "Type": "TXT",
        "TTL": 300,
        "ResourceRecords": [{
          "Value": "\"mcp=1 endpoint=https://mcp.example.com registry=https://mcp.example.com/registry\""
        }]
      }
    }]
  }'
```

### Cloudflare

Add a TXT record via the Cloudflare dashboard or API:

- **Name:** `_mcp`
- **Type:** `TXT`
- **Content:** `mcp=1 endpoint=https://mcp.example.com registry=https://mcp.example.com/registry`
- **TTL:** Auto

### Other providers

Add a TXT record with the name `_mcp` and the value `mcp=1 endpoint=https://mcp.example.com registry=https://mcp.example.com/registry`. The exact steps vary by provider but the record format is the same.

## TTL guidance

A TTL of 300 seconds (5 minutes) is recommended during initial deployment. Once stable, 3600 seconds (1 hour) is appropriate.

## Further reading

See [SPEC.md](SPEC.md) for the full specification, including the complete DNS record schema and versioning rules.