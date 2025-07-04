// Clean loading indicator utilities

// Variables to track loading state
let isLoading = false;

// Function to show loading indicator
function showLoading() {
    // If already loading, don't restart
    if (isLoading) return;
    
    isLoading = true;
    
    // Show the loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('active');
    }
    
    // Store the loading state in sessionStorage to persist across page navigation
    sessionStorage.setItem('isLoading', 'true');
}

// Function to hide loading indicator
function hideLoading() {
    isLoading = false;
    
    // Hide the loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('active');
    }
    
    // Clear the loading state in sessionStorage
    sessionStorage.removeItem('isLoading');
}

// Check if we were loading when the page was navigated
function checkLoadingState() {
    const wasLoading = sessionStorage.getItem('isLoading') === 'true';
    
    if (wasLoading) {
        showLoading();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkLoadingState();
});
