#!/bin/bash
# Deploy 8 new features from GitHub branch to VPS
# Run from: /home/ubuntu/nuswalab/
# Usage: bash deploy-features.sh

set -e

BRANCH="claude/affectionate-goldberg-34ukqx"
REPO_URL="https://github.com/rikoconstantine10-ops/webnuswa.git"
APP_DIR="/home/ubuntu/nuswalab"
LAYOUT_FILE="$APP_DIR/src/app/[locale]/layout.tsx"

echo "=== Nuswalab Feature Deploy ==="
cd "$APP_DIR"

# 1. Fetch new files from GitHub branch
echo "[1/4] Fetching new files from GitHub..."
git fetch "$REPO_URL" "$BRANCH":refs/remotes/feature-deploy 2>/dev/null || \
  git fetch origin "$BRANCH" 2>/dev/null || \
  git remote add feature-origin "$REPO_URL" && git fetch feature-origin "$BRANCH"

git checkout refs/remotes/feature-deploy -- \
  "src/app/[locale]/tools/" \
  "src/components/sections/BeforeAfterPortfolio.tsx" \
  "src/components/sections/CaseStudyTimeline.tsx" \
  "src/components/sections/DashboardTeaser.tsx" \
  "src/components/widgets/"

echo "  -> Files copied!"

# 2. Patch layout.tsx to add global widgets
echo "[2/4] Patching layout.tsx..."

# Check if widgets are already imported
if grep -q "WAFloatingButton" "$LAYOUT_FILE"; then
  echo "  -> Widgets already in layout.tsx, skipping patch."
else
  # Add imports after the last existing import line
  python3 - <<'PYEOF'
import re

layout_path = "/home/ubuntu/nuswalab/src/app/[locale]/layout.tsx"

with open(layout_path, "r") as f:
    content = f.read()

# Add imports after last import line
import_block = '''import { WAFloatingButton } from "@/components/widgets/WAFloatingButton";
import { ExitIntentPopup } from "@/components/widgets/ExitIntentPopup";
import { AIChatWidget } from "@/components/widgets/AIChatWidget";'''

# Find position after last import statement
last_import_match = list(re.finditer(r'^import .+;?\s*$', content, re.MULTILINE))
if last_import_match:
    last_import_end = last_import_match[-1].end()
    content = content[:last_import_end] + "\n" + import_block + content[last_import_end:]
    print("  -> Imports added.")
else:
    # Prepend imports
    content = import_block + "\n\n" + content
    print("  -> Imports prepended.")

# Add widget components before closing </body> or before closing children wrapper
# Strategy: insert before the last </> or </body> in the JSX return
widget_jsx = '''      <WAFloatingButton />
      <ExitIntentPopup />
      <AIChatWidget />'''

# Try to insert before </body> tag
if "</body>" in content:
    content = content.replace("</body>", widget_jsx + "\n    </body>", 1)
    print("  -> Widgets added before </body>.")
elif "</NextIntlClientProvider>" in content:
    content = content.replace("</NextIntlClientProvider>", widget_jsx + "\n      </NextIntlClientProvider>", 1)
    print("  -> Widgets added before </NextIntlClientProvider>.")
else:
    # Find last </div> or closing tag before export default end
    # Insert before </html> or last closing tag of the return statement
    print("  -> WARNING: Could not auto-detect insertion point.")
    print("  -> Please manually add to layout.tsx:")
    print(widget_jsx)

with open(layout_path, "w") as f:
    f.write(content)

print("  -> layout.tsx patched successfully!")
PYEOF
fi

# 3. Build
echo "[3/4] Building Next.js..."
cd "$APP_DIR"
npm run build

# 4. Restart PM2
echo "[4/4] Restarting PM2..."
pm2 restart nuswalab

echo ""
echo "=== Deploy Complete! ==="
echo "Visit your website to verify the new features."
echo ""
echo "New pages:"
echo "  - /tools/roi-calculator"
echo "  - /tools/audit"
echo ""
echo "New sections (add to homepage manually):"
echo "  - <BeforeAfterPortfolio /> from @/components/sections/BeforeAfterPortfolio"
echo "  - <CaseStudyTimeline />   from @/components/sections/CaseStudyTimeline"
echo "  - <DashboardTeaser />     from @/components/sections/DashboardTeaser"
echo ""
echo "Global widgets (auto-added to layout.tsx):"
echo "  - WAFloatingButton (bottom-right WA button)"
echo "  - ExitIntentPopup (exit intent lead capture)"
echo "  - AIChatWidget (bottom-left chat bot)"
