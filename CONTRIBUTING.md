# Contributing to mcp-dns-registry

Contributions are welcome. This project is a technical proposal and reference implementation, so the most valuable contributions are those that test, extend, or challenge the architecture — not just cosmetic improvements.

---

## What We're Looking For

**High value**
- Alternative cloud implementations (Cloudflare Workers + KV, Azure Front Door + Cosmos DB, GCP Cloud Run + Firestore)
- Client libraries in languages beyond Python and Node.js
- Feedback on the `_mcp` DNS convention itself — edge cases, security considerations, interoperability concerns
- Testing against real MCP clients and agents
- Documentation improvements that make the implementation guide clearer

**Also welcome**
- Bug fixes in the reference implementation
- Additional DNS record format examples (other providers, BIND zone file variations)
- Additional agent integration examples

**Out of scope**
- Changes to the core DNS convention that would break existing implementations without strong justification
- Alternative authentication mechanisms that don't align with the MCP OAuth 2.1 profile
- Features that add complexity without clear governance or security benefit

---

## How to Contribute

1. **Open an issue first** for anything beyond a minor bug fix. Describe what you're proposing and why before writing code. This avoids effort on contributions that won't be merged.

2. **Fork the repository** and create a feature branch from `main`.

3. **Make your changes.** For code changes, test against the live reference implementation at `mcp.mariothomas.com` where possible.

4. **Open a pull request** with a clear description of what changed and why. Reference any related issues.

---

## On the DNS Convention

The `_mcp` TXT record format is the core of this proposal. Changes to the convention — new fields, modified semantics, different version strings — have implications beyond this repository. If you believe the convention needs to change, open an issue for discussion before raising a PR. The goal is to arrive at something worth submitting to the MCP specification process, which requires stability and community consensus.

---

## Code Style

- JavaScript: standard Node.js conventions, no framework dependencies in the Lambda@Edge function
- Python: PEP 8, no dependencies beyond the standard library in client scripts where possible
- Shell scripts: POSIX-compatible where practical

---

## Security Issues

Do not open public issues for security vulnerabilities. Contact mario@mariothomas.com directly with a description of the issue. Allow reasonable time for a response before any public disclosure.

---

## Licence

By contributing to this repository you agree that your contributions will be licensed under the MIT licence that covers this project.