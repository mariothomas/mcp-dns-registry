# The `_mcp` DNS Convention
## Specification v1.3 — March 2026

This document specifies the `_mcp` TXT DNS record convention for MCP registry discovery. It is the normative reference for the convention described in the architecture paper.

---

## 1. Overview

An organisation wishing to expose an MCP registry publishes a single DNS TXT record at the well-known subdomain `_mcp.{domain}`. Any compliant AI agent that knows the organisation's domain can discover its MCP ecosystem from this record alone.

---

## 2. Record Format

The record takes the following form:

```
_mcp.example.com.  300  IN  TXT  "v=mcp1;
  registry=https://mcp.example.com/registry;
  public=true;
  auth=https://auth.example.com/token;
  version=2026-02"
```

### 2.1 Fields

| Field | Required | Description |
|-------|----------|-------------|
| `v` | Yes | Protocol version. Must be `mcp1` for this version of the convention. |
| `registry` | Yes | HTTPS URL of the organisation's MCP registry. Must be a fully qualified URL including scheme. |
| `public` | Yes | Boolean (`true` or `false`). Indicates whether unauthenticated agents may query the public registry. |
| `auth` | Conditional | HTTPS URL of the OAuth 2.0/2.1 token endpoint. Required when `public=false` or when private servers exist alongside public ones. |
| `version` | Recommended | MCP protocol version supported, in `YYYY-MM` format. |

### 2.2 Field Syntax

- Fields are separated by semicolons.
- Whitespace around semicolons and field values is permitted and should be ignored by parsers.
- Field names are case-insensitive. Values are case-sensitive except for the boolean `public` field.
- Unknown fields must be ignored by compliant agents to allow forward compatibility.

### 2.3 TTL

A TTL of 300 to 900 seconds (5 to 15 minutes) is recommended. Shorter TTLs increase DNS query volume; longer TTLs slow propagation of updates. Agents should respect the TTL and not cache the record beyond it.

### 2.4 Registry URL Patterns

The `registry=` field in the DNS record is the URL of the registry root. The convention does not mandate how individual MCP servers are addressed relative to that root. Two patterns are supported:

**Path-based:** the registry and all MCP servers share a single domain, differentiated by URL path. The `registry=` field includes the path to the registry endpoint:

```
registry=https://mcp.example.com/registry
```

Individual servers are then addressed at paths such as `https://mcp.example.com/articles` and `https://mcp.example.com/locations`. This pattern requires a single CloudFront distribution, a single certificate, and simpler DNS configuration. The trade-off is that all servers share the same deployment lifecycle. This pattern is well suited to small teams operating all servers centrally.

**Subdomain-based:** each MCP server has its own subdomain under the registry domain. The `registry=` field points to the registry root with no path:

```
registry=https://mcp.example.com
```

Individual servers are then addressable at subdomains such as `https://articles.mcp.example.com` and `https://locations.mcp.example.com`. This pattern requires a wildcard certificate for `*.mcp.example.com` — note that a single-level wildcard such as `*.example.com` does not cover two levels of subdomain. The benefit is genuine independence: each server can be deployed, updated, and owned by a different team without touching shared infrastructure. This pattern is better suited to larger organisations where different teams own different MCP servers.

Both patterns are fully compliant with this convention. Implementers should choose based on their organisational structure, team ownership model, and operational preferences.

**Important:** compliant agents must not infer the address of individual MCP servers from the registry URL. Server addresses are always returned explicitly by the registry in response to a `discover_servers` call. The URL pattern is an implementation detail of the registry operator, not a property of the convention.

---

## 3. Scope

The `_mcp` record is **organisation-scoped**. It advertises the registry for a given domain — the directory of MCP servers that organisation exposes. It does not advertise individual MCP servers directly.

This distinguishes it from per-server DNS primitives such as those proposed in SEP #1959, which operate at the individual server level. The two conventions are designed to stack: an agent uses the `_mcp` record to find the registry, the registry to find servers, and per-server DNS records to verify individual server identity.

---

