#!/bin/bash

# Setup script for Kubernetes worker node
# Runs on Oracle Cloud Ubuntu 22.04 instance

set -e

echo "🏗️ Setting up Kubernetes worker node..."

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Configure Docker
cat <<EOF > /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {"max-size": "100m"},
  "storage-driver": "overlay2"
}
EOF

systemctl enable docker
systemctl restart docker
usermod -aG docker ubuntu

# Disable swap
swapoff -a
sed -i '/swap/d' /etc/fstab

# Install Kubernetes
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.28/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.28/deb/ /' | tee /etc/apt/sources.list.d/kubernetes.list

apt-get update
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

# Wait for master to be ready
sleep 120

# Join the cluster (this command will be provided by master node)
# The join command will be fetched from the master node
echo "⏳ Waiting to join cluster..."

echo "✅ Kubernetes worker setup complete"