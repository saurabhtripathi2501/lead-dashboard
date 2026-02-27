const dataSource = [
    "dataset_crawler-google-places_2026-02-26_11-26-44-141.json",
    "dentist.json",
    "interiordesign.json"
];

let allLeads = [];
let currentIndex = 0;

const dom = {
    card: document.getElementById('lead-card'),
    loading: document.getElementById('loading-state'),
    error: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    position: document.getElementById('position-indicator'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn')
};

const displayFields = [
    { label: "Business Name", source: "title", copyable: true, isTitle: true },
    { label: "Business Type", source: "categoryName", copyable: false },
    { label: "Address", source: "address", copyable: true },
    { label: "Phone Number", source: "phone", copyable: true },
    { label: "Website", source: "website", copyable: true, isLink: true },
    { label: "City", source: "city", copyable: false, isGrid: true },
    { label: "State", source: "state", copyable: false, isGrid: true },
    { label: "Rating", source: "totalScore", copyable: false, isGrid: true },
    { label: "Reviews", source: "reviewsCount", copyable: false, isGrid: true }
];

const copyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

async function init() {
    try {
        const fetchPromises = dataSource.map(file => fetch(file).then(res => {
            if (!res.ok) throw new Error(`Failed to load ${file}: ${res.statusText}`);
            return res.json();
        }));
        
        const results = await Promise.all(fetchPromises);
        
        results.forEach(arr => {
            if (Array.isArray(arr)) {
                allLeads = allLeads.concat(arr);
            }
        });
        
        if (allLeads.length === 0) {
            throw new Error("No leads found in the source files.");
        }
        
        dom.loading.classList.add('hidden');
        dom.card.classList.remove('hidden');
        
        renderLead();
        setupEventListeners();
        
    } catch (err) {
        console.error(err);
        dom.loading.classList.add('hidden');
        dom.error.classList.remove('hidden');
        dom.errorMessage.textContent = err.message || "An error occurred while loading leads.";
        dom.position.textContent = "Error";
    }
}

function renderLead() {
    if (allLeads.length === 0) return;
    
    const lead = allLeads[currentIndex];
    
    // Update navigation state
    dom.prevBtn.disabled = currentIndex === 0;
    dom.nextBtn.disabled = currentIndex === allLeads.length - 1;
    dom.position.textContent = `Lead ${currentIndex + 1} of ${allLeads.length}`;
    
    // Clear current card
    dom.card.innerHTML = '';
    
    // Create elements
    let mainFieldsHtml = '';
    let gridFieldsHtml = '<div class="grid-fields">';
    
    displayFields.forEach(field => {
        let rawValue = lead[field.source];
        let displayValue = (rawValue !== undefined && rawValue !== null && rawValue !== "") ? rawValue : "Not available";
        let isAvailable = displayValue !== "Not available";
        
        let valueHtml = '';
        if (field.isLink && isAvailable) {
            valueHtml = `<a href="${displayValue}" target="_blank" rel="noopener noreferrer">${displayValue}</a>`;
        } else {
            valueHtml = displayValue;
        }
        
        // Escape for literal use in onclick
        const escapedDisplayValue = String(displayValue).replace(/`/g, '\\`').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        const copyBtnHtml = (field.copyable && isAvailable) ? `
            <button class="copy-btn" onclick="copyToClipboard(this, \`${escapedDisplayValue}\`)">
                ${copyIcon} Copy
            </button>
        ` : '';

        const cssClass = field.isTitle ? 'field-value title' : 'field-value';
        
        const fieldHtml = `
            <div class="field-group">
                <div class="field-header">
                    <div class="field-label">${field.label}</div>
                    ${copyBtnHtml}
                </div>
                <div class="${cssClass}">${valueHtml}</div>
            </div>
        `;
        
        if (field.isGrid) {
            gridFieldsHtml += fieldHtml;
        } else {
            mainFieldsHtml += fieldHtml;
        }
    });
    
    gridFieldsHtml += '</div>';
    
    dom.card.innerHTML = mainFieldsHtml + gridFieldsHtml;
    
    // Small animation effect
    dom.card.style.animation = 'none';
    dom.card.offsetHeight; // Trigger reflow
    dom.card.style.animation = 'fadeIn 0.3s ease-out';
}

function navigate(direction) {
    if (direction === 'next' && currentIndex < allLeads.length - 1) {
        currentIndex++;
        renderLead();
    } else if (direction === 'prev' && currentIndex > 0) {
        currentIndex--;
        renderLead();
    }
}

function setupEventListeners() {
    dom.prevBtn.addEventListener('click', () => navigate('prev'));
    dom.nextBtn.addEventListener('click', () => navigate('next'));
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            navigate('prev');
        } else if (e.key === 'ArrowRight') {
            navigate('next');
        }
    });
}

window.copyToClipboard = async function(btnNode, text) {
    try {
        await navigator.clipboard.writeText(text);
        
        // Change button layout to copied state
        const originalHtml = btnNode.innerHTML;
        btnNode.innerHTML = `${checkIcon} Copied!`;
        btnNode.classList.add('copied');
        
        setTimeout(() => {
            btnNode.innerHTML = originalHtml;
            btnNode.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        const originalHtml = btnNode.innerHTML;
        btnNode.textContent = "Failed";
        setTimeout(() => {
            btnNode.innerHTML = originalHtml;
        }, 2000);
    }
};

// Start the app
init();
