#!/bin/bash

# Script to seed owner user in local database
# Usage: ./scripts/seed-owner.sh

set -e

echo "🌱 Seeding owner user..."

sqlite3 "$DATABASE_URL" <<EOF
INSERT INTO Author VALUES('cmilsy07g00e4z27041smxoao','Vedneměsíčník, z. s.',NULL,'2025-11-30T14:14:57.676+00:00','2025-11-30T14:14:57.676+00:00','cm63hi8z800cl7044kr38q54w');
INSERT INTO User VALUES('cmilsy07h00e5z270tpczzisp','owner@local.dev','owner@local.dev','Vedneměsíčník, z. s.','2025-11-30T14:14:57.676+00:00','2025-11-30T14:14:57.676+00:00','cm63hi8yo00ci7044y3inq2bh','cmilsy07g00e4z27041smxoao');
INSERT INTO Password VALUES('\$2b\$10\$Zxl/pS27B2jVIxkpD12C8OcqxSjLP34kzmcfpew6kWv6f0v3/MXVG','cmilsy07h00e5z270tpczzisp');
EOF

echo "✅ Owner user created:"
echo "   Email: owner@local.dev"
echo "   Username: owner@local.dev"
echo "   Password: [the one you set]"
echo "   Role: Coordinator"