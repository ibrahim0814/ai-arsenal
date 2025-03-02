// Background script for the Quick Notes extension
// This can be used for future features like keyboard shortcuts or context menu integration

chrome.runtime.onInstalled.addListener(() => {
  console.log("Quick Notes extension installed");

  // You could add context menu items here if needed
  // Example:
  // chrome.contextMenus.create({
  //   id: "add-selection-as-note",
  //   title: "Add selection as note",
  //   contexts: ["selection"]
  // });
});

// Example of handling context menu clicks (if implemented)
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === "add-selection-as-note" && info.selectionText) {
//     // Send the selected text to your API
//     fetch(CONFIG.API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ content: info.selectionText }),
//     })
//     .then(response => response.json())
//     .then(data => {
//       console.log('Note saved:', data);
//     })
//     .catch(error => {
//       console.error('Error saving note:', error);
//     });
//   }
// });
