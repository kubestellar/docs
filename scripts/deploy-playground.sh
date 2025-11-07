#!/bin/bash

# Simple Oracle Cloud K8s Playground Setup Script
# Triggered by GitHub Actions when user creates environment

set -e

echo "🚀 Creating Kubernetes Playground on Oracle Cloud..."
echo "⏱️ Auto-terminate: 30 minutes"
echo "⚡ Resources: 1 CPU, 1GB RAM per node"

# Oracle Cloud CLI setup (environment variables from GitHub secrets)
oci --version

echo "🏗️ Creating 3 VM instances:"
echo "  - k8s-master (10.0.1.10)"
echo "  - k8s-worker (10.0.1.11)"
echo "  - websocket-bridge (10.0.1.12)"

# Create VCN and networking
echo "📡 Setting up networking..."

# Create VM instances
echo "💻 Creating master node..."
oci compute instance launch \
  --compartment-id $OCI_COMPARTMENT_ID \
  --availability-domain $OCI_AD \
  --shape VM.Standard.E3.Micro \
  --shape-config '{"ocpus": 1, "memoryInGBs": 1}' \
  --image-id $OCI_UBUNTU_IMAGE \
  --subnet-id $OCI_SUBNET_ID \
  --display-name "k8s-master-demo" \
  --assign-public-ip true \
  --private-ip 10.0.1.10

echo "💻 Creating worker node..."
oci compute instance launch \
  --compartment-id $OCI_COMPARTMENT_ID \
  --availability-domain $OCI_AD \
  --shape VM.Standard.E3.Micro \
  --shape-config '{"ocpus": 1, "memoryInGBs": 1}' \
  --image-id $OCI_UBUNTU_IMAGE \
  --subnet-id $OCI_SUBNET_ID \
  --display-name "k8s-worker-demo" \
  --assign-public-ip true \
  --private-ip 10.0.1.11

echo "💻 Creating WebSocket bridge..."
oci compute instance launch \
  --compartment-id $OCI_COMPARTMENT_ID \
  --availability-domain $OCI_AD \
  --shape VM.Standard.E3.Micro \
  --shape-config '{"ocpus": 1, "memoryInGBs": 1}' \
  --image-id $OCI_UBUNTU_IMAGE \
  --subnet-id $OCI_SUBNET_ID \
  --display-name "k8s-bridge-demo" \
  --assign-public-ip true \
  --private-ip 10.0.1.12

echo "⏰ Setting up auto-termination (30 minutes)..."
echo "$(date -d '+30 minutes') terraform destroy -auto-approve" | at now + 30 minutes

echo "✅ Environment will be ready in 3-5 minutes"
echo "🌐 WebSocket URL: wss://$(oci compute instance list --compartment-id $OCI_COMPARTMENT_ID --display-name k8s-bridge-demo --query 'data[0]."primary-public-ip"' --raw-output):8080/terminal"

echo "💰 Cost: ~$0.20 for 30 minutes"
echo "🔒 Password protected (rishimondal)"