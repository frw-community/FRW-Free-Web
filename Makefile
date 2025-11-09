# FRW Makefile
# Convenient shortcuts for Docker and development operations

.PHONY: help start stop restart logs status build clean init register publish shell test

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)FRW Development Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make $(CYAN)<target>$(RESET)\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# Docker Operations

start: ## Start all FRW services (Docker)
	@echo "$(CYAN)Starting FRW services...$(RESET)"
	docker-compose up -d
	@echo "$(GREEN)✓ Services started$(RESET)"
	@make status

stop: ## Stop all FRW services
	@echo "$(CYAN)Stopping FRW services...$(RESET)"
	docker-compose down
	@echo "$(GREEN)✓ Services stopped$(RESET)"

restart: ## Restart all services
	@echo "$(CYAN)Restarting FRW services...$(RESET)"
	docker-compose restart
	@echo "$(GREEN)✓ Services restarted$(RESET)"

logs: ## View logs from all services
	docker-compose logs -f

logs-cli: ## View FRW CLI logs
	docker-compose logs -f frw-cli

logs-ipfs: ## View IPFS logs
	docker-compose logs -f ipfs

logs-gateway: ## View Gateway logs
	docker-compose logs -f frw-gateway

status: ## Show status of all services
	@echo "$(CYAN)Service Status:$(RESET)"
	@docker-compose ps

build: ## Build Docker images
	@echo "$(CYAN)Building Docker images...$(RESET)"
	docker-compose build
	@echo "$(GREEN)✓ Build complete$(RESET)"

rebuild: ## Rebuild images without cache
	@echo "$(CYAN)Rebuilding Docker images...$(RESET)"
	docker-compose build --no-cache
	@echo "$(GREEN)✓ Rebuild complete$(RESET)"

clean: ## Stop services and remove volumes (WARNING: deletes data)
	@echo "$(YELLOW)WARNING: This will delete all FRW data!$(RESET)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✓ Cleaned$(RESET)"; \
	else \
		echo "$(YELLOW)Cancelled$(RESET)"; \
	fi

update: ## Pull latest images and restart
	@echo "$(CYAN)Updating services...$(RESET)"
	docker-compose pull
	docker-compose up -d
	@echo "$(GREEN)✓ Updated$(RESET)"

# FRW Operations

init: ## Initialize FRW (run after first start)
	@echo "$(CYAN)Initializing FRW...$(RESET)"
	docker-compose exec frw-cli frw init
	@echo "$(GREEN)✓ FRW initialized$(RESET)"

register: ## Register a name (usage: make register NAME=myname)
	@if [ -z "$(NAME)" ]; then \
		echo "$(YELLOW)Usage: make register NAME=myname$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Registering name: $(NAME)$(RESET)"
	docker-compose exec frw-cli frw register $(NAME)

configure: ## Configure a site (usage: make configure SITE=./sites/my-site)
	@if [ -z "$(SITE)" ]; then \
		echo "$(YELLOW)Usage: make configure SITE=./sites/my-site$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Configuring site: $(SITE)$(RESET)"
	docker-compose exec frw-cli frw configure /data/sites/$(notdir $(SITE))

configure-path: ## Configure at custom path (usage: make configure-path PATH=/data/custom/site)
	@if [ -z "$(PATH)" ]; then \
		echo "$(YELLOW)Usage: make configure-path PATH=/data/custom/site$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Configuring site at: $(PATH)$(RESET)"
	docker-compose exec frw-cli frw configure $(PATH)

publish: ## Publish a site (usage: make publish SITE=./sites/my-site)
	@if [ -z "$(SITE)" ]; then \
		echo "$(YELLOW)Usage: make publish SITE=./sites/my-site$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Publishing site: $(SITE)$(RESET)"
	docker-compose exec frw-cli frw publish /data/sites/$(notdir $(SITE))

publish-path: ## Publish at custom path (usage: make publish-path PATH=/data/custom/site)
	@if [ -z "$(PATH)" ]; then \
		echo "$(YELLOW)Usage: make publish-path PATH=/data/custom/site$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Publishing site at: $(PATH)$(RESET)"
	docker-compose exec frw-cli frw publish $(PATH)

# Domain Management

