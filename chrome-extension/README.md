# Quick Notes Chrome Extension

A simple Chrome extension that allows you to quickly add notes to your personal notes application.

## Features

- Quick note taking with a simple popup interface
- Keyboard shortcut support (Ctrl+Enter or Cmd+Enter to save)
- Automatic closing after saving

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension should now be installed and visible in your Chrome toolbar

## Configuration

Before using the extension, you need to update the API URL in the `config.js` file:

1. Open `config.js` in a text editor
2. Change the `API_URL` value to point to your notes API
   - For local development: `http://localhost:3000/api/notes`
   - For production: `https://your-domain.com/api/notes`

## Usage

1. Click on the Quick Notes icon in your Chrome toolbar
2. Type your note in the text area
3. Click "Save Note" or press Ctrl+Enter (Cmd+Enter on Mac)
4. The note will be saved to your application

## Testing

The extension includes a simple test server that you can use to test the functionality without running your full application:

1. Make sure you have Node.js installed
2. Open a terminal and navigate to the `chrome-extension` folder
3. Run the test server: `node test-server.js`
4. The server will start at `http://localhost:3000`
5. You can now use the extension to send notes to this test server
6. The server will log received notes to the console

## Packaging

To package the extension for distribution:

1. Open a terminal and navigate to the `chrome-extension` folder
2. Run the packaging script: `./package.sh`
3. This will create a `quick-notes-extension.zip` file that you can distribute

## Icon Credits

The extension uses placeholder icons. You should replace them with your own icons before distribution:

- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## License

This project is for personal use only.
