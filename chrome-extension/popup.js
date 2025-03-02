document.addEventListener("DOMContentLoaded", function () {
  const noteContent = document.getElementById("noteContent");
  const saveButton = document.getElementById("saveButton");
  const statusDiv = document.getElementById("status");

  // Focus the textarea when popup opens
  noteContent.focus();

  // Add keyboard shortcut (Ctrl+Enter or Cmd+Enter) to save
  noteContent.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      saveNote();
    }
  });

  // Add click handler for save button
  saveButton.addEventListener("click", saveNote);

  function saveNote() {
    const content = noteContent.value.trim();

    if (!content) {
      showStatus("Please enter a note", "error");
      return;
    }

    // Disable button and show loading state
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    // Use the API URL from config
    const apiUrl = CONFIG.API_URL;

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save note");
        }
        return response.json();
      })
      .then((data) => {
        // Show success message
        showStatus("Note saved successfully!", "success");

        // Clear the textarea
        noteContent.value = "";

        // Reset button state
        saveButton.disabled = false;
        saveButton.textContent = "Save Note";

        // Close the popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      })
      .catch((error) => {
        console.error("Error saving note:", error);
        showStatus("Error saving note. Please try again.", "error");

        // Reset button state
        saveButton.disabled = false;
        saveButton.textContent = "Save Note";
      });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = "status " + type;
  }
});
