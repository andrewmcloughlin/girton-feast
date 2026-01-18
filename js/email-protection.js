// Email obfuscation helper function
function createProtectedEmail(user, domain) {
    const email = user + '@' + domain;
    const link = document.createElement('a');
    link.href = 'mailto:' + email;
    link.textContent = email;
    link.className = arguments[2] || ''; // Optional class name
    return link;
}

// Initialize protected email links
function initProtectedEmails() {
    // Replace data-email attributes with actual mailto links
    document.querySelectorAll('[data-email-user]').forEach(element => {
        const user = element.getAttribute('data-email-user');
        const domain = element.getAttribute('data-email-domain');
        const className = element.className;

        const link = createProtectedEmail(user, domain, className);
        element.replaceWith(link);
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProtectedEmails);
} else {
    initProtectedEmails();
}
