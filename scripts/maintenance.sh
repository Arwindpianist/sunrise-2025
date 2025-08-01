#!/bin/bash

# Maintenance Mode Control Script
# Usage: ./scripts/maintenance.sh [enable|disable|status]

set -e

ENV_FILE=".env.local"
BACKUP_FILE=".env.local.backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if .env.local exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env.local file not found. Creating it..."
        touch "$ENV_FILE"
    fi
}

# Function to backup current .env.local
backup_env() {
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_FILE"
        print_status "Backed up current .env.local to .env.local.backup"
    fi
}

# Function to enable maintenance mode
enable_maintenance() {
    print_status "Enabling maintenance mode..."
    
    check_env_file
    backup_env
    
    # Generate a random bypass secret
    BYPASS_SECRET=$(openssl rand -hex 16)
    
    # Add or update maintenance mode settings
    if grep -q "MAINTENANCE_MODE=" "$ENV_FILE"; then
        # Update existing setting
        sed -i.bak 's/MAINTENANCE_MODE=.*/MAINTENANCE_MODE=true/' "$ENV_FILE"
    else
        # Add new setting
        echo "MAINTENANCE_MODE=true" >> "$ENV_FILE"
    fi
    
    # Add bypass secret
    if grep -q "MAINTENANCE_BYPASS_SECRET=" "$ENV_FILE"; then
        sed -i.bak "s/MAINTENANCE_BYPASS_SECRET=.*/MAINTENANCE_BYPASS_SECRET=$BYPASS_SECRET/" "$ENV_FILE"
    else
        echo "MAINTENANCE_BYPASS_SECRET=$BYPASS_SECRET" >> "$ENV_FILE"
    fi
    
    # Clean up backup files
    rm -f "$ENV_FILE.bak"
    
    print_success "Maintenance mode enabled!"
    print_status "Bypass URL: https://yourdomain.com?bypass=$BYPASS_SECRET"
    print_warning "Keep this bypass URL secure - it allows access during maintenance"
}

# Function to disable maintenance mode
disable_maintenance() {
    print_status "Disabling maintenance mode..."
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env.local file not found. Maintenance mode is already disabled."
        return
    fi
    
    backup_env
    
    # Remove maintenance mode settings
    sed -i.bak '/MAINTENANCE_MODE=/d' "$ENV_FILE"
    sed -i.bak '/MAINTENANCE_BYPASS_SECRET=/d' "$ENV_FILE"
    sed -i.bak '/MAINTENANCE_ALLOWED_IPS=/d' "$ENV_FILE"
    
    # Clean up backup files
    rm -f "$ENV_FILE.bak"
    
    print_success "Maintenance mode disabled!"
}

# Function to show current status
show_status() {
    print_status "Checking maintenance mode status..."
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env.local file not found"
        echo "Maintenance Mode: DISABLED"
        return
    fi
    
    if grep -q "MAINTENANCE_MODE=true" "$ENV_FILE"; then
        echo -e "${RED}Maintenance Mode: ENABLED${NC}"
        
        # Show bypass secret if available
        if grep -q "MAINTENANCE_BYPASS_SECRET=" "$ENV_FILE"; then
            BYPASS_SECRET=$(grep "MAINTENANCE_BYPASS_SECRET=" "$ENV_FILE" | cut -d'=' -f2)
            echo -e "${BLUE}Bypass URL:${NC} https://yourdomain.com?bypass=$BYPASS_SECRET"
        fi
        
        # Show allowed IPs if available
        if grep -q "MAINTENANCE_ALLOWED_IPS=" "$ENV_FILE"; then
            ALLOWED_IPS=$(grep "MAINTENANCE_ALLOWED_IPS=" "$ENV_FILE" | cut -d'=' -f2)
            echo -e "${BLUE}Allowed IPs:${NC} $ALLOWED_IPS"
        fi
    else
        echo -e "${GREEN}Maintenance Mode: DISABLED${NC}"
    fi
}

# Function to show help
show_help() {
    echo "Maintenance Mode Control Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  enable   - Enable maintenance mode"
    echo "  disable  - Disable maintenance mode"
    echo "  status   - Show current maintenance mode status"
    echo "  help     - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  MAINTENANCE_MODE=true/false          - Enable/disable maintenance mode"
    echo "  MAINTENANCE_BYPASS_SECRET=secret     - Secret key for bypass access"
    echo "  MAINTENANCE_ALLOWED_IPS=ip1,ip2      - Comma-separated list of allowed IPs"
    echo ""
    echo "Examples:"
    echo "  $0 enable   # Enable maintenance mode"
    echo "  $0 disable  # Disable maintenance mode"
    echo "  $0 status   # Check current status"
}

# Main script logic
case "${1:-help}" in
    "enable")
        enable_maintenance
        ;;
    "disable")
        disable_maintenance
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 