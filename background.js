// --- HELPER FUNCTIONS ---

async function getApiKey() {
  const result = await chrome.storage.sync.get(['geminiApiKey']);
  return result.geminiApiKey;
}

function createOrUpdatePopup(message, iconUrl, isError = false) {
  let popup = document.getElementById('gemini-helper-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'gemini-helper-popup';
    Object.assign(popup.style, {
      position: 'fixed', padding: '15px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', zIndex: '999999', maxWidth: '350px', fontFamily: 'sans-serif', fontSize: '14px', lineHeight: '1.5', display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'move'
    });
    const iconElement = document.createElement('img');
    iconElement.src = iconUrl;
    iconElement.style.width = '24px'; iconElement.style.height = '24px';
    popup.appendChild(iconElement);
    const contentWrapper = document.createElement('div');
    popup.appendChild(contentWrapper);
    const textElement = document.createElement('p');
    textElement.id = 'gemini-helper-text';
    textElement.style.margin = '0';
    contentWrapper.appendChild(textElement);
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    Object.assign(closeButton.style, { marginTop: '10px', padding: '5px 10px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' });
    closeButton.onclick = (e) => { e.stopPropagation(); popup.remove(); };
    contentWrapper.appendChild(closeButton);
    document.body.appendChild(popup);
    let isDragging = false, offsetX, offsetY;
    popup.addEventListener('mousedown', (e) => { isDragging = true; offsetX = e.clientX - popup.offsetLeft; offsetY = e.clientY - popup.offsetTop; popup.style.userSelect = 'none'; });
    document.addEventListener('mousemove', (e) => { if (isDragging) { popup.style.left = `${e.clientX - offsetX}px`; popup.style.top = `${e.clientY - offsetY}px`; } });
    document.addEventListener('mouseup', () => { isDragging = false; popup.style.userSelect = 'auto'; });
  }
  const coords = window.geminiHelperCoords || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const popupWidth = 350, popupHeight = 150;
  const adjustedX = Math.min(coords.x, window.innerWidth - popupWidth - 20);
  const adjustedY = Math.min(coords.y, window.innerHeight - popupHeight - 20);
  popup.style.left = `${adjustedX}px`; popup.style.top = `${adjustedY}px`;
  const textElement = document.getElementById('gemini-helper-text');
  textElement.textContent = message;
  textElement.style.color = isError ? '#ffdddd' : 'white';
}

async function imageUrlToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// This function creates our custom prompt box on the page
function showAgentPrompt(iconUrl) {
  let popup = document.createElement('div');
  popup.id = 'gemini-agent-prompt';
  Object.assign(popup.style, {
    position: 'fixed', padding: '15px', backgroundColor: '#333', border: '1px solid #555', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)', zIndex: '999999', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '10px'
  });
  const coords = window.geminiHelperCoords || { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 50 };
  popup.style.left = `${coords.x}px`; popup.style.top = `${coords.y}px`;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'What is your goal?';
  input.style.padding = '8px'; input.style.backgroundColor = '#555'; input.style.color = 'white'; input.style.border = '1px solid #777'; input.style.borderRadius = '4px';

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex'; buttonContainer.style.gap = '10px';

  const goButton = document.createElement('button');
  goButton.textContent = 'Go';
  Object.assign(goButton.style, { padding: '8px 16px', backgroundColor: '#4a80f5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' });
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  Object.assign(cancelButton.style, { padding: '8px 16px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' });

  buttonContainer.appendChild(goButton);
  buttonContainer.appendChild(cancelButton);
  popup.appendChild(input);
  popup.appendChild(buttonContainer);
  document.body.appendChild(popup);
  input.focus();

  goButton.onclick = () => {
    if (input.value) {
      chrome.runtime.sendMessage({ type: 'startAgent', query: input.value });
    }
    popup.remove();
  };
  cancelButton.onclick = () => popup.remove();
  input.onkeydown = (e) => { if (e.key === 'Enter') goButton.click(); };
}

function parseDOM() {
  const elements = [];
  document.querySelectorAll('a, button, input, textarea, [role="button"], [role="link"]').forEach((el, i) => {
    let name = (el.getAttribute('aria-label') || el.textContent || el.alt || el.id || el.name || el.placeholder || '').trim().replace(/\s+/g, ' ').substring(0, 100);
    const selector = `[data-gemini-id='${i}']`;
    el.setAttribute('data-gemini-id', i);
    if (name) {
      const elementInfo = { 
        type: el.tagName.toLowerCase(), 
        name: name, 
        selector: selector 
      };
      if (el.value) {
        elementInfo.value = el.value.substring(0, 100);
      }
      elements.push(elementInfo);
    }
  });
  return elements;
}