## 4. What This Convention Does Not Address

**Authentication and authorisation.** The `_mcp` record is a discovery primitive. The `auth=` field is a pointer to a token endpoint — it is a signpost, not a gate. Authentication and authorisation are the responsibility of the registry and of each individual MCP server. The DNS record itself carries no authentication state.

**Tool capability enumeration.** The registry lists servers, not the tools or capabilities beneath them. An agent that retrieves the server manifest knows which MCP servers exist. It does not yet know what those servers can do. Tool enumeration requires a subsequent `tools/list` call to each individual server. Discovery and capability enumeration are sequential steps.

**Server verification.** The record points to a registry. It does not cryptographically verify the identity of the registry or the servers it lists. DNSSEC, where deployed and validated, provides integrity guarantees on the DNS record itself. Registry-level and server-level authentication are separate concerns.

---

## 5. DNSSEC

Organisations publishing `_mcp` records should sign their DNS zones with DNSSEC. Without DNSSEC, an attacker capable of poisoning the DNS cache of a target agent could redirect it to a malicious registry. Agents consuming `_mcp` records should validate DNSSEC signatures where possible and treat unsigned records with appropriate caution.

---

## 6. Relationship to IANA

This convention uses the existing TXT record type with an underscore-prefixed label, following the pattern established by `_dmarc`, `_domainkey`, and similar conventions. The `_mcp` label is defined per RFC 8552, which scopes the interpretation of TXT records to the specific service identified by the underscore label.

Formal IANA registration of the `_mcp` underscore label is a future action, pending adoption. This document constitutes the documentation of `_mcp` for the purpose of RFC 8552 collision avoidance.

---

## 7. Example Records

**Public registry, no authentication required (path-based):**
```
_mcp.example.com.  300  IN  TXT  "v=mcp1;registry=https://mcp.example.com/registry;public=true;version=2026-02"
```

**Public registry, no authentication required (subdomain-based):**
```
_mcp.example.com.  300  IN  TXT  "v=mcp1;registry=https://mcp.example.com;public=true;version=2026-02"
```

**Registry with both public and private servers (path-based):**
```
_mcp.example.com.  300  IN  TXT  "v=mcp1;registry=https://mcp.example.com/registry;public=true;auth=https://auth.example.com/token;version=2026-02"
```

**Registry with both public and private servers (subdomain-based):**
```
_mcp.example.com.  300  IN  TXT  "v=mcp1;registry=https://mcp.example.com;public=true;auth=https://auth.example.com/token;version=2026-02"
```

**Fully private registry:**
```
_mcp.example.com.  300  IN  TXT  "v=mcp1;registry=https://mcp.example.com;public=false;auth=https://auth.example.com/token;version=2026-02"
```

**Live reference implementation (subdomain-based):**
```
_mcp.mariothomas.com.  300  IN  TXT  "v=mcp1;registry=https://mcp.mariothomas.com;public=true;auth=https://auth.mariothomas.com/token;version=2026-02"
```

---

## 8. Discovery Flow

An agent implementing this convention follows these steps:

1. Query DNS for `_mcp.{domain}` TXT record
2. Parse the record to extract `registry`, `public`, and `auth` fields
3. If authentication is required (or private servers are desired), obtain a bearer token from the `auth` endpoint
4. Connect to the `registry` URL and call `tools/list` to receive the registry tool manifest
5. Call `discover_servers` (or equivalent) to retrieve the server manifest
6. Connect to individual MCP servers as needed and call `tools/list` on each to enumerate capabilities

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 25 February 2026 | Initial specification. |
| 1.1 | 27 February 2026 | Added Section 4 — What This Convention Does Not Address — explicitly scoping authentication, authorisation, and tool capability enumeration as out of scope for the DNS layer. |
| 1.3 | 2 March 2026 | Added Section 2.4 — Registry URL Patterns — documenting path-based and subdomain-based routing as equally compliant implementation patterns, with trade-offs for each. Updated Section 7 example records to show both patterns. Updated live reference implementation example to reflect subdomain-based routing. |