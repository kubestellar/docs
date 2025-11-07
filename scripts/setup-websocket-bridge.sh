#!/bin/bash

# Setup script for WebSocket bridge server
# Provides web terminal access to Kubernetes cluster
# Runs on Oracle Cloud Ubuntu 22.04 instance

set -e

echo "🌐 Setting up WebSocket bridge server..."

# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install WebSocket terminal bridge
mkdir -p /opt/k8s-bridge
cd /opt/k8s-bridge

# Create package.json
cat <<EOF > package.json
{
  "name": "k8s-websocket-bridge",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "ws": "^8.14.2",
    "node-pty": "^1.0.0"
  }
}
EOF

# Install dependencies
npm install

# Create WebSocket server
cat <<EOF > server.js
const WebSocket = require('ws');
const pty = require('node-pty');

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (ws) => {
  console.log('Client connected');

  const shell = pty.spawn('/bin/bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  shell.on('data', (data) => {
    ws.send(data);
  });

  ws.on('message', (msg) => {
    shell.write(msg);
  });

  ws.on('close', () => {
    shell.kill();
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on port 8080');
EOF

# Create systemd service
cat <<EOF > /etc/systemd/system/k8s-bridge.service
[Unit]
Description=Kubernetes WebSocket Bridge
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/k8s-bridge
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R ubuntu:ubuntu /opt/k8s-bridge

# Enable and start service
systemctl enable k8s-bridge
systemctl start k8s-bridge

# Configure firewall
ufw allow 8080

echo "✅ WebSocket bridge setup complete"
echo "🔗 Bridge available on port 8080"