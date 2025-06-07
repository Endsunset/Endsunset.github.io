// Load header with error handling
import { fetchWithFallback } from 'https://endsunset.github.io/assets/scripts/utils/fetchUtils.js';

export function loadHeader() {
    fetchWithFallback(
        'https://endsunset.github.io/assets/partials/header.html',
        'header-container',
        '<div class="fallback">
            <a href="/">Endsunset</a> |
            <a href="/documentation/">Documentation</a>
            <a href="/videos/">Videos</a>
            <a href="/">Support</a>
        </div>'
    );
}
