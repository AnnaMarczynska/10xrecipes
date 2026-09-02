#!/bin/bash
# Setup Cloud SQL database and user for 10x-recipes
# Usage: ./setup-cloud-sql.sh <instance-name> <database-name> <username> <password>

set -e

if [ $# -ne 4 ]; then
  echo "Usage: $0 <instance-name> <database-name> <username> <password>"
  echo "Example: $0 recipes-db recipes db-user secure-password"
  exit 1
fi

INSTANCE=$1
DATABASE=$2
USERNAME=$3
PASSWORD=$4

echo "Setting up Cloud SQL for 10x-recipes..."
echo "Instance: $INSTANCE"
echo "Database: $DATABASE"
echo "User: $USERNAME"

# Create database
echo "Creating database '$DATABASE'..."
gcloud sql databases create "$DATABASE" \
  --instance="$INSTANCE" \
  --charset=UTF8 \
  --collation=en_US.UTF8 \
  2>/dev/null || echo "Database already exists"

# Create user
echo "Creating user '$USERNAME'..."
gcloud sql users create "$USERNAME" \
  --instance="$INSTANCE" \
  --password="$PASSWORD" \
  2>/dev/null || echo "User already exists"

echo "✓ Cloud SQL setup complete!"
echo ""
echo "Next steps:"
echo "1. Get Cloud SQL IP: gcloud sql instances describe $INSTANCE | grep ipAddresses"
echo "2. Deploy to Cloud Run with:"
echo "   - DATABASE_URL=jdbc:postgresql://<IP>:5432/$DATABASE"
echo "   - DATABASE_USER=$USERNAME"
echo "   - DATABASE_PASSWORD=$PASSWORD"
