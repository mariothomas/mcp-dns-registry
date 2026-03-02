# Alternative Implementations

The reference implementation in this repository uses AWS Lambda, DynamoDB, and CloudFront. This directory is reserved for community-contributed implementations using alternative infrastructure.

## Potential implementations

- **Cloudflare Workers** — edge-deployed registry using Workers KV for storage
- **Generic / self-hosted** — Python or Node.js server for on-premises or non-AWS deployments
- **Azure Functions** — equivalent implementation on Azure infrastructure
- **Google Cloud Functions** — equivalent implementation on GCP infrastructure

## Contributing

If you have built an implementation on alternative infrastructure, contributions are welcome. Please follow the [MCP DNS Registry Specification](../SPEC.md) to ensure compatibility, and include a README explaining deployment steps.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.