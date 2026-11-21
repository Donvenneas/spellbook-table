#!/bin/sh
# macOS: double-click this file to start Spellbook Table (it opens a Terminal window; close it to stop).
# If macOS says it can't be opened, run once in Terminal:  chmod +x "Start Spellbook Table.command"
cd "$(dirname "$0")" || exit 1
exec sh start.sh
