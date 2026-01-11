(function() {
  function initBadge(container) {
    if (container.classList.contains('pp-initialized')) return;
    container.classList.add('pp-initialized');

    const productId = container.getAttribute('data-product-id');
    const customerId = container.getAttribute('data-customer-id');
    const showUnmatched = container.getAttribute('data-show-unmatched') === 'true';
    const isDesignMode = container.getAttribute('data-design-mode') === 'true';
    const loadingEl = container.querySelector('.pp-match-loading');
    const contentEl = container.querySelector('#pp-match-badge-content');

    if (isDesignMode) {
      return; // Skip JS initialization in design mode as Liquid handles preview
    }

    if (!customerId || customerId === "") {
      container.remove();
      return;
    }

    async function fetchMatches() {
      try {
        const response = await fetch(`/apps/pet-matcher-final/pet-profiles?logged_in_customer_id=${customerId}&product_id=gid://shopify/Product/${productId}`);
        
        if (!response.ok) throw new Error('Failed to fetch matches');
        
        const data = await response.json();
        
        if (data.disabled) {
          container.remove();
          return;
        }

        if (data.error) {
          console.error('Pet Matcher Proxy error:', data.error);
          container.remove();
          return;
        }

        renderMatches(data);
      } catch (error) {
        console.error('Pet Matcher error:', error);
        container.remove();
      }
    }

    function renderMatches(data) {
      const { profiles, matches } = data;
      
      if (!profiles || profiles.length === 0) {
        container.remove();
        return;
      }

      const results = profiles.map(pet => {
        const matchStatus = matches.find(m => m.petId === pet.id);
        return {
          ...pet,
          isMatched: matchStatus ? matchStatus.isMatched : false,
          warnings: matchStatus ? (matchStatus.warnings || []) : []
        };
      });

      const toRender = showUnmatched ? results : results.filter(r => r.isMatched || r.warnings.length > 0);

      if (toRender.length === 0) {
        container.remove();
        return;
      }

      let html = '';
      toRender.forEach(pet => {
        const statusClass = pet.isMatched ? 'pp-match-item--matched' : 'pp-match-item--unmatched';
        const icon = pet.isMatched ? '🐾' : '⚪';
        const label = pet.isMatched ? 'Matched for' : 'Not a match for';
        
        let warningHtml = '';
        if (pet.warnings.includes('MISSING_WEIGHT')) {
          warningHtml = `
            <div class="pp-match-warning">
              ⚠️ This product has weight (size) rules. Please be careful, or update <strong>${pet.name}'s</strong> profile with weight information for a better match.
            </div>
          `;
        }
        
        html += `
          <div class="pp-match-item-wrapper">
            <div class="pp-match-item ${statusClass}">
              <span class="pp-match-icon">${icon}</span>
              <span>${label} <strong>${pet.name}</strong></span>
            </div>
            ${warningHtml}
          </div>
        `;
      });

      contentEl.innerHTML = html;
      loadingEl.style.display = 'none';
      contentEl.style.display = 'block';
    }

    fetchMatches();
  }

  // Initialize all badges on the page
  document.querySelectorAll('.pp-match-badge-container').forEach(initBadge);
})();
