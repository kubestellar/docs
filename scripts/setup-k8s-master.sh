#!/bin/bash

# Setup script for Kubernetes master node
# Runs on Oracle Cloud Ubuntu 22.04 instance

set -e

echo "🏗️ Setting up Kubernetes master node..."

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

# Initialize cluster with resource limits
kubeadm init \
    --pod-network-cidr=192.168.0.0/16 \
    --apiserver-advertise-address=10.0.1.10 \
    --node-name=k8s-master

# Setup kubectl for ubuntu user
mkdir -p /home/ubuntu/.kube
cp -i /etc/kubernetes/admin.conf /home/ubuntu/.kube/config
chown ubuntu:ubuntu /home/ubuntu/.kube/config

# Install Calico CNI
kubectl --kubeconfig=/home/ubuntu/.kube/config apply -f https://docs.projectcalico.org/v3.25/manifests/calico.yaml

# Create resource quotas for playground
kubectl --kubeconfig=/home/ubuntu/.kube/config create namespace playground || true
kubectl --kubeconfig=/home/ubuntu/.kube/config apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: playground-quota
  namespace: playground
spec:
  hard:
    requests.cpu: "1"
    requests.memory: 1Gi
    requests.storage: 10Gi
    pods: "20"
EOF

# Save join command
kubeadm token create --print-join-command > /home/ubuntu/join-command.sh
chmod +x /home/ubuntu/join-command.sh

echo "✅ Kubernetes master setup complete"