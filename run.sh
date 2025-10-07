#!/bin/bash

# =============================================================================
# RAW STUDIO BOT - COMPLETE DEPLOYMENT SCRIPT
# =============================================================================
# This script will:
# 1. Install all dependencies
# 2. Generate Prisma client
# 3. Build the TypeScript project
# 4. Setup database
# 5. Create PM2 ecosystem config
# 6. Start the bot with PM2
# =============================================================================

set -e  # Exit on any error

echo "🚀 Starting Raw Studio Bot Deployment..."
echo "================================================"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_info "Please create .env file with required environment variables"
    exit 1
fi

print_success ".env file found"

# Check if DISCORD_BOT_TOKEN is set in .env
if ! grep -q "DISCORD_BOT_TOKEN=.*[^[:space:]]" .env; then
    print_error "DISCORD_BOT_TOKEN is not set in .env file!"
    print_info "Please add your Discord bot token to .env file"
    exit 1
fi

print_success "DISCORD_BOT_TOKEN is set"

# Step 1: Check if Node.js is installed
print_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_info "Please install Node.js first: https://nodejs.org/"
    exit 1
fi
print_success "Node.js $(node -v) found"

# Step 2: Check if npm is installed
print_info "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi
print_success "npm $(npm -v) found"

# Step 3: Install PM2 globally if not installed
print_info "Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2 globally..."
    npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 $(pm2 -v) found"
fi

# Step 4: Install project dependencies
print_info "Installing project dependencies..."
npm install
print_success "Dependencies installed"

# Step 5: Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Step 6: Build TypeScript project
print_info "Building TypeScript project..."
npm run build
print_success "Project built successfully"

# Step 7: Push database schema
print_info "Pushing database schema..."
npx prisma db push
print_success "Database schema updated"

# Step 8: Create logs directory
print_info "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Step 9: Create PM2 ecosystem config
print_info "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'raw-studio-bot',
    script: './dist/index.js',
    cwd: process.cwd(),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOL
print_success "PM2 ecosystem config created"

# Step 10: Stop existing PM2 process if running
print_info "Checking for existing PM2 processes..."
if pm2 list | grep -q "raw-studio-bot"; then
    print_warning "Stopping existing bot instance..."
    pm2 delete raw-studio-bot
    print_success "Existing instance stopped"
fi

# Step 11: Start bot with PM2
print_info "Starting bot with PM2..."
pm2 start ecosystem.config.js
print_success "Bot started with PM2"

# Step 12: Save PM2 configuration
print_info "Saving PM2 configuration..."
pm2 save
print_success "PM2 configuration saved"

# Step 13: Setup PM2 startup (for auto-restart on system boot)
print_info "Setting up PM2 startup..."
pm2 startup > /dev/null 2>&1 || true
print_success "PM2 startup configured"

echo ""
echo "================================================"
print_success "🎉 Raw Studio Bot Deployment Complete!"
echo "================================================"
echo ""

# Display bot status
print_info "Bot Status:"
pm2 list

echo ""
print_info "Useful Commands:"
echo "  • View logs:        pm2 logs raw-studio-bot"
echo "  • Stop bot:         pm2 stop raw-studio-bot"
echo "  • Restart bot:      pm2 restart raw-studio-bot"
echo "  • Monitor bot:      pm2 monit"
echo "  • View status:      pm2 list"
echo ""

# Show recent logs
print_info "Recent Logs (Last 20 lines):"
pm2 logs raw-studio-bot --lines 20 --nostream

echo ""
print_success "🤖 Your Discord bot is now running!"
echo ""
