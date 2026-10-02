// Load header with error handling
import { fetchWithFallback } from '../utils/fetchUtils.js';

export function loadHeader() {
    fetchWithFallback(
        '/partials/header.html',
        'header-container',
        `<div class="fallback">
            <a href="/">Endsunset</a> |
            <a href="/#projects">Projects</a>
        </div>`
    );
}
