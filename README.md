# mcp-dns-registry

**DNS-based discovery for MCP: organisation-scoped registry using `_mcp` TXT records**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Paper: v1.4](https://img.shields.io/badge/Paper-v1.4-green.svg)](paper/mcp-registry-architecture.pdf)

---

## What This Is

This repository provides a complete, deployable reference architecture for solving the agent discovery problem in [Model Context Protocol (MCP)](https://spec.modelcontextprotocol.io) ecosystems.

The core proposal is simple: organisations publish a single DNS TXT record at `_mcp.yourdomain.com` that points any compliant AI agent to their MCP registry. That registry is itself a fully compliant MCP server — agents discover it using the same `tools/list` and `tools/call` calls they use for everything else. No discovery SDK. No new protocol. No new infrastructure.

```
_mcp.example.com.   IN   TXT   "v=mcp1;
  registry=https://mcp.example.com/registry;
  public=true;
  auth=https://auth.example.com/token;
  version=2026-02"
```

**Deploy in a day. Run for under $5/month. Zero servers to maintain.**

---

## The Problem It Solves

MCP defines how AI agents connect to tools. It does not define how agents discover which tools exist. Today, the answer is manual configuration — a developer hard-codes server addresses at build time. This does not scale.

Without a discovery layer: `n agents × m servers = n×m configuration decisions`  
With this registry: `n agents + m servers = n+m`

---

## Key Design Decisions

**1. The registry is itself an MCP server**  
Agents need no special discovery client. They call `tools/list` on the registry — exactly as they would any other MCP server — and receive a manifest of available servers. Discovery requires zero new client behaviour.

**2. DNS as the bootstrap layer**  
A single `_mcp` TXT record is the only thing an agent needs to know. From a domain name alone, it can discover an organisation's entire MCP ecosystem. This follows established precedent: `_dmarc`, `_acme-challenge`, WebFinger.

**3. Public and private in a single registry**  
With `public=true` in the DNS record, any agent that knows your domain can discover your public MCP servers — no central registry submission required. With authentication, the same registry securely surfaces private internal servers. Both use the same infrastructure.

**4. Governance-first write path**  
Registry entries are managed via Git pull requests. Every change is attributed, reviewed, and revertible. The read path is fully serverless; governance lives in the write path.

---

## Architecture (AWS Reference Implementation)

```
Agent
  │
  ├─ 1. DNS lookup: _mcp.example.com
  │       └─ Returns registry URL + auth endpoint
  │
  ├─ 2. GET token from auth endpoint
  │
  ├─ 3. POST tools/list → CloudFront → Lambda@Edge
  │       └─ Validates JWT, queries DynamoDB, returns tool manifest
  │
  └─ 4. POST tools/call (discover_servers)
          └─ Returns filtered server list based on auth status
```

| Component | Service | Purpose |
|-----------|---------|---------|
| Global CDN | Amazon CloudFront | Edge distribution |
| Request processing | Lambda@Edge | JSON-RPC parsing, JWT validation, routing |
| Registry data | DynamoDB Global Tables | Server entries, multi-region reads |
| Binary assets | Amazon S3 + Signed URLs | Documents, manifests |

The architecture is vendor-neutral. Equivalent implementations using Cloudflare Workers + KV or Azure Front Door + Cosmos DB are planned — see [`alternative-implementations/`](alternative-implementations/) and [`infrastructure/`](infrastructure/).

---

## Repository Structure

```
mcp-dns-registry/
├── CLIENT.md                        # curl examples for querying the live registry
├── CONTRIBUTING.md                  # Contribution guidelines
├── DNS.md                           # DNS record format and operator setup guide
├── LICENSE                          # MIT licence
├── README.md                        # This file
├── SPEC.md                          # The _mcp DNS convention specification
├── health.json                      # Registry health check response
├── alternative-implementations/     # Community implementations (Cloudflare, Azure, GCP)
├── infrastructure/                  # Infrastructure-as-code
│   ├── aws/                         # CloudFormation template
│   ├── azure/                       # Azure deployment (community contributions welcome)
│   ├── gcp/                         # GCP deployment (community contributions welcome)
│   └── terraform/                   # Terraform for AWS, Azure, and GCP
├── mcp-function/                    # Lambda@Edge function source
│   ├── index.js                     # Handler — JSON-RPC routing, JWT validation, DynamoDB
│   ├── package.json
│   └── package-lock.json
└── paper/                           # Architecture paper
    ├── mcp-registry-architecture.md
    ├── mcp-registry-architecture.docx
    ├── mcp-registry-architecture.pdf
    └── versions/                    # Archived prior versions
```

---

## Quick Start

**1. Publish your DNS record**

```bash
# Route 53 example — see DNS.md for all providers
_mcp.yourdomain.com.  300  IN  TXT  "v=mcp1;registry=https://mcp.yourdomain.com/registry;public=true;auth=https://auth.yourdomain.com/token;version=2026-02"
```

**2. Deploy the registry**

```bash
# Deploy using the CloudFormation template
aws cloudformation deploy \
  --template-file infrastructure/aws/cloudformation.yaml \
  --stack-name mcp-registry \
  --parameter-overrides \
      DomainName=mcp.yourdomain.com \
      CertificateArn=arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT \
  --capabilities CAPABILITY_NAMED_IAM
```

Then deploy the Lambda function source from `mcp-function/`:

```bash
cd mcp-function
zip -r ../registry-function.zip .
aws lambda update-function-code \
  --function-name mcp-registry \
  --zip-file fileb://../registry-function.zip
```

**3. Add your first server**

```bash
aws dynamodb put-item \
  --table-name mcp-registry \
  --item '{
    "server_id":    { "S": "my-first-server" },
    "name":         { "S": "My First MCP Server" },
    "url":          { "S": "https://mcp.yourdomain.com/my-first-server" },
    "public":       { "BOOL": true },
    "capabilities": { "SS": ["data", "search"] },
    "deprecated":   { "BOOL": false }
  }' \
  --region us-east-1
```

**4. Test it**

See [CLIENT.md](CLIENT.md) for full curl examples against the live reference implementation.

```bash
curl -X POST https://mcp.mariothomas.com/registry \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"discover_servers","arguments":{}}}'
```

---

## Live Reference Implementation

A working implementation is available at `mcp.mariothomas.com`:

- DNS record: `_mcp.mariothomas.com`
- Registry: `https://mcp.mariothomas.com/registry`
- Articles server: `https://mcp.mariothomas.com/articles` (public)
- Locations server: `https://mcp.mariothomas.com/locations` (public)
- Documents server: `https://mcp.mariothomas.com/documents` (private — auth required)

See [CLIENT.md](CLIENT.md) for full curl examples.

---

## Relationship to Other Work

| Proposal | What it does | Relationship |
|----------|-------------|--------------|
| [Official MCP Registry](https://registry.modelcontextprotocol.io) | Global public catalogue of MCP servers | Complementary — use both. Official registry for global search; this for domain-based bootstrap |
| [SEP #1959](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions) | Per-server DNS verification primitives | Stackable — use SEP #1959 to verify individual servers discovered via this registry |
| [NANDA](https://nanda.media.mit.edu) | Federated directory protocol | Different layer — NANDA could be bootstrapped via `_mcp` records |

---

## Paper

The current architecture paper (v1.4) is available in [`paper/`](paper/) and at [mariothomas.com](https://mariothomas.com). Prior versions are archived in [`paper/versions/`](paper/versions/).

---

## Changelog

| Version | Date | Status | Summary of Changes |
|---------|------|--------|--------------------|
| 1.0 | 25 February 2026 | Published | Initial publication. |
| 1.1 | 27 February 2026 | Published | Added Section 2.3 — What This Proposal Does Not Solve — clarifying that the `_mcp` DNS record addresses discovery only, and that authentication, authorisation, and tool capability enumeration are explicitly out of scope for the DNS layer. |
| 1.2 | 28 February 2026 | Published | Extended Section 7.4 to address registry-level content filtering as a mitigation for prompt injection attacks. Added Section 10.6 — Agent Peer Discovery: A Natural Extension. Acknowledgements section added. |
| 1.3 | 2 March 2026 | Published | Extended Section 8.1 to document path-based and subdomain-based registry URL patterns as equally compliant implementation approaches, with trade-offs for each. Updated SPEC.md accordingly. |
| 1.4 | 2 March 2026 | Published | Updated Section 8.1 to reflect that the reference implementation at mcp.mariothomas.com uses path-based routing. Updated Sections 8.4 and 8.5 to use correct filename `index.js` and handler `index.handler`. Rewrote Section 12 in present tense to reflect live deployment, confirmed GitHub repository URL, and noted path-based routing pattern used in the reference implementation. |

---

## Contributing

Contributions welcome — particularly alternative cloud implementations, client libraries in other languages, and feedback on the DNS convention itself.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Author

**Mario Thomas**  
Head of Applied AI & Emerging Technology Strategy, AWS  
Chartered Director & Fellow, Institute of Directors  
[mariothomas.com](https://mariothomas.com) · [mario@mariothomas.com](mailto:mario@mariothomas.com)

---

## License

MIT — see [LICENSE](LICENSE).