#!/bin/bash
# Run Maven tests only on specific Java files

FILE_PATH=$(jq -r '.tool_input.file_path')

if [[ "$FILE_PATH" == "src/main/java/com/example/_x_recipes/client/TheMealDBClient.java" ]] || \
   [[ "$FILE_PATH" == "src/main/java/com/example/_x_recipes/controller/RecipeController.java" ]]; then
    mvn test -Dtest=RecipeControllerErrorSafetyTest -Dnet.bytebuddy.experimental=true --quiet
    exit $?
fi

exit 0
