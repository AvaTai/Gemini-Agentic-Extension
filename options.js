const apiKeyInput = document.getElementById('apiKey');
const saveButton = document.getElementById('save');
const statusP = document.getElementById('status');

// Load saved key when page opens
chrome.storage.sync.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
});

// Save the key when button is clicked
saveButton.addEventListener('click', () => {
  const apiKey = apiKeyInput.value;
  chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
    statusP.textContent = 'Options saved!';
    setTimeout(() => { statusP.textContent = ''; }, 2000);
  });
});