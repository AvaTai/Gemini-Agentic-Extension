// This function runs on the page to simplify the DOM into a clean list
function parseDOM() {
    const elements = [];
    // Find all interactive elements on the page
    document.querySelectorAll('a, button, input, textarea, [role="button"], [role="link"]').forEach((el, i) => {
        // Try to get a meaningful name for the element
        let name = (el.getAttribute('aria-label') || el.textContent || el.alt || el.id || el.name || el.placeholder || '').trim().substring(0, 100);
        
        // Create a unique selector for this element so we can find it later
        const selector = `[data-gemini-id='${i}']`;
        el.setAttribute('data-gemini-id', i); // Add the unique ID to the element on the page
        
        if (name) {
            elements.push({
                type: el.tagName.toLowerCase(),
                name: name,
                selector: selector
            });
        }
    });
    return elements;
}

// This function executes a list of commands from the AI
async function executePlan(plan) {
    for (const step of plan) {
        console.log("Executing step:", step);
        const element = document.querySelector(step.selector);
        if (!element) {
            console.error("Could not find element for selector:", step.selector);
            continue;
        }

        if (step.action === 'type') {
            element.value = step.text;
        } else if (step.action === 'click') {
            element.click();
        }
        // Wait a moment between steps to let the page react
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}