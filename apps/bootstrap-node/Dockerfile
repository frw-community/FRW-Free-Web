FROM node:20-alpine

WORKDIR /app

# Install IPFS
RUN apk add --no-cache curl && \
    cd /tmp && \
    curl -O https://dist.ipfs.tech/kubo/v0.24.0/kubo_v0.24.0_linux-amd64.tar.gz && \
    tar -xzf kubo_v0.24.0_linux-amd64.tar.gz && \
    cd kubo && \
    sh install.sh && \
    rm -rf /tmp/kubo*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3030

# Start script that runs IPFS daemon + bootstrap node
CMD ["sh", "-c", "ipfs init || true && ipfs daemon & sleep 5 && npm start"]
