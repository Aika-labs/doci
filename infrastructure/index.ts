import * as pulumi from '@pulumi/pulumi';
import * as hcloud from '@pulumi/hcloud';

// Configuration
const config = new pulumi.Config();
const environment = pulumi.getStack();

// Get SSH public key from config (with placeholder for preview)
const sshPublicKey = config.get('sshPublicKey') || 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPlaceholder doci-placeholder';

// Server configuration based on environment
const serverConfigs: Record<string, { serverType: string; location: string }> = {
  dev: {
    serverType: 'cx22', // 2 vCPU, 4GB RAM, 40GB SSD - ~€4/month
    location: 'hel1', // Helsinki
  },
  staging: {
    serverType: 'cx32', // 4 vCPU, 8GB RAM, 80GB SSD - ~€15/month
    location: 'hel1',
  },
  prod: {
    serverType: 'cx42', // 8 vCPU, 16GB RAM, 160GB SSD - ~€30/month
    location: 'hel1',
  },
};

const serverConfig = serverConfigs[environment] || serverConfigs.dev;

// SSH Key
const sshKey = new hcloud.SshKey('doci-ssh-key', {
  name: `doci-${environment}`,
  publicKey: sshPublicKey,
});

// Private Network
const network = new hcloud.Network('doci-network', {
  name: `doci-${environment}`,
  ipRange: '10.0.0.0/16',
});

const subnet = new hcloud.NetworkSubnet('doci-subnet', {
  networkId: network.id.apply((id) => parseInt(id)),
  type: 'cloud',
  networkZone: 'eu-central',
  ipRange: '10.0.1.0/24',
});

// Firewall
const firewall = new hcloud.Firewall('doci-firewall', {
  name: `doci-${environment}`,
  rules: [
    // SSH
    {
      direction: 'in',
      protocol: 'tcp',
      port: '22',
      sourceIps: ['0.0.0.0/0', '::/0'],
      description: 'SSH access',
    },
    // HTTP
    {
      direction: 'in',
      protocol: 'tcp',
      port: '80',
      sourceIps: ['0.0.0.0/0', '::/0'],
      description: 'HTTP',
    },
    // HTTPS
    {
      direction: 'in',
      protocol: 'tcp',
      port: '443',
      sourceIps: ['0.0.0.0/0', '::/0'],
      description: 'HTTPS',
    },
  ],
});

// Cloud-init user data for server setup
const userData = `#!/bin/bash
set -e

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Install useful tools
apt-get install -y git curl wget htop vim

# Create app directory
mkdir -p /opt/doci
chown ubuntu:ubuntu /opt/doci

# Create docker network for the app
docker network create doci-network || true

# Setup firewall (ufw)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Setup automatic security updates
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo "Doci server setup complete!"
`;

// Main Server
const server = new hcloud.Server(
  'doci-server',
  {
    name: `doci-${environment}`,
    serverType: serverConfig.serverType,
    image: 'ubuntu-24.04',
    location: serverConfig.location,
    sshKeys: [sshKey.id],
    firewallIds: [firewall.id.apply((id) => parseInt(id))],
    userData: userData,
    networks: [
      {
        networkId: network.id.apply((id) => parseInt(id)),
        ip: '10.0.1.10',
      },
    ],
    labels: {
      environment: environment,
      project: 'doci',
      managed_by: 'pulumi',
    },
  },
  {
    dependsOn: [subnet],
  }
);

// Volume for persistent data (database backups, uploads, etc.)
const volume = new hcloud.Volume('doci-volume', {
  name: `doci-data-${environment}`,
  size: environment === 'prod' ? 50 : 20, // GB
  location: serverConfig.location,
  format: 'ext4',
  labels: {
    environment: environment,
    project: 'doci',
  },
});

// Attach volume to server
const volumeAttachment = new hcloud.VolumeAttachment('doci-volume-attachment', {
  volumeId: volume.id.apply((id) => parseInt(id)),
  serverId: server.id.apply((id) => parseInt(id)),
  automount: true,
});

// Outputs
export const serverIp = server.ipv4Address;
export const serverStatus = server.status;
export const serverLocation = server.location;
export const serverType = server.serverType;
export const volumeSize = volume.size;
export const networkIp = pulumi.interpolate`10.0.1.10`;

// Connection info
export const sshCommand = pulumi.interpolate`ssh ubuntu@${server.ipv4Address}`;
export const deployCommand = pulumi.interpolate`scp -r ./docker-compose.yml ubuntu@${server.ipv4Address}:/opt/doci/`;
