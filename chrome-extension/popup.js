document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const messageDiv = document.getElementById('message');
    const progressBar = document.getElementById('downloadProgress');
    const progressElement = progressBar.querySelector('.progress');
    const statusText = document.getElementById('statusText');

    // Helper function to show messages
    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
    }

    // Helper function to validate URL
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Reset UI state
    function resetUI() {
        progressBar.style.display = 'none';
        progressElement.style.width = '0%';
        statusText.textContent = '';
        downloadBtn.disabled = false;
    }

    // Handle download button click
    downloadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();

        // Validate URL
        if (!url) {
            showMessage('Please enter a URL', 'error');
            return;
        }

        if (!isValidUrl(url)) {
            showMessage('Please enter a valid URL', 'error');
            return;
        }

        // Prepare UI for download
        downloadBtn.disabled = true;
        messageDiv.style.display = 'none';
        progressBar.style.display = 'block';
        statusText.textContent = 'Starting download...';

        try {
            // Send download request to background script
            chrome.runtime.sendMessage(
                { action: 'download', url: url },
                (response) => {
                    if (chrome.runtime.lastError) {
                        showMessage('Error: ' + chrome.runtime.lastError.message, 'error');
                        resetUI();
                        return;
                    }

                    if (response.success) {
                        showMessage('Download started successfully!', 'success');
                        // Clear input after successful download
                        urlInput.value = '';
                    } else {
                        showMessage('Failed to start download: ' + response.error, 'error');
                    }
                    resetUI();
                }
            );
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
            resetUI();
        }
    });

    // Listen for download progress updates from background script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'downloadProgress') {
            progressElement.style.width = `${message.progress}%`;
            statusText.textContent = `Downloaded: ${message.progress}%`;
        }
    });

    // Auto-focus the input field when popup opens
    urlInput.focus();
});
