#!/bin/bash

# --- Configuration ---
# The year folder you want to process
YEAR=2024
# --- End Configuration ---

DIR="images/previous/$YEAR"

if [ ! -d "$DIR" ]; then
  echo "Error: Directory '$DIR' not found."
  exit 1
fi

echo "Navigating to $DIR..."
cd "$DIR" || exit

i=1
# Use find and sort for more reliable ordering, especially with many files.
# The -print0 and -0 are for safely handling filenames with spaces.
find . -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \) -print0 | sort -z | while IFS= read -r -d '' file; do
  # Use a temporary name to avoid conflicts if a file is already named e.g. "2.jpg"
  temp_name="temp_${i}.jpg"
  echo "Renaming '$file' -> '$i.jpg'"
  mv -v "$file" "$temp_name"
  mv -v "$temp_name" "$i.jpg"
  i=$((i+1))
done

echo "Renaming complete for year $YEAR."