async function executePlan(plan) {
    document.querySelectorAll('a, button, input, textarea, [role="button"], [role="link"]').forEach((el, i) => el.setAttribute('data-gemini-id', i));
    for (const step of plan) {
        console.log("Executing step:", step);
        const element = document.querySelector(step.selector);
        if (!element) { console.error("Could not find element for selector:", step.selector); continue; }
        if (step.action === 'type') {
            element.value = step.text || step.value;
        } 
        else if (step.action === 'click') {
            element.click();
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// --- GLOBAL AGENT STATE ---
let agentTask = null;


// --- CONTEXT MENU SETUP ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "gemini-helper-text", title: "Summarize this text", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "gemini-helper-image", title: "Ask Gemini about this image", contexts: ["image"] });
  chrome.contextMenus.create({ id: "gemini-helper-agent", title: "Start agent here...", contexts: ["all"] });
});


// --- MAIN LISTENERS ---

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const iconUrl = chrome.runtime.getURL('icon.png');
  const apiKey = await getApiKey();
  if (!apiKey && info.menuItemId !== "gemini-helper-agent") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: createOrUpdatePopup,
        args: ["API key not set. Please go to extension options.", iconUrl, true]
      });
      return;
  }

  // --- TEXT LOGIC ---
  if (info.menuItemId === "gemini-helper-text" && info.selectionText) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: createOrUpdatePopup,
      args: ["Just a sec, Gemini is thinking...", iconUrl]
    });

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [{"parts": [{"text": `Provide a concise, professional summary of the following text: "${info.selectionText}"`}]}]
        })
      });
      if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
      const data = await response.json();
      const explanation = data.candidates[0].content.parts[0].text;

      const historyEntry = { original: info.selectionText, summary: explanation, timestamp: Date.now() };
      chrome.storage.local.get({ geminiHistory: [] }, (result) => {
        const updatedHistory = result.geminiHistory;
        updatedHistory.push(historyEntry);
        chrome.storage.local.set({ geminiHistory: updatedHistory });
      });
      chrome.scripting.executeScript({ target: { tabId: tab.id }, function: createOrUpdatePopup, args: [explanation, iconUrl] });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      chrome.scripting.executeScript({ target: { tabId: tab.id }, function: createOrUpdatePopup, args: ["Failed to get a response. Check the console.", iconUrl, true] });
    }
  }

  // --- IMAGE LOGIC ---
  if (info.menuItemId === "gemini-helper-image" && info.srcUrl) {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => prompt("What do you want to ask about this image?")
    });

    const userPrompt = result.result;
    if (!userPrompt) return; 

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: createOrUpdatePopup,
      args: ["Just a sec, Gemini is analyzing the image...", iconUrl]
    });

    try {
      const base64ImageData = await imageUrlToBase64(info.srcUrl);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "contents": [{
            "parts": [
              { "text": userPrompt },
              { "inline_data": { "mime_type": "image/jpeg", "data": base64ImageData } }
            ]
          }]
        })
      });
      if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
      const data = await response.json();
      const explanation = data.candidates[0].content.parts[0].text;

      const historyEntry = { original: `[Image Query]: ${userPrompt}`, summary: explanation, timestamp: Date.now() };
      chrome.storage.local.get({ geminiHistory: [] }, (result) => {
        const updatedHistory = result.geminiHistory;
        updatedHistory.push(historyEntry);
        chrome.storage.local.set({ geminiHistory: updatedHistory });
      });
      chrome.scripting.executeScript({ target: { tabId: tab.id }, function: createOrUpdatePopup, args: [explanation, iconUrl] });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      chrome.scripting.executeScript({ target: { tabId: tab.id }, function: createOrUpdatePopup, args: ["Failed to analyze the image. Check the console.", iconUrl, true] });
    }
  }
  
  // --- AGENT LOGIC ---
  if (info.menuItemId === "gemini-helper-agent") {
    const iconUrl = chrome.runtime.getURL('icon.png');
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: showAgentPrompt,
      args: [iconUrl]
    });
  }
});

// --- NEW LISTENER FOR AGENT PROMPT ---
chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'startAgent') {
    const apiKey = await getApiKey();
    if (!apiKey) { return; }
    
    agentTask = {
      tabId: sender.tab.id,
      goal: message.query,
      history: [],
      waitingForNav: false
    };
    
    runAgentStep(apiKey);
  }
});

// --- LISTENER FOR PAGE LOADS ---
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (agentTask && tabId === agentTask.tabId && changeInfo.status === 'complete' && agentTask.waitingForNav) {
		console.log("Page navigation detected. Continuing agent task...");
		agentTask.waitingForNav = false; // Reset the flag
		const apiKey = await getApiKey();
		// Wait a couple of seconds for the page to settle, then let the main agent brain decide what's next.
  setTimeout(() => runAgentStep(apiKey), 1500);
	}
});


// --- MAIN AGENT LOGIC FUNCTION ---
async function runAgentStep(apiKey) {
  if (!agentTask) return;

  try {
    const [domElements] = await chrome.scripting.executeScript({
      target: { tabId: agentTask.tabId },
      function: parseDOM
    });
    
    const systemPrompt = `You are an expert browser automation agent. Your job is to look at a user's goal and the current state of a webpage (as a simplified DOM of interactive elements) and determine the single next action to take.

You must respond with a single JSON object. The available actions are "click", "type", or "finish".
- For "type", you must include a "selector" for the input field and the "text" to type.
- For "click", you must include a "selector" for the element to click.
- For "finish", you can include a "reason".

Here is an example of a good response:
{
  "action": "type",
  "selector": "[data-gemini-id='42']",
  "text": "yellow sweater"
}

Now, complete the following task.
User's Ultimate Goal: "${agentTask.goal}"
Actions Taken So Far: ${JSON.stringify(agentTask.history)}
Simplified DOM of Current Page: ${JSON.stringify(domElements.result)}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "contents": [{"parts": [{"text": systemPrompt }]}] })
    });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    const data = await response.json();
    
    let planJson = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    const nextStep = JSON.parse(planJson);

    if (nextStep.action === 'finish') {
      console.log("Agent task finished:", nextStep.reason || "Goal achieved.");
      agentTask = null;
      return;
    }

    agentTask.history.push(nextStep);
    agentTask.waitingForNav = (nextStep.action === 'click'); 

    await chrome.scripting.executeScript({
      target: { tabId: agentTask.tabId },
      function: executePlan,
      args: [[nextStep]]
    });

    if (!agentTask.waitingForNav) {
      setTimeout(() => runAgentStep(apiKey), 1000);
    }

  } catch (error) {
    console.error("Agent failed on step " + (agentTask ? agentTask.step : 'unknown'), error);
    agentTask = null;
  }
}