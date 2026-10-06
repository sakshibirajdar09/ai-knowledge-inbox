# 🧩 Building the RecallAI Chrome Extension

This guide explains exactly how the Chrome Extension was implemented for the RecallAI Knowledge Inbox. The beauty of this extension is its simplicity—because our backend is already so powerful, the extension only acts as a thin, secure bridge between the browser and our API.

## 📁 The Architecture

A basic Chrome Extension needs three things:
1. `manifest.json` (The blueprint)
2. `popup.html` (The UI you see when you click the icon)
3. `popup.js` (The logic that runs inside the popup)

### 1. The Blueprint (`manifest.json`)
The manifest tells Google Chrome exactly what our extension is and what permissions it needs. We are using **Manifest V3**, which is Google's latest standard.

```json
{
  "manifest_version": 3,
  "name": "RecallAI Clipper",
  "version": "1.0",
  "description": "Instantly save web pages to your AI Knowledge Inbox.",
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": [
    "activeTab"
  ],
  "host_permissions": [
    "http://localhost:3000/*"
  ]
}
```

**Key Takeaways:**
* `"action": { "default_popup": "popup.html" }` - This tells Chrome: "When the user clicks the puzzle piece icon in the toolbar, open `popup.html` in a small dropdown window."
* `"permissions": ["activeTab"]` - This is crucial. It gives our extension temporary access to read the URL and content of the tab you are *currently* looking at. Without this, we couldn't know what page you want to save!
* `"host_permissions": ["http://localhost:3000/*"]` - Chrome restricts extensions from making network requests to random websites. This explicitly allows our extension to send `POST` requests to our local Node.js backend.

### 2. The User Interface (`popup.html`)
This is just standard HTML and CSS. There is no React or complex framework here because extension popups should be extremely lightweight and load instantly.

We styled it with CSS variables to match the sleek Light/Dark mode of the main React application. It contains:
* An `<input type="text" id="urlInput" readonly />` to display the URL.
* A `<button id="saveBtn">` to trigger the save action.
* A `<script src="popup.js"></script>` at the bottom to connect our logic.

### 3. The Logic (`popup.js`)
This is where the magic happens. When you open the popup, the script runs immediately.

**Step A: Getting the Current URL**
```javascript
const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
const currentTab = tabs[0];
urlInput.value = currentTab.url;
```
We use the Chrome Extension API (`chrome.tabs.query`) to ask the browser: "Which tab is currently active in the current window?" We then grab the `url` from that tab object and display it in the text box.

**Step B: Sending Data to the Backend**
When you click the "Save" button, we execute a standard JavaScript `fetch` request:
```javascript
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
```
This is the exact same API endpoint that the React frontend uses! 

Because we built the backend intelligently (the backend handles downloading the HTML, stripping out the junk, chunking the text, and generating the vector embeddings), the Chrome Extension doesn't have to do any heavy lifting. It simply says, "Hey backend, here is a URL. Do your thing."

### Why this is a Senior-Level Implementation:
* **Separation of Concerns:** The extension is "dumb" (it just passes a URL), while the backend is "smart" (it parses and embeds). This means if we update the chunking logic in the backend, the Chrome Extension automatically benefits without needing an update!
* **Security:** We used the principle of least privilege. We only asked Chrome for `activeTab` permission, rather than `tabs` (which requests access to *all* tabs and scares users away).
* **Cross-Origin Resource Sharing (CORS):** The extension works perfectly because our backend `app.ts` implements `cors()`, allowing the extension's background script to talk to the local server without being blocked by browser security policies.
