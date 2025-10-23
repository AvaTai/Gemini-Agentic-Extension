document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const historyContainer = document.getElementById('history-container');
    const clearButton = document.getElementById('clear-history-button');

    // Function to display the history items
    const renderHistory = (items) => {
        historyContainer.innerHTML = '';
        if (!items || items.length === 0) {
            historyContainer.innerHTML = '<p>Your history is empty.</p>';
            return;
        }

        // Sort items with the newest first
        items.sort((a, b) => b.timestamp - a.timestamp);

        for (const item of items) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';

            const originalP = document.createElement('p');
            originalP.className = 'original-text';
            originalP.textContent = `Original: "${item.original}"`;
            
            const summaryP = document.createElement('p');
            summaryP.className = 'summary-text';
            summaryP.textContent = item.summary;

            itemDiv.appendChild(originalP);
            itemDiv.appendChild(summaryP);
            historyContainer.appendChild(itemDiv);
        }
    };

    // Function to filter history based on search
    const filterHistory = () => {
        const query = searchBar.value.toLowerCase();
        const items = document.querySelectorAll('.history-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.classList.add('visible');
            } else {
                item.classList.remove('visible');
            }
        });
    };

    // Function to clear the history
    const clearHistory = () => {
        // Ask for confirmation to prevent accidents
        if (confirm("Are you sure you want to delete your entire history? This cannot be undone.")) {
            // Remove the history from storage
            chrome.storage.local.remove('geminiHistory', () => {
                // Re-render the (now empty) history view
                renderHistory([]);
            });
        }
    };

    // Load history from storage and render it
    chrome.storage.local.get('geminiHistory', (data) => {
        const history = data.geminiHistory || [];
        renderHistory(history);
        filterHistory(); // Show all items initially
    });

    // Add event listeners
    searchBar.addEventListener('input', filterHistory);
    clearButton.addEventListener('click', clearHistory);
});