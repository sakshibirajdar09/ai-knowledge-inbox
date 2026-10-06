document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('urlInput');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Get the current active tab URL
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (currentTab && currentTab.url) {
      urlInput.value = currentTab.url;
    } else {
      urlInput.value = "Unable to get URL";
      saveBtn.disabled = true;
    }
  } catch (error) {
    urlInput.value = "Error getting tab";
    saveBtn.disabled = true;
  }

  // Handle the save button click
  saveBtn.addEventListener('click', async () => {
    const url = urlInput.value;
    
    if (!url || !url.startsWith('http')) {
      showStatus('Invalid URL (must start with http)', 'error');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    statusDiv.textContent = '';
    statusDiv.className = '';

    try {
      // Send a POST request to our local AI Knowledge Inbox backend
      const response = await fetch('http://localhost:3000/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'url',
          content: url
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to save URL');
      }

      showStatus('Success! Added to Knowledge Base ✅', 'success');
      saveBtn.textContent = 'Saved';
      
      // Auto-close popup after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
      
    } catch (error) {
      console.error('Save error:', error);
      showStatus(error.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Try Again';
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
  }
});
