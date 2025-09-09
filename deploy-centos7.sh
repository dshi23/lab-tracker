#!/usr/bin/env bash
set -euo pipefail

# CentOS 7 deployment script for lab1 using Docker and docker-compose
# Requirements:
# - Run this on a CentOS 7 VM with internet access
# - Export env vars before running or pass inline:
#   VECR="cr.volcengine.com/<project>" SECRET_KEY="your-secret" CORS_ORIGINS="https://your-domain" \
#   DOCKER_REG_USERNAME="<username>" DOCKER_REG_PASSWORD="<password>" ./deploy-centos7.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VECR="${VECR:-}"
SECRET_KEY="${SECRET_KEY:-}"
CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000,http://frontend:3000}"
DOCKER_REG_USERNAME="${DOCKER_REG_USERNAME:-}"
DOCKER_REG_PASSWORD="${DOCKER_REG_PASSWORD:-}"

echo "[INFO] Starting deployment on CentOS 7..."

# Verify CentOS 7
if [[ -f /etc/centos-release ]]; then
  if ! grep -qE "CentOS( Linux)? release 7" /etc/centos-release; then
    echo "[WARN] This script is intended for CentOS 7. Detected: $(cat /etc/centos-release)" >&2
  fi
else
  echo "[WARN] /etc/centos-release not found. Proceeding anyway." >&2
fi

echo "[INFO] Installing Docker CE..."
sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine || true
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker

if ! getent group docker >/dev/null; then
  sudo groupadd docker || true
fi
sudo usermod -aG docker "$USER" || true

echo "[INFO] Installing docker-compose (standalone)..."
COMPOSE_VERSION="v2.24.7"
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose version

echo "[INFO] Preparing persistent directories..."
sudo mkdir -p /data/lab1/instance /data/lab1/uploads
sudo chown -R "$USER":"$USER" /data/lab1

# Optional: If SELinux is enforcing and you still face permission issues, use the following:
# sudo yum install -y policycoreutils-python || true
# sudo chcon -Rt svirt_sandbox_file_t /data/lab1 || true

if [[ -n "$VECR" ]]; then
  echo "[INFO] Writing .env for docker-compose..."
  cat > .env <<EOF
VECR=$VECR
SECRET_KEY=$SECRET_KEY
CORS_ORIGINS=$CORS_ORIGINS
EOF
else
  echo "[WARN] VECR not set. Set VECR to your registry, e.g., cr.volcengine.com/<project>" >&2
fi

if [[ -n "$VECR" && -n "$DOCKER_REG_USERNAME" && -n "$DOCKER_REG_PASSWORD" ]]; then
  REGISTRY_HOST="${VECR%%/*}"
  echo "[INFO] Logging into container registry: $REGISTRY_HOST"
  echo -n "$DOCKER_REG_PASSWORD" | docker login "$REGISTRY_HOST" -u "$DOCKER_REG_USERNAME" --password-stdin
else
  echo "[WARN] Skipping registry login (VECR/DOCKER_REG_USERNAME/DOCKER_REG_PASSWORD not fully provided)." >&2
fi

echo "[INFO] Pulling images and starting services..."
docker-compose pull
docker-compose up -d
docker-compose ps

echo "[SUCCESS] Deployment completed. Frontend should be reachable on the published port (docker-compose maps 3000)."
echo "Note: You may need to log out/in for docker group changes to take effect."