domain-add: ## Add domain (usage: make domain-add DOMAIN=example.com NAME=myname)
	@if [ -z "$(DOMAIN)" ] || [ -z "$(NAME)" ]; then \
		echo "$(YELLOW)Usage: make domain-add DOMAIN=example.com NAME=myname$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Adding domain: $(DOMAIN) → $(NAME)$(RESET)"
	docker-compose exec frw-cli frw domain add $(DOMAIN) $(NAME)

domain-verify: ## Verify domain DNS (usage: make domain-verify DOMAIN=example.com)
	@if [ -z "$(DOMAIN)" ]; then \
		echo "$(YELLOW)Usage: make domain-verify DOMAIN=example.com$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Verifying domain: $(DOMAIN)$(RESET)"
	docker-compose exec frw-cli frw domain verify $(DOMAIN)

domain-list: ## List all domains
	docker-compose exec frw-cli frw domain list

domain-info: ## Show domain info (usage: make domain-info DOMAIN=example.com)
	@if [ -z "$(DOMAIN)" ]; then \
		echo "$(YELLOW)Usage: make domain-info DOMAIN=example.com$(RESET)"; \
		exit 1; \
	fi
	docker-compose exec frw-cli frw domain info $(DOMAIN)

shell: ## Open shell in FRW CLI container
	docker-compose exec frw-cli sh

shell-ipfs: ## Open shell in IPFS container
	docker-compose exec ipfs sh

ipfs-status: ## Check IPFS status
	@docker-compose exec ipfs ipfs version
	@docker-compose exec ipfs ipfs swarm peers | wc -l | xargs echo "Connected peers:"

# Development

dev: ## Start development environment
	@echo "$(CYAN)Starting development environment...$(RESET)"
	docker-compose -f docker/docker-compose.dev.yml up -d
	@echo "$(GREEN)✓ Development environment started$(RESET)"

dev-stop: ## Stop development environment
	docker-compose -f docker/docker-compose.dev.yml down

dev-logs: ## View development logs
	docker-compose -f docker/docker-compose.dev.yml logs -f

# Native Development (non-Docker)

install: ## Install dependencies (native)
	npm install

build-native: ## Build packages (native)
	npm run build

test: ## Run tests
	npm test

test-watch: ## Run tests in watch mode
	npm run test:watch

lint: ## Lint code
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

format: ## Format code
	npm run format

# Monitoring

health: ## Check health of all services
	@echo "$(CYAN)Health Check:$(RESET)"
	@echo -n "IPFS API: "
	@curl -s http://localhost:5001/api/v0/version > /dev/null && echo "$(GREEN)✓$(RESET)" || echo "$(YELLOW)✗$(RESET)"
	@echo -n "IPFS Gateway: "
	@curl -s http://localhost:8080 > /dev/null && echo "$(GREEN)✓$(RESET)" || echo "$(YELLOW)✗$(RESET)"
	@echo -n "FRW Gateway: "
	@curl -s http://localhost:3000/health > /dev/null && echo "$(GREEN)✓$(RESET)" || echo "$(YELLOW)✗$(RESET)"

stats: ## Show resource usage
	@echo "$(CYAN)Resource Usage:$(RESET)"
	docker stats --no-stream frw-cli frw-ipfs frw-gateway

# Backup & Restore

backup: ## Backup FRW configuration and keys
	@echo "$(CYAN)Backing up FRW data...$(RESET)"
	@mkdir -p backups
	docker cp frw-cli:/root/.frw backups/frw-config-$$(date +%Y%m%d-%H%M%S)
	@echo "$(GREEN)✓ Backup complete$(RESET)"

# Quick Setup

quick-start: start init ## Quick start: start services and initialize
	@echo "$(GREEN)✓ FRW is ready!$(RESET)"
	@echo "Next: make register NAME=myname"

demo: ## Setup and publish demo site
	@echo "$(CYAN)Setting up demo...$(RESET)"
	@mkdir -p sites/demo
	@echo '<!DOCTYPE html><html><head><title>FRW Demo</title></head><body><h1>Hello FRW!</h1><p>This is a demo site published on the decentralized web.</p></body></html>' > sites/demo/index.html
	@make publish SITE=sites/demo
	@echo "$(GREEN)✓ Demo published$(RESET)"
	@echo "Access at: http://localhost:3000/frw/demo/"
