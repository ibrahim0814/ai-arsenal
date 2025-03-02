#!/bin/bash

# Simple script to package the Chrome extension

# Create a zip file of the extension
echo "Creating extension package..."
zip -r quick-notes-extension.zip . -x "*.git*" "*.DS_Store" "package.sh" "*.zip"

echo "Package created: quick-notes-extension.zip"
echo "You can now upload this file to the Chrome Web Store or distribute it manually." 