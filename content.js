// Listen for right-clicks on the page
document.addEventListener('contextmenu', (event) => {
  // Store the mouse coordinates so our popup can find them later
  window.geminiHelperCoords = { x: event.clientX, y: event.clientY };
}, true);