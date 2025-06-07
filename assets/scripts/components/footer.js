// Load header with error handling
import { fetchWithFallback } from 'https://endsunset.github.io/assets/scripts/utils/fetchUtils.js';

export function loadFooter() {
    fetchWithFallback(
        'https://endsunset.github.io/partials/footer.html',
        'footer-container',
        '<div class="fallback">
            <a>© ${new Date().getFullYear()} Endsunset. All rights reserved.</a>
        </div>'
    )
        .then(html => {
            document.getElementById('year').textContent = new Date().getFullYear();
        });
}
