# Infrastructure

This directory contains infrastructure-as-code templates for deploying the MCP DNS Registry on various cloud platforms.

## AWS CloudFormation

The reference implementation uses AWS Lambda, DynamoDB, and CloudFront. A working CloudFormation template is provided in the `cloudformation/` directory.

See [cloudformation/cloudformation.yaml](cloudformation/cloudformation.yaml).

## Terraform

A Terraform equivalent of the CloudFormation template. Community contributions welcome.

See [terraform/README.md](terraform/README.md).

## Azure

An equivalent deployment using Azure Functions and Cosmos DB. Community contributions welcome.

See [azure/README.md](azure/README.md).

## Google Cloud

An equivalent deployment using Cloud Functions and Firestore. Community contributions welcome.

See [gcp/README.md](gcp/README.md).

## Architecture

All implementations should conform to the [MCP DNS Registry Specification](../SPEC.md). The core resources required are:

| Resource | AWS | Azure | GCP |
|---|---|---|---|
| Compute | Lambda | Azure Functions | Cloud Functions |
| Database | DynamoDB | Cosmos DB | Firestore |
| CDN / Edge | CloudFront | Azure Front Door | Cloud CDN |
| IAM | IAM Role | Managed Identity | Service Account |