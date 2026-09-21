// Load header with error handling
import { fetchWithFallback } from '../utils/fetchUtils.js';

export function loadFooter() {
    fetchWithFallback(
        '/partials/footer.html',
        'footer-container',
        `<div class="fallback">
            <a>© ${new Date().getFullYear()} Endsunset. All rights reserved.</a>
        </div>`
    )
        .then(html => {
            const year = document.getElementById('year');
            if (year) year.textContent = new Date().getFullYear();
        });
}
