export function fetchWithFallback(url, elementId, fallbackHtml) {
    if (!document.getElementById(elementId)) return Promise.resolve();
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load ${url}`);
            return response.text();
        })
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
        })
        .catch(error => {
            console.error(`Loading failed for ${url}:`, error);
            document.getElementById(elementId).innerHTML = fallbackHtml;
        });
}
