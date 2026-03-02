# Terraform

This directory contains Terraform implementations of the MCP DNS Registry for each supported cloud provider. Terraform is a cloud-agnostic deployment tool — the same registry architecture can be provisioned on AWS, Azure, or GCP using the provider-specific configurations below.

## AWS

Provisions the same core resources as the [AWS CloudFormation template](../aws/cloudformation.yaml):

- IAM execution role with DynamoDB access
- Four DynamoDB tables: `mcp-registry`, `mcp-articles`, `mcp-locations`, `mcp-documents`
- Lambda@Edge function
- CloudFront distribution with path-based routing

See [aws/](aws/).

## Azure

Provisions the Azure equivalent using Azure Functions, Cosmos DB, and Azure Front Door.

See [azure/](azure/).

## GCP

Provisions the GCP equivalent using Cloud Functions, Firestore, and Cloud CDN.

See [gcp/](gcp/).

## Contributing

Terraform implementations for all three providers are planned for a future release. If you have built one, contributions are welcome. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines and refer to [SPEC.md](../../SPEC.md) for the specification.