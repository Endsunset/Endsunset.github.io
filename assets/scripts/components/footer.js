// Load header with error handling
import { fetchWithFallback } from '../utils/fetchUtils.js';

export function loadFooter() {
    fetchWithFallback(
        '/assets/partials/footer.html',
        'footer-container',
        '<div class="fallback">
            <a>© ${new Date().getFullYear()} Endsunset. All rights reserved.</a>
        </div>'
    );
}
