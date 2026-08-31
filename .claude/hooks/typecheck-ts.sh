#!/bin/bash
# Run TypeScript type check only on .ts files

FILE_PATH=$(jq -r '.tool_input.file_path')

if [[ "$FILE_PATH" =~ src/.*\.ts$ ]]; then
    npx tsc --noEmit
    exit $?
fi

exit 0
