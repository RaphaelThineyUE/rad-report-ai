=================================================================
GitHub Issues Creation Script for rad-report-ai
=================================================================

FILE LOCATION: ~/create_github_issues.sh

WHAT IT DOES:
- Creates 75 GitHub issues from the Linear backlog
- Excludes the 4 issues completed in this session (MIG-129/130/131/132)
- Organizes issues by milestone with appropriate labels
- Tracks progress with a counter

REQUIREMENTS:
1. GitHub CLI (gh) installed: https://cli.github.com/
2. Authenticated with GitHub: run `gh auth login`
3. Permissions to create issues in raphaelthineyue/rad-report-ai

HOW TO RUN:
1. Open terminal/command prompt
2. Navigate to home directory: cd ~
3. Make script executable: chmod +x create_github_issues.sh
4. Run the script: ./create_github_issues.sh

WHAT IT CREATES:
✓ Milestone 1: Setup & Infrastructure (10 issues) - MIG-76 to MIG-85
✓ Milestone 2: Authentication & Security (15 issues) - MIG-86 to MIG-95, MIG-141 to MIG-145
✓ Milestone 3: Patient Management (6 issues) - MIG-96 to MIG-101
✓ Milestone 4: Document Upload & Storage (6 issues) - MIG-102 to MIG-107
✓ Milestone 5: AI Processing Pipeline (12 issues) - MIG-108 to MIG-119
✓ Milestone 6: Report UX (5 issues) - MIG-120 to MIG-124
✓ Milestone 7: Treatments & Timeline (4 issues) - MIG-125 to MIG-128
✓ Milestone 8: Analytics & Dashboard (SKIPPED - Completed)
✓ Milestone 9: App Polish & Design (8 issues) - MIG-133 to MIG-140
✓ Milestone 10: Testing & QA (4 issues) - MIG-146 to MIG-149
✓ Post-MVP: Multi-tenant Organizations (5 issues) - MIG-150 to MIG-154

TOTAL: 75 Issues

EXECUTION TIME:
Estimated 5-10 minutes depending on network speed

TROUBLESHOOTING:
- If gh not found: Install GitHub CLI from https://cli.github.com/
- If authentication fails: Run `gh auth login` and follow prompts
- If script stops: Check error message, fix issue, and re-run
- If duplicate issues: Check GitHub issues page before running again

NOTES:
- Script includes error handling with `set -e`
- Each issue is created with appropriate labels
- Issues are grouped by milestone for organization
- Script displays progress updates
- Final summary shows total issues created

For more info: https://cli.github.com/manual/
