// Handle download requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'download') {
        try {
            chrome.downloads.download({
                url: request.url,
                saveAs: true // This will prompt the user where to save the file
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    sendResponse({ 
                        success: false, 
                        error: chrome.runtime.lastError.message 
                    });
                    return;
                }

                // Store download ID to track progress
                trackDownload(downloadId);
                sendResponse({ success: true, downloadId: downloadId });
            });

            // Keep the message channel open for asynchronous response
            return true;
        } catch (error) {
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }
});

// Track download progress
function trackDownload(downloadId) {
    chrome.downloads.onChanged.addListener(function downloadListener(delta) {
        if (delta.id === downloadId) {
            // Handle download state changes
            if (delta.state) {
                if (delta.state.current === 'complete') {
                    // Download completed successfully
                    notifyDownloadComplete();
                    chrome.downloads.onChanged.removeListener(downloadListener);
                } else if (delta.state.current === 'interrupted') {
                    // Download failed
                    notifyDownloadError();
                    chrome.downloads.onChanged.removeListener(downloadListener);
                }
            }

            // Update progress if available
            if (delta.bytesReceived && delta.totalBytes) {
                const progress = Math.round(
                    (delta.bytesReceived.current / delta.totalBytes.current) * 100
                );
                updateProgress(progress);
            }
        }
    });
}

// Send progress updates to popup
function updateProgress(progress) {
    chrome.runtime.sendMessage({
        action: 'downloadProgress',
        progress: progress
    });
}

// Show notification when download completes
function notifyDownloadComplete() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Download Complete',
        message: 'Your file has been downloaded successfully!'
    });
}

// Show notification when download fails
function notifyDownloadError() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Download Failed',
        message: 'There was an error downloading your file.'
    });
}
