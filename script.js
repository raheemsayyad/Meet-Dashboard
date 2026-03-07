// 1. Data for the dropdowns
let itemDatabase = JSON.parse(localStorage.getItem('meatWholesale_itemConfig')) || {
    Mutton: ["Mutton", "Mutton Boneless", "Mutton Kheema", "Mutton Liver", "Mutton Head", "Mutton Legs", "Mutton Brain", "Mutton Boti", "Mutton Lungs"],
    Chicken: ["Chicken Live", "Boiler Live", "Foreign Chicken Live", "Dressed chicken", "Skinless chicken", "Boneless chicken", "Lolypop chicken", "Kabab chicken", "chicken liver", "chicken parts", "baby eggs", "faram chicken"],
    Fish: ["Rohu", "Katla", "Prawns"]
};


// 2. Logic to update the Item Part dropdown
function updateSubItems() {
    const mainCat = document.getElementById('h-main-category').value;
    const subDropdown = document.getElementById('h-item');
    subDropdown.innerHTML = '';

    if (mainCat && itemDatabase[mainCat]) {
        itemDatabase[mainCat].forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            subDropdown.appendChild(option);
        });
    } else {
        subDropdown.innerHTML = '<option value="">Select Category First</option>';
    }
    applySaleEntryMode('hotel');
    updateHotelItemStockHint();
}

function updateLedgerSubItems() {
    const mainCat = document.getElementById('log-main-category')?.value;
    const subDropdown = document.getElementById('log-item');
    if (!subDropdown) return;
    subDropdown.innerHTML = '';

    if (mainCat && itemDatabase[mainCat]) {
        itemDatabase[mainCat].forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            subDropdown.appendChild(option);
        });
    } else {
        subDropdown.innerHTML = '<option value="">Select Category First</option>';
    }

    applySaleEntryMode('ledger');
    updateLedgerItemStockHint();
}

function updateHotelItemStockHint() {
    const hint = document.getElementById('hotel-stock-availability');
    const itemEl = document.getElementById('h-item');
    const categoryEl = document.getElementById('h-main-category');
    if (!hint || !itemEl) return;

    const selectedItem = String(itemEl.value || '').trim();
    const stock = getCurrentAvailableStock();
    const special = getSpecialItemAvailability();
    const selectedCategory = String(categoryEl?.value || '').trim().toLowerCase();

    if (!selectedItem) {
        if (selectedCategory === 'mutton') {
            hint.textContent = `Stock Available (Mutton): ${stock.animals.toFixed(2)} kg`;
            hint.className = `text-[11px] font-bold px-1 mt-3 ${stock.animals > 0 ? 'text-green-600' : 'text-red-600'}`;
            return;
        }
        if (selectedCategory === 'chicken') {
            hint.textContent = `Stock Available (Chicken): ${stock.hens.toFixed(2)} kg`;
            hint.className = `text-[11px] font-bold px-1 mt-3 ${stock.hens > 0 ? 'text-green-600' : 'text-red-600'}`;
            return;
        }
        if (selectedCategory === 'fish') {
            hint.textContent = `Stock Available (Fish): ${stock.fish.toFixed(2)} kg`;
            hint.className = `text-[11px] font-bold px-1 mt-3 ${stock.fish > 0 ? 'text-green-600' : 'text-red-600'}`;
            return;
        }
        hint.textContent = `Stock Available: M ${stock.animals.toFixed(2)}kg | C ${stock.hens.toFixed(2)}kg | F ${stock.fish.toFixed(2)}kg | L ${stock.chickenLiver.toFixed(2)}kg`;
        hint.className = 'text-[11px] font-bold text-slate-500 px-1 mt-3';
        return;
    }

    if (isChickenLegItem(selectedItem)) {
        hint.textContent = `Stock Available (Chicken Legs): ${Math.floor(special.chickenLegs)} legs (${special.hensCount} hens)`;
        hint.className = `text-[11px] font-bold px-1 mt-3 ${special.chickenLegs > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }
    if (isMuttonLegItem(selectedItem)) {
        hint.textContent = `Stock Available (Mutton Legs): ${Math.floor(special.muttonLegs)} legs (${special.animalsCount} animals)`;
        hint.className = `text-[11px] font-bold px-1 mt-3 ${special.muttonLegs > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }
    if (isMuttonHeadItem(selectedItem)) {
        hint.textContent = `Stock Available (Mutton Head): ${Math.floor(special.muttonHeads)} heads`;
        hint.className = `text-[11px] font-bold px-1 mt-3 ${special.muttonHeads > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }
    if (isChickenLiverItem(selectedItem)) {
        const avLiver = stock.chickenLiver || 0;
        hint.textContent = `Stock Available (Chicken Liver): ${avLiver.toFixed(2)} kg`;
        hint.className = `text-[11px] font-bold px-1 mt-3 ${avLiver > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }

    const bucket = getStockBucket(selectedItem);
    if (!bucket) {
        hint.textContent = 'Stock Available: -';
        hint.className = 'text-[11px] font-bold text-red-600 px-1 mt-3';
        return;
    }

    const av = stock[bucket] || 0;
    hint.textContent = `Stock Available (${getStockBucketLabel(bucket)}): ${av.toFixed(2)} kg`;
    hint.className = `text-[11px] font-bold px-1 mt-3 ${av > 0 ? 'text-green-600' : 'text-red-600'}`;
}

function applySaleEntryMode(context) {
    const isHotel = context === 'hotel';
    const itemEl = document.getElementById(isHotel ? 'h-item' : 'log-item');
    const qtyEl = document.getElementById(isHotel ? 'h-qty' : 'log-qty');
    const weightEl = document.getElementById(isHotel ? 'h-weight' : 'log-weight');
    if (!itemEl || !qtyEl || !weightEl) return;

    const item = String(itemEl.value || '');
    if (!item) {
        [qtyEl, weightEl].forEach(el => {
            el.disabled = false;
            el.classList.remove('opacity-50', 'bg-slate-100', 'cursor-not-allowed');
        });
        return;
    }

    const isPiece = Boolean(getSpecialItemType(item));

    const setFieldState = (el, disabled) => {
        el.disabled = disabled;
        el.classList.toggle('opacity-50', disabled);
        el.classList.toggle('bg-slate-100', disabled);
        el.classList.toggle('cursor-not-allowed', disabled);
    };

    setFieldState(weightEl, isPiece);
    setFieldState(qtyEl, !isPiece);

    if (isPiece) weightEl.value = '0';
}

// 3. Add/Remove Logic
async function addNewSubItem() {
    const mainCat = document.getElementById('h-main-category').value;
    if (!mainCat) {
        appAlert("Select a category first!", 'warning');
        return;
    }
    const newItem = await appPrompt(`Enter new part for ${mainCat}:`, '', 'Add Item');
    if (newItem) {
        itemDatabase[mainCat].push(newItem);
        localStorage.setItem('meatWholesale_itemConfig', JSON.stringify(itemDatabase));
        updateSubItems();
        appAlert('Item added successfully.', 'success');
    }
}

async function removeSubItem() {
    const mainCat = document.getElementById('h-main-category').value;
    const currentSub = document.getElementById('h-item').value;
    if (!mainCat || !currentSub) return;
    if (await appConfirm(`Delete "${currentSub}"?`, 'Remove Item')) {
        itemDatabase[mainCat] = itemDatabase[mainCat].filter(i => i !== currentSub);
        localStorage.setItem('meatWholesale_itemConfig', JSON.stringify(itemDatabase));
        updateSubItems();
        appAlert('Item removed.', 'success');
    }
}


let hotels = JSON.parse(localStorage.getItem('meatWholesale_hotels')) || [];
let salesData = JSON.parse(localStorage.getItem('meatWholesale_sales')) || [];
let inventoryData = JSON.parse(localStorage.getItem('meatWholesale_inventory')) || [];

if (Array.isArray(hotels)) {
    hotels = hotels.map(normalizeHotel);
}

const DEFAULT_ITEM_CATEGORIES = ['Chicken', 'Chicken Liver', 'Chicken Legs', 'Mutton', 'Mutton Legs', 'Mutton Head', 'Fish'];
const VENDOR_INVENTORY_RULES = {
    chickenLegsPerBird: 2,
    muttonLegsPerAnimal: 4,
    muttonHeadsPerAnimal: 1
};
const LOW_STOCK_THRESHOLDS = {
    animalsKg: 15,
    hensKg: 12,
    fishKg: 8,
    chickenLiverKg: 3,
    chickenLegs: 20,
    muttonLegs: 24,
    muttonHeads: 8
};

let ITEM_CATEGORIES = normalizeCategories(
    safeGetJSON('meat_categories', DEFAULT_ITEM_CATEGORIES)
);
let deliveries = normalizeDeliveries(safeGetJSON('deliveries', {}));
let currentHotelId = null;
let hotelTableFilterQuery = '';
let currentLedgerFilterQuery = '';

function safeGetJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (!value) return fallback;
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch (e) {
        console.error("Error parsing JSON for key:", key, e);
        return fallback;
    }
}

function sanitizeText(value, max = 80) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function sanitizePhone(value) {
    return String(value || '').replace(/[^\d+\-\s()]/g, '').trim().slice(0, 20);
}

function normalizePhoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function validateIndianPhone(value, required = false) {
    const digits = normalizePhoneDigits(value);
    if (!digits) {
        return required
            ? { ok: false, message: 'Phone number is required.' }
            : { ok: true, normalized: '' };
    }
    if (digits.length === 10) return { ok: true, normalized: digits };
    if (digits.length === 12 && digits.startsWith('91')) return { ok: true, normalized: digits.slice(2) };
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
}

function splitPhoneTokens(rawValue) {
    return String(rawValue || '')
        .split(/[,\n;\/|]+/)
        .map(s => s.trim())
        .filter(Boolean);
}

function validateIndianPhoneList(rawValue, required = false) {
    const tokens = splitPhoneTokens(rawValue);
    if (!tokens.length) {
        return required
            ? { ok: false, message: 'At least one phone number is required.', normalizedList: [] }
            : { ok: true, normalizedList: [] };
    }
    const normalizedList = [];
    for (const token of tokens) {
        const checked = validateIndianPhone(token, true);
        if (!checked.ok) {
            return { ok: false, message: `Invalid number "${token}". Use 10-digit mobile number.`, normalizedList: [] };
        }
        if (!normalizedList.includes(checked.normalized)) normalizedList.push(checked.normalized);
    }
    return { ok: true, normalizedList };
}

function getHotelPhoneList(hotel) {
    if (!hotel || typeof hotel !== 'object') return [];
    const rawList = Array.isArray(hotel.phones) ? hotel.phones : [];
    const candidates = rawList.length ? rawList : [hotel.phone || ''];
    const normalizedList = [];
    candidates.forEach(entry => {
        const checked = validateIndianPhone(entry, false);
        if (checked.ok && checked.normalized && !normalizedList.includes(checked.normalized)) {
            normalizedList.push(checked.normalized);
        }
    });
    return normalizedList;
}

function formatHotelPhoneList(hotel) {
    const list = getHotelPhoneList(hotel);
    return list.length ? list.join(', ') : '';
}

function markInvalidField(el, invalid) {
    if (!el) return;
    el.classList.toggle('input-invalid', Boolean(invalid));
}

function initUiFeedback() {
    const dialog = document.getElementById('app-dialog');
    if (!dialog || dialog.dataset.bound === '1') return;
    const backdrop = dialog.querySelector('.absolute.inset-0');
    backdrop?.addEventListener('click', () => {
        const cancelBtn = document.getElementById('app-dialog-cancel');
        cancelBtn?.click();
    });
    dialog.dataset.bound = '1';
}

function appAlert(message, type = 'error') {
    const stack = document.getElementById('app-toast-stack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;
    toast.textContent = String(message || '');
    stack.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-4px)';
        setTimeout(() => toast.remove(), 180);
    }, 2400);
}

function appConfirm(message, title = 'Confirm') {
    return new Promise(resolve => {
        const dialog = document.getElementById('app-dialog');
        const titleEl = document.getElementById('app-dialog-title');
        const msgEl = document.getElementById('app-dialog-message');
        const inputEl = document.getElementById('app-dialog-input');
        const okBtn = document.getElementById('app-dialog-ok');
        const cancelBtn = document.getElementById('app-dialog-cancel');
        if (!dialog || !okBtn || !cancelBtn || !titleEl || !msgEl || !inputEl) {
            resolve(window.confirm(message));
            return;
        }

        titleEl.textContent = title;
        msgEl.textContent = String(message || '');
        inputEl.classList.add('hidden');
        inputEl.value = '';
        dialog.classList.remove('hidden');

        const cleanup = (value) => {
            dialog.classList.add('hidden');
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(value);
        };

        okBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
    });
}

function appPrompt(message, defaultValue = '', title = 'Input Required') {
    return new Promise(resolve => {
        const dialog = document.getElementById('app-dialog');
        const titleEl = document.getElementById('app-dialog-title');
        const msgEl = document.getElementById('app-dialog-message');
        const inputEl = document.getElementById('app-dialog-input');
        const okBtn = document.getElementById('app-dialog-ok');
        const cancelBtn = document.getElementById('app-dialog-cancel');
        if (!dialog || !okBtn || !cancelBtn || !titleEl || !msgEl || !inputEl) {
            resolve(window.prompt(message, defaultValue));
            return;
        }

        titleEl.textContent = title;
        msgEl.textContent = String(message || '');
        inputEl.classList.remove('hidden');
        inputEl.value = String(defaultValue || '');
        dialog.classList.remove('hidden');
        setTimeout(() => inputEl.focus(), 0);

        const cleanup = (value) => {
            dialog.classList.add('hidden');
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            resolve(value);
        };

        okBtn.onclick = () => cleanup(inputEl.value);
        cancelBtn.onclick = () => cleanup(null);
    });
}

function toNonNegative(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function asNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function normalizeHotel(hotel) {
    const phoneList = getHotelPhoneList(hotel);
    return {
        id: asNumber(hotel?.id) || Date.now(),
        name: sanitizeText(hotel?.name || 'Hotel'),
        phone: phoneList[0] || '',
        phones: phoneList
    };
}

function normalizeCategories(categories) {
    const source = Array.isArray(categories)
        ? [...DEFAULT_ITEM_CATEGORIES, ...categories]
        : DEFAULT_ITEM_CATEGORIES;
    const seen = new Set();
    return source
        .map(c => sanitizeText(c, 40))
        .filter(c => c && !seen.has(c.toLowerCase()) && seen.add(c.toLowerCase()));
}

function normalizeDeliveries(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const out = {};
    Object.entries(raw).forEach(([hotelId, logs]) => {
        if (!Array.isArray(logs)) return;
        out[hotelId] = logs.map(log => ({
            id: asNumber(log?.id) || Date.now(),
            date: sanitizeText(log?.date, 20),
            item: sanitizeText(log?.item, 40),
            quantity: sanitizeText(log?.quantity, 20),
            weight: asNumber(log?.weight),
            rate: asNumber(log?.rate),
            total: asNumber(log?.total),
            paid: asNumber(log?.paid),
            pending: asNumber(log?.pending),
            specialType: sanitizeText(log?.specialType, 30)
        }));
    });
    return out;
}

window.onload = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initUiFeedback();
    refreshItemDropdown();
    handlePurchaseTypeChange();
    initPurchaseCostListeners();
    initSalaryFieldListeners();
    // Conversion settings UI removed: no runtime init needed.

    const hotelInput = document.getElementById('hotel-name-input');
    const hotelPhoneInput = document.getElementById('hotel-phone-input');
    if (hotelInput && !hotelInput.dataset.bound) {
        hotelInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') saveNewHotelFromBar();
        });
        hotelInput.dataset.bound = '1';
    }
    if (hotelPhoneInput && !hotelPhoneInput.dataset.bound) {
        hotelPhoneInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') saveNewHotelFromBar();
        });
        hotelPhoneInput.dataset.bound = '1';
    }

    if (!document.getElementById('dashboard')?.classList.contains('hidden')) {
        initApp();
    }

    const logItem = document.getElementById('log-item');
    if (logItem && !logItem.dataset.stockBound) {
        logItem.addEventListener('change', () => {
            applySaleEntryMode('ledger');
            updateLedgerItemStockHint();
        });
        logItem.dataset.stockBound = '1';
    }
};

document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    if (document.getElementById('username').value === 'admin' && document.getElementById('password').value === '1234') {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        initApp();
    } else {
        appAlert('Invalid Credentials');
    }
};

function initApp() {
    setPurchaseDateToToday(true);
    const todayISO = toLocalISODate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = toLocalISODate(yesterday);
    if (document.getElementById('sales-date-from') && !document.getElementById('sales-date-from').value) {
        document.getElementById('sales-date-from').value = yesterdayISO;
    }
    if (document.getElementById('sales-date-to') && !document.getElementById('sales-date-to').value) {
        document.getElementById('sales-date-to').value = todayISO;
    }
    renderHotels();
    refreshItemDropdown();
    handlePurchaseTypeChange();
    initPurchaseCostListeners();
    initSalaryFieldListeners();
    // Conversion settings UI removed: no runtime init needed.
    renderPurchaseTable();
    updateBusinessAnalytics();
    updateSalesTrackingStats();
    handleSalesFilterChange();
    applySaleEntryMode('hotel');
    applySaleEntryMode('ledger');
    updateLedgerItemStockHint();
    initPhoneValidationBindings();
    setTopNavActive('none');
    runBasicSmokeChecks();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function runBasicSmokeChecks() {
    const requiredFunctions = [
        'renderHotelTable',
        'renderDetailedLedgerRows',
        'savePurchase',
        'saveHotelAndSale',
        'updateSalesTrackingStats'
    ];
    const missing = requiredFunctions.filter(fn => typeof window[fn] !== 'function');
    if (missing.length) console.warn('Smoke check: missing functions ->', missing.join(', '));
}

function initPhoneValidationBindings() {
    const phoneInput = document.getElementById('h-phone');
    if (!phoneInput || phoneInput.dataset.phoneBound === '1') return;
    phoneInput.addEventListener('input', () => {
        const result = validateIndianPhoneList(phoneInput.value, false);
        markInvalidField(phoneInput, !result.ok);
    });
    phoneInput.dataset.phoneBound = '1';
}

function setTopNavActive(mode) {
    const addStockBtn = document.getElementById('nav-add-stock-btn');
    const salesBtn = document.getElementById('nav-sales-btn');
    const businessBtn = document.getElementById('nav-business-btn');
    [addStockBtn, salesBtn, businessBtn].forEach(btn => btn?.classList.remove('nav-btn-active'));
    if (mode === 'stock') addStockBtn?.classList.add('nav-btn-active');
    if (mode === 'sales') salesBtn?.classList.add('nav-btn-active');
    if (mode === 'business') businessBtn?.classList.add('nav-btn-active');
}

function switchMainView(targetId) {
    const allViews = ['hotel-list-view', 'ledger-view', 'business-view', 'sales-tracking-view'];
    allViews.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === targetId) {
            el.classList.remove('hidden');
            el.classList.remove('view-enter');
            void el.offsetWidth;
            el.classList.add('view-enter');
        } else {
            el.classList.add('hidden');
            el.classList.remove('view-enter');
        }
    });
}

function saveNewHotelFromBar() {
    const input = document.getElementById('hotel-name-input');
    const phoneInput = document.getElementById('hotel-phone-input');
    const name = sanitizeText(input?.value, 80);
    const phoneCheck = validateIndianPhoneList(phoneInput?.value || '', false);

    if (name) {
        if (!phoneCheck.ok) return appAlert(phoneCheck.message);
        
        // Push the new hotel data
        hotels.push({
            id: Date.now(),
            name,
            phone: phoneCheck.normalizedList?.[0] || '',
            phones: phoneCheck.normalizedList || []
        });
        
        saveData(); // Save to localStorage
        
        // CRITICAL: Change this from renderHotels() to your new table function
        renderHotelTable(); 
        
        // Reset UI
        input.value = '';
        if (phoneInput) phoneInput.value = '';
        toggleElement('add-hotel-bar');
    } else {
        appAlert('Please enter a hotel name.');
    }
}

function renderHotels() {
    const container = document.getElementById('hotels-grid') || document.getElementById('hotel-card-container');
    if (!container) return;

    container.innerHTML = hotels.map(hotel => {
        const logs = deliveries[hotel.id] || [];
        const totalPending = logs.reduce((sum, log) => sum + (parseFloat(log.pending) || 0), 0);
        const hotelName = escapeHTML(hotel.name);
        const hotelPhone = escapeHTML(formatHotelPhoneList(hotel));

        return `
            <div class="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <div onclick="viewLedger(${hotel.id})" class="cursor-pointer">
                        <h3 class="font-bold text-lg text-slate-800">${hotelName}</h3>
                        ${hotelPhone ? `<p class="text-xs text-slate-500 mb-1">Phone: ${hotelPhone}</p>` : ''}
                        <p class="text-sm text-slate-500">Total Pending: <span class="${totalPending > 0 ? 'text-red-500' : 'text-green-600'} font-bold">Rs ${Math.abs(totalPending).toLocaleString()}</span></p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editHotel(${hotel.id})" class="p-2 hover:bg-blue-50 rounded-full text-blue-500 transition-colors">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteHotel(${hotel.id})" class="p-2 hover:bg-red-50 rounded-full text-red-400 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <button onclick="viewLedger(${hotel.id})" class="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors">
                    View Ledger
                </button>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function viewLedger(id) {
    currentHotelId = id;
    const hotel = hotels.find(h => h.id === id);
    if (!hotel) return;

    document.getElementById('current-hotel-name').textContent = hotel.name;
    switchMainView('ledger-view');
    setTopNavActive('none');
    renderLedgerTable();
    updateLedgerItemStockHint();
}

function setAddHotelSaveMode(editHotelId = null) {
    const saveBtn = document.getElementById('main-save-btn');
    if (!saveBtn) return;
    if (editHotelId) {
        saveBtn.setAttribute('onclick', `updateExistingHotel(${editHotelId})`);
        saveBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-5 h-5"></i> Update Hotel Details`;
    } else {
        saveBtn.setAttribute('onclick', 'saveHotelAndSale()');
        saveBtn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Confirm & Save Hotel`;
    }
}

function resetAddHotelForm() {
    const fields = ['h-name', 'h-phone', 'h-qty', 'h-weight', 'h-rate', 'h-total', 'h-paid'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const cat = document.getElementById('h-main-category');
    const item = document.getElementById('h-item');
    if (cat) cat.value = '';
    if (item) item.innerHTML = '<option value="">Select Category First</option>';
    markInvalidField(document.getElementById('h-phone'), false);
    applySaleEntryMode('hotel');
    updateHotelItemStockHint();
}

function openAddHotelDashboard() {
    resetAddHotelForm();
    setAddHotelSaveMode(null);
    const dashboard = document.getElementById('add-hotel-dashboard');
    if (dashboard) dashboard.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeAddHotelDashboard() {
    const dashboard = document.getElementById('add-hotel-dashboard');
    if (dashboard) dashboard.classList.add('hidden');
}


function editHotel(id) {
    // 1. Find the Hotel and its last sale entry
    const hotel = hotels.find(h => h.id === id);
    if (!hotel) return;
    const logs = salesData.filter(l => l.hotelId === id || l.source === hotel.name);
    const lastSale = logs.length > 0
        ? [...logs].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0]
        : null;

    // 2. Fill the Dashboard Inputs with current data
    document.getElementById('h-name').value = hotel.name;
    document.getElementById('h-phone').value = formatHotelPhoneList(hotel);
    
    if (lastSale) {
        const categoryField = document.getElementById('h-main-category');
        const itemField = document.getElementById('h-item');
        const guessedCategory = inferCategoryByItem(lastSale.item);
        if (categoryField) {
            categoryField.value = guessedCategory || '';
            updateSubItems();
        }
        if (itemField) {
            itemField.value = lastSale.item || '';
        }

        document.getElementById('h-qty').value = lastSale.qty || 0;
        document.getElementById('h-weight').value = lastSale.weight || 0;
        document.getElementById('h-rate').value = lastSale.rate || 0;
        document.getElementById('h-total').value = lastSale.total || 0;
        document.getElementById('h-paid').value = lastSale.paid || 0;
        applySaleEntryMode('hotel');
    }
    updateHotelItemStockHint();

    // 3. Change the Save Button to "Update" mode
    setAddHotelSaveMode(id);

    // 4. Show the dashboard and scroll to it
    const dashboard = document.getElementById('add-hotel-dashboard');
    dashboard.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (window.lucide) lucide.createIcons();
}



function updateExistingHotel(id) {
    const name = sanitizeText(document.getElementById('h-name')?.value, 80);
    const phoneInput = document.getElementById('h-phone');
    const phoneCheck = validateIndianPhoneList(phoneInput?.value || '', false);
    markInvalidField(phoneInput, !phoneCheck.ok);
    if (!name) return appAlert('Hotel name is required.', 'warning');
    if (!phoneCheck.ok) return appAlert(phoneCheck.message, 'warning');

    // Update Hotel record
    const hIdx = hotels.findIndex(h => h.id === id);
    if (hIdx !== -1) {
        hotels[hIdx].name = name;
        hotels[hIdx].phone = phoneCheck.normalizedList?.[0] || '';
        hotels[hIdx].phones = phoneCheck.normalizedList || [];
    }

    // Update Last Sale record
    const sIdx = salesData.findLastIndex(s => s.hotelId === id);
    if (sIdx !== -1) {
        salesData[sIdx].source = name;
        salesData[sIdx].item = document.getElementById('h-item').value;
        salesData[sIdx].qty = document.getElementById('h-qty').value;
        salesData[sIdx].weight = document.getElementById('h-weight').value;
        salesData[sIdx].rate = document.getElementById('h-rate').value;
        salesData[sIdx].total = document.getElementById('h-total').value;
        salesData[sIdx].paid = document.getElementById('h-paid').value;
    }

    saveData();
    renderHotelTable();

    // Reset Button
    setAddHotelSaveMode(null);
    resetAddHotelForm();
    closeAddHotelDashboard();
    appAlert("Updated Successfully!", 'success');
}

async function deleteHotel(id) {
    if (await appConfirm('Are you sure you want to delete this hotel and all its records?', 'Delete Hotel')) {
        // 1. Remove from hotels array
        hotels = hotels.filter(h => h.id !== id);

        // 2. Remove related sales data (previously referred to as deliveries)
        // We filter out any sales that belong to this hotel ID
        salesData = salesData.filter(s => s.hotelId !== id);

        // 3. Save to localStorage
        saveData();

        // 4. Refresh the Table (Using the correct function name)
        renderHotelTable(); 

        // 5. Update Analytics if the function exists
        if (typeof updateBusinessAnalytics === "function") {
            updateBusinessAnalytics();
        }
        appAlert('Hotel deleted.', 'success');
    }
}

function toggleLogForm() {
    const form = document.getElementById('log-form-container');
    
    // Check if the form actually exists in your HTML
    if (!form) {
        console.error("Error: Could not find 'log-form-container'. Check your HTML IDs.");
        return;
    }

    // Toggle the 'hidden' class
    const isOpening = form.classList.contains('hidden');
    form.classList.toggle('hidden');

    // If opening, clear the fields for a fresh entry
    if (isOpening) {
        // Only call these if they exist in your script
        if (typeof resetLogFormFields === "function") resetLogFormFields();
        
        // Smooth scroll to the form so the user sees it
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function validateSaleAgainstStock({ item, qty, weight, editId = null }) {
    const specialType = getSpecialItemType(item);
    const bucket = getStockBucket(item);

    const special = getSpecialItemAvailability(editId || null);
    if (specialType === 'chicken_legs' && qty > special.chickenLegs) {
        return `INSUFFICIENT STOCK!\nOnly ${Math.floor(special.chickenLegs)} chicken legs available.`;
    }
    if (specialType === 'mutton_legs' && qty > special.muttonLegs) {
        return `INSUFFICIENT STOCK!\nOnly ${Math.floor(special.muttonLegs)} mutton legs available.`;
    }
    if (specialType === 'mutton_head' && qty > special.muttonHeads) {
        return `INSUFFICIENT STOCK!\nOnly ${Math.floor(special.muttonHeads)} mutton heads available.`;
    }

    if (!specialType) {
        if (!bucket) return `Stock bucket not found for item: ${item}`;
        const stock = getCurrentAvailableStock();
        if (editId) {
            const oldLog = salesData.find(l => Number(l.id) === Number(editId));
            if (oldLog) {
                const oldBucket = getStockBucket(oldLog.item);
                if (oldBucket) stock[oldBucket] = (stock[oldBucket] || 0) + (parseFloat(oldLog.weight) || 0);
            }
        }
        const available = Math.max(0, stock[bucket] || 0);
        if (weight > available) {
            return `INSUFFICIENT STOCK!\nOnly ${available.toFixed(2)} kg available for ${item}.`;
        }
    }

    return '';
}

function handleFormSubmit(event) {
    event.preventDefault();

    const hotelId = currentHotelId || currentActiveHotelId;
    if (!hotelId) return appAlert('Please open a hotel ledger first.');

    const item = document.getElementById('log-item')?.value?.trim() || '';
    const qty = parseFloat(document.getElementById('log-qty')?.value) || 0;
    const weight = parseFloat(document.getElementById('log-weight')?.value) || 0;
    const rate = parseFloat(document.getElementById('log-rate')?.value) || 0;
    const bill = parseFloat(document.getElementById('log-total')?.value) || 0;
    const rawPayment = parseFloat(document.getElementById('log-paid')?.value) || 0;
    const payment = toNonNegative(rawPayment);
    const editId = document.getElementById('edit-id')?.value || '';
    const selectedDateValue = document.getElementById('log-date')?.value || '';
    const specialType = getSpecialItemType(item);

    if (!item) return appAlert('Please select an item.');
    if (!selectedDateValue) return appAlert('Please select Date.');
    if (!rate || rate <= 0) return appAlert('Please enter Rate.');
    if (rawPayment < 0) return appAlert('Paid amount cannot be negative.');
    if (!specialType && (!weight || weight <= 0)) return appAlert('Please enter Weight.');
    if ((specialType === 'chicken_legs' || specialType === 'mutton_legs' || specialType === 'mutton_head') && (!qty || qty <= 0)) {
        return appAlert('Please enter Qty for selected item.');
    }

    const stockError = validateSaleAgainstStock({ item, qty, weight, editId });
    if (stockError) return appAlert(stockError);

    const now = new Date();
    const selectedDate = new Date(selectedDateValue + 'T00:00:00');
    const entryDate = Number.isNaN(selectedDate.getTime())
        ? now.toLocaleDateString('en-IN')
        : selectedDate.toLocaleDateString('en-IN');
    const isPieceBilling = Boolean(specialType);
    const effectiveWeight = isPieceBilling ? 0 : weight;
    const lineTotal = isPieceBilling ? (qty * rate) : (bill || (effectiveWeight * rate));
    const newEntry = {
        id: editId ? Number(editId) : Date.now(),
        hotelId: hotelId,
        source: hotels.find(h => h.id === hotelId)?.name || '',
        item: item,
        qty: String(qty || 0),
        weight: String(effectiveWeight || 0),
        rate: String(rate || 0),
        total: lineTotal,
        paid: payment,
        date: entryDate,
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        specialType: specialType || '',
        installments: payment > 0 ? [{
            date: now.toLocaleDateString('en-IN'),
            time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            amt: payment
        }] : []
    };

    if (editId) {
        const idx = salesData.findIndex(s => Number(s.id) === Number(editId));
        if (idx >= 0) {
            const existing = salesData[idx];
            salesData[idx] = {
                ...existing,
                ...newEntry,
                paid: Number(existing.paid) || 0,
                installments: Array.isArray(existing.installments) ? existing.installments : []
            };
        }
        else salesData.push(newEntry);
    } else {
        salesData.push(newEntry);
    }

    localStorage.setItem('meatWholesale_sales', JSON.stringify(salesData));
    renderDetailedLedgerRows(hotelId);
    renderHotelTable();
    updateBusinessAnalytics();
    toggleLogForm();
    event.target.reset();
    applySaleEntryMode('ledger');
}
function resetLogFormFields() {
    const date = document.getElementById('log-date');
    const mainCategory = document.getElementById('log-main-category');
    const item = document.getElementById('log-item');
    const qty = document.getElementById('log-qty');
    const weight = document.getElementById('log-weight');
    const rate = document.getElementById('log-rate');
    const total = document.getElementById('log-total');
    const paid = document.getElementById('log-paid');
    const editId = document.getElementById('edit-id');

    if (editId) editId.value = '';
    if (date) date.value = toLocalISODate(new Date());
    if (mainCategory) mainCategory.value = '';
    updateLedgerSubItems();
    if (item && item.options.length > 0) item.selectedIndex = 0;
    if (qty) qty.value = '';
    if (weight) weight.value = '';
    if (rate) rate.value = '';
    if (total) total.value = '';
    if (paid) paid.value = '';
    updateLedgerItemStockHint();
}

let waPickerState = {
    phones: [],
    message: "Hello, sharing your latest ledger update from Ismail Mutton & Chicken Complex."
};

function normalizePhoneListInput(phone) {
    const list = Array.isArray(phone)
        ? phone.map(p => validateIndianPhone(p, false).normalized).filter(Boolean)
        : (() => {
            const checked = validateIndianPhoneList(phone, false);
            return checked.ok ? checked.normalizedList : [];
        })();
    return Array.from(new Set(list));
}

function buildWhatsAppUrl(phoneNumber, message) {
    return `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message || '')}`;
}

function openWhatsAppUrl(url) {
    const opened = window.open(url, '_blank');
    if (!opened) {
        appAlert('Popup blocked. Allow popups for this site and try again.', 'warning');
        return false;
    }
    return true;
}

function sendWhatsAppToNumber(phoneNumber) {
    const checked = validateIndianPhone(phoneNumber, false);
    if (!checked.ok || !checked.normalized) return appAlert("Invalid phone number.");
    const opened = openWhatsAppUrl(buildWhatsAppUrl(checked.normalized, waPickerState.message));
    if (opened) closeWhatsAppPicker();
}

function closeWhatsAppPicker() {
    const modal = document.getElementById('wa-picker-modal');
    if (modal) modal.classList.add('hidden');
}

async function sendWhatsAppToAllFromPicker() {
    if (!waPickerState.phones.length) return appAlert("No phone number found.");
    const ok = await appConfirm(`Send message to all ${waPickerState.phones.length} numbers?`, 'Send To All');
    if (!ok) return;
    let openedAny = false;
    waPickerState.phones.forEach((phoneNumber, index) => {
        setTimeout(() => {
            const opened = openWhatsAppUrl(buildWhatsAppUrl(phoneNumber, waPickerState.message));
            openedAny = openedAny || opened;
        }, index * 250);
    });
    if (openedAny) closeWhatsAppPicker();
}

function renderWhatsAppPicker(title = 'Choose WhatsApp Number') {
    const modal = document.getElementById('wa-picker-modal');
    const titleEl = document.getElementById('wa-picker-title');
    const subtitleEl = document.getElementById('wa-picker-subtitle');
    const listEl = document.getElementById('wa-picker-list');
    if (!modal || !titleEl || !subtitleEl || !listEl) return;

    titleEl.textContent = String(title || 'Choose WhatsApp Number');
    subtitleEl.textContent = `Select one number (${waPickerState.phones.length} available) or send to all.`;
    listEl.innerHTML = waPickerState.phones.map((phoneNumber, idx) => `
        <div class="flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3 py-2">
            <div>
                <div class="text-xs font-black text-slate-700">#${idx + 1}</div>
                <div class="text-sm font-bold text-slate-900">${escapeHTML(phoneNumber)}</div>
            </div>
            <button onclick="sendWhatsAppToNumber('${phoneNumber}')" class="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-black hover:bg-green-700">Send</button>
        </div>
    `).join('');
    modal.classList.remove('hidden');
}

function sendWhatsApp(phone, options = {}) {
    const phoneList = normalizePhoneListInput(phone);
    if (!phoneList.length) return appAlert("No phone number found for this hotel.");

    const message = String(options.message || "Hello, sharing your latest ledger update from Ismail Mutton & Chicken Complex.");
    const title = String(options.title || 'Choose WhatsApp Number');

    if (phoneList.length === 1) {
        waPickerState = { phones: phoneList, message };
        sendWhatsAppToNumber(phoneList[0]);
        return;
    }

    waPickerState = { phones: phoneList, message };
    renderWhatsAppPicker(title);
}

function sendHotelWhatsApp(hotelId) {
    const hotel = hotels.find(h => Number(h.id) === Number(hotelId));
    if (!hotel) return appAlert("Hotel not found.");
    const logs = salesData
        .filter(l => Number(l.hotelId) === Number(hotel.id) || l.source === hotel.name)
        .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    if (!logs.length) {
        return sendWhatsApp(getHotelPhoneList(hotel), {
            title: `${hotel.name} - WhatsApp`,
            message: `*Hotel Ledger - ${hotel.name}*\nNo ledger entries found.`
        });
    }

    let totalSales = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalKg = 0;
    let totalPieces = 0;

    const details = logs.map((log, idx) => {
        const billed = Number(log.total) || 0;
        const paid = Number(log.paid) || 0;
        const due = Math.max(0, billed - paid);
        const rateValue = Number(log.rate || 0);
        const qtyValue = Number(log.qty || 0);
        const weightValue = Number(log.weight || 0);
        const isPieceItem = Boolean(getSpecialItemType(log?.item || ''));
        const rateUnit = isPieceItem ? '/pc' : '/kg';

        totalSales += billed;
        totalPaid += paid;
        totalDue += due;
        if (isPieceItem) totalPieces += qtyValue;
        else totalKg += weightValue;

        return `${idx + 1}) Date: ${log.date || '-'} ${log.time || ''}\n` +
            `Item: ${log.item || '-'}\n` +
            `Qty: ${qtyValue}\n` +
            `Weight: ${weightValue} kg\n` +
            `Rate: Rs ${rateValue.toLocaleString()} ${rateUnit}\n` +
            `Bill: Rs ${billed.toLocaleString()}\n` +
            `Paid: Rs ${paid.toLocaleString()}\n` +
            `Due: Rs ${due.toLocaleString()}`;
    });

    const message =
        `*Hotel Ledger - ${hotel.name}*\n` +
        `*Total Entries*: ${logs.length}\n` +
        `*Total Sales*: Rs ${totalSales.toLocaleString()}\n` +
        `*Total Paid*: Rs ${totalPaid.toLocaleString()}\n` +
        `*Total Due*: Rs ${totalDue.toLocaleString()}\n` +
        `*Total Kg Sold*: ${totalKg.toFixed(2)} kg\n` +
        `*Total Pcs Sold*: ${Math.floor(totalPieces)}\n\n` +
        `${details.join('\n\n')}`;
    sendWhatsApp(getHotelPhoneList(hotel), {
        title: `${hotel.name} - WhatsApp`,
        message
    });
}

async function removeCurrentSubItem() {
    const mainCat = document.getElementById('h-main-category').value;
    const selectedPart = document.getElementById('h-item').value;

    if (!mainCat || !selectedPart || selectedPart === "Select Category") {
        appAlert("Please select a category and an item part to remove.", 'warning');
        return;
    }

    if (await appConfirm(`Are you sure you want to delete "${selectedPart}" from the ${mainCat} list?`, 'Remove Item')) {
        itemDatabase[mainCat] = itemDatabase[mainCat].filter(item => item !== selectedPart);
        localStorage.setItem('meatWholesale_itemConfig', JSON.stringify(itemDatabase));
        updateSubItems(); // Refresh the dropdown
        appAlert("Item removed successfully.", 'success');
    }
}

function saveLog() {
    const q = parseFloat(document.getElementById('log-qty').value) || 0;
    const w = parseFloat(document.getElementById('log-weight').value) || 0;
    const r = parseFloat(document.getElementById('log-rate').value) || 0;
    const p = parseFloat(document.getElementById('log-paid').value) || 0;
    const eid = document.getElementById('edit-id').value;
    const item = document.getElementById('log-item').value;
    const specialType = getSpecialItemType(item);

    if (!r) return appAlert('Please enter Rate.');
    if (!specialType && !w) return appAlert('Please enter Weight.');
    if ((specialType === 'chicken_legs' || specialType === 'mutton_legs' || specialType === 'mutton_head') && !q) {
        return appAlert('Please enter Qty for selected item.');
    }
    const stockError = validateSaleAgainstStock({ item, qty: q, weight: w, editId: eid || null });
    if (stockError) return appAlert(stockError);

    const lineTotal = (specialType === 'chicken_legs' || specialType === 'mutton_legs' || specialType === 'mutton_head')
        ? (q * r)
        : (w * r);

    const log = {
        id: eid ? parseInt(eid) : Date.now(),
        date: document.getElementById('log-date').value,
        item,
        quantity: String(q || 0),
        weight: w,
        rate: r,
        total: lineTotal,
        paid: p,
        pending: lineTotal - p,
        specialType: specialType || ''
    };

    if (!deliveries[currentHotelId]) deliveries[currentHotelId] = [];
    if (eid) {
        const idx = deliveries[currentHotelId].findIndex(l => l.id == eid);
        deliveries[currentHotelId][idx] = log;
    } else {
        deliveries[currentHotelId].unshift(log);
    }

    saveData();
    renderLedgerTable();
    updateBusinessAnalytics();
    toggleLogForm();
}


function renderDetailedLedgerRows(hotelId) {
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;

    const logs = getCurrentHotelLedgerLogs(hotelId, currentLedgerFilterQuery);
    tbody.innerHTML = '';
    if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="py-6 px-3 text-center text-sm font-semibold text-slate-500">No matching ledger records found.</td></tr>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    logs.forEach((log, index) => {
        const summary = getPaymentSummary(log);
        const installments = getLogInstallments(log);
        const latestInstallment = installments.length ? installments[installments.length - 1] : null;

        const row = `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-4 px-2 text-xs text-slate-500">${index + 1}</td>
                <td class="py-4 px-2">
                    <div class="flex flex-col text-[11px]">
                        <span class="font-bold text-slate-700">${log.date || '-'}</span>
                        <span class="text-red-500 font-bold">${log.time || '-'}</span>
                    </div>
                </td>
                <td class="py-4 px-2 font-bold text-slate-700">${log.type || log.item}</td>
                <td class="py-4 px-2 text-center text-sm">${log.qty || 0}</td>
                <td class="py-4 px-2 text-center text-sm">${log.weight} <small>kg</small></td>
                <td class="py-4 px-2 text-center text-sm font-bold text-slate-700">${Number(log.rate || 0).toLocaleString()} <small>${log.specialType ? '/pc' : '/kg'}</small></td>
                <td class="py-4 px-2 text-center font-bold text-slate-900">Rs ${summary.total.toLocaleString()}</td>
                <td class="py-4 px-2 text-center font-bold text-green-600">Rs ${summary.paid.toLocaleString()}</td>
                <td class="py-4 px-2 min-w-[120px]">
                    <div class="space-y-1">
                        <div class="text-[10px] font-black text-slate-600">Payments: ${installments.length}</div>
                        <div class="text-[10px] font-semibold text-slate-400">
                            ${latestInstallment ? `Latest: Rs ${Number(latestInstallment.amt || 0).toLocaleString()}` : 'No payments yet'}
                        </div>
                        <button onclick="openPaymentDetailsModal(${hotelId}, ${log.id})" class="text-[10px] text-blue-600 font-extrabold hover:underline">Payment Details</button>
                    </div>
                </td>
                <td class="py-4 px-2 text-center">${getStatusBadgeHtml(summary)}</td>
                <td class="py-4 px-2">
                    <div class="flex justify-center gap-2">
                        <button onclick="sendWhatsAppLog(${log.id})" class="p-1.5 hover:bg-green-50 rounded text-green-600"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
                        <button onclick="editLog(${log.id})" class="p-1.5 hover:bg-blue-50 rounded text-blue-600"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick="deleteLog(${log.id})" class="p-1.5 hover:bg-red-50 rounded text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    if (window.lucide) lucide.createIcons();
}
let currentActiveHotelId = null; // To keep track of which hotel we are viewing

function openHotelLedger(hotelId) {
    currentActiveHotelId = hotelId;
    currentHotelId = hotelId;
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return;

    // 1. Switch UI Views
    switchMainView('ledger-view');
    setTopNavActive('none');

    // 2. Update Header Details
    document.getElementById('current-hotel-name').innerText = hotel.name;
    currentLedgerFilterQuery = '';
    const ledgerFilterInput = document.getElementById('ledger-table-filter');
    if (ledgerFilterInput) ledgerFilterInput.value = '';
    
    // 3. Render the detailed rows
    renderDetailedLedgerRows(hotelId);
}

document.addEventListener('DOMContentLoaded', () => {
    // If the user is already logged in or when dashboard shows
    renderHotelTable(); 
    
    // Initialize Lucide icons
    if (window.lucide) lucide.createIcons();
});

function showHotelList() {
    // 1. View switch with shared transition
    switchMainView('hotel-list-view');
    setTopNavActive('none');
    
    // 3. REFRESH EVERYTHING
    renderHotelTable(); // Use the new TABLE function, NOT renderHotels
    
    if (typeof updateBusinessAnalytics === "function") {
        updateBusinessAnalytics();
    }
}

function getPaymentSummary(log) {
    const total = Number(log?.total) || (Number(log?.weight) * Number(log?.rate)) || 0;
    const paid = Number(log?.paid) || 0;
    const diff = paid - total;
    const due = diff < 0 ? Math.abs(diff) : 0;
    const advance = diff > 0 ? diff : 0;
    return { total, paid, due, advance, diff };
}

function getStatusBadgeHtml(summary) {
    if (summary.due > 0) {
        return `<span class="px-2 py-1 rounded text-[10px] font-black uppercase bg-red-100 text-red-700">Due: Rs ${summary.due.toLocaleString()}</span>`;
    }
    if (summary.advance > 0) {
        return `<span class="px-2 py-1 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-700">Adv: Rs ${summary.advance.toLocaleString()}</span>`;
    }
    return `<span class="px-2 py-1 rounded text-[10px] font-black uppercase bg-green-100 text-green-700">Paid</span>`;
}

function getLogInstallments(log) {
    const existing = Array.isArray(log?.installments) ? [...log.installments] : [];
    if (existing.length > 0) return existing;
    const paid = Number(log?.paid) || 0;
    if (paid <= 0) return [];
    return [{
        date: log?.date || '-',
        time: log?.time || '',
        amt: paid
    }];
}

function toExcelSafe(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(filename, headers, rows) {
    const lines = [];
    lines.push(headers.map(toExcelSafe).join(','));
    rows.forEach(row => lines.push(row.map(toExcelSafe).join(',')));
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleHotelTableFilterInput(value) {
    hotelTableFilterQuery = String(value || '').trim();
    renderHotelTable();
}

function getHotelDashboardRows(filterQuery = hotelTableFilterQuery) {
    const searchQuery = String(filterQuery || '').trim().toLowerCase();
    const displayHotels = [...hotels].reverse();

    return displayHotels
        .map(hotel => {
            const logs = salesData.filter(l => l.hotelId === hotel.id || l.source === hotel.name);
            const lastSale = logs.length > 0
                ? [...logs].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0]
                : null;

            const lastSaleDate = String(lastSale?.date || '-');
            const lastSaleTime = String(lastSale?.time || '-');

            let muttonKg = 0;
            let chickenKg = 0;
            let fishKg = 0;
            let otherKg = 0;
            let chickenLegsPcs = 0;
            let muttonLegsPcs = 0;
            let muttonHeadsPcs = 0;

            logs.forEach(log => {
                const specialType = getSpecialItemType(log?.item);
                const qty = Number(log?.qty) || 0;
                const weight = Number(log?.weight) || 0;

                if (specialType === 'chicken_legs') {
                    chickenLegsPcs += qty;
                    return;
                }
                if (specialType === 'mutton_legs') {
                    muttonLegsPcs += qty;
                    return;
                }
                if (specialType === 'mutton_head') {
                    muttonHeadsPcs += qty;
                    return;
                }

                const cat = inferCategoryByItem(log?.item);
                if (cat === 'Mutton') muttonKg += weight;
                else if (cat === 'Chicken') chickenKg += weight;
                else if (cat === 'Fish') fishKg += weight;
                else otherKg += weight;
            });

            const totalWeightKg = muttonKg + chickenKg + fishKg + otherKg;
            const weightBreakdown = `M: ${muttonKg.toFixed(2)} | C: ${chickenKg.toFixed(2)} | F: ${fishKg.toFixed(2)}`;
            const otherBreakdown = otherKg > 0 ? ` | O: ${otherKg.toFixed(2)}` : '';
            const totalBill = logs.reduce((sum, l) => sum + (Number(l.total) || 0), 0);
            const totalPaid = logs.reduce((sum, l) => sum + (Number(l.paid) || 0), 0);
            const ledgerSummary = getPaymentSummary({ total: totalBill, paid: totalPaid });
            const paymentStats = getHotelPaymentStats(hotel.id);
            const phoneText = formatHotelPhoneList(hotel);
            const stockText = getStockAvailabilityTextForItem(lastSale?.item || '');

            const rowData = {
                hotelId: hotel.id,
                hotelName: hotel.name || '',
                phoneText,
                lastSaleDate,
                lastSaleTime,
                lastItem: lastSale?.item || '-',
                lastQty: Number(lastSale?.qty || 0),
                lastWeight: Number(lastSale?.weight || 0),
                lastSaleRate: Number(lastSale?.rate || 0),
                lastSaleRateUnit: getSpecialItemType(lastSale?.item || '') ? '/pc' : '/kg',
                lastSaleTotal: Number(lastSale?.total || 0),
                stockText,
                totalBill,
                totalPaid,
                ledgerSummary,
                paymentStats,
                muttonKg,
                chickenKg,
                fishKg,
                otherKg,
                totalWeightKg,
                chickenLegsPcs,
                muttonLegsPcs,
                muttonHeadsPcs,
                weightBreakdown,
                otherBreakdown
            };

            rowData.searchText = [
                rowData.hotelName,
                rowData.phoneText,
                rowData.lastSaleDate,
                rowData.lastSaleTime,
                rowData.lastItem,
                rowData.stockText,
                `${rowData.lastSaleTotal}`,
                `${rowData.ledgerSummary?.due || 0}`,
                `${rowData.ledgerSummary?.advance || 0}`,
                rowData.weightBreakdown
            ].join(' ').toLowerCase();

            return rowData;
        })
        .filter(row => !searchQuery || row.searchText.includes(searchQuery));
}

function exportHotelsToExcel() {
    const filteredRows = getHotelDashboardRows(hotelTableFilterQuery);
    if (!filteredRows.length) return appAlert('No matching rows found to export.', 'warning');

    const rows = filteredRows.map((row, i) => {
        return [
            i + 1,
            row.hotelName,
            row.phoneText,
            row.lastSaleDate === '-' ? '' : row.lastSaleDate,
            row.lastSaleTime === '-' ? '' : row.lastSaleTime,
            row.lastItem === '-' ? '' : row.lastItem,
            Number(row.lastQty || 0),
            Number(row.lastWeight || 0),
            Number(row.lastSaleRate || 0),
            row.lastSaleRateUnit,
            Number(row.lastSaleTotal || 0),
            Number(row.totalBill || 0),
            Number(row.totalPaid || 0),
            Number(row.ledgerSummary?.due || 0),
            Number(row.ledgerSummary?.advance || 0),
            Number(row.totalWeightKg.toFixed(2)),
            Number(row.muttonKg.toFixed(2)),
            Number(row.chickenKg.toFixed(2)),
            Number(row.fishKg.toFixed(2)),
            Number(row.otherKg.toFixed(2)),
            Number(row.chickenLegsPcs || 0),
            Number(row.muttonLegsPcs || 0),
            Number(row.muttonHeadsPcs || 0),
            row.stockText
        ];
    });

    const cleanFilter = hotelTableFilterQuery ? hotelTableFilterQuery.replace(/[^\w-]+/g, '_').slice(0, 40) : '';
    downloadCSV(
        `${cleanFilter ? `hotels_filtered_${cleanFilter}` : 'hotels'}_${new Date().toISOString().slice(0, 10)}.csv`,
        [
            'S.No', 'Hotel', 'Phone', 'Date', 'Time', 'Item', 'Qty', 'Weight', 'Rate', 'Rate Unit', 'Bill',
            'Total Bill', 'Total Paid', 'Due', 'Advance',
            'Total Kg Sold', 'Mutton Kg', 'Chicken Kg', 'Fish Kg', 'Other Kg',
            'Chicken Legs (pcs)', 'Mutton Legs (pcs)', 'Mutton Heads (pcs)',
            'Stock Availability'
        ],
        rows
    );
}

function sendFilteredHotelsToWhatsApp() {
    const filteredRows = getHotelDashboardRows(hotelTableFilterQuery);
    if (!filteredRows.length) return appAlert('No matching rows found for WhatsApp.', 'warning');

    let totalBill = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalAdvance = 0;
    let totalWeight = 0;

    const detailLines = filteredRows.map((row, idx) => {
        const due = Number(row.ledgerSummary?.due || 0);
        const adv = Number(row.ledgerSummary?.advance || 0);
        totalBill += Number(row.totalBill || 0);
        totalPaid += Number(row.totalPaid || 0);
        totalDue += due;
        totalAdvance += adv;
        totalWeight += Number(row.totalWeightKg || 0);

        const statusText = due > 0 ? `Due Rs ${due.toLocaleString()}` : (adv > 0 ? `Adv Rs ${adv.toLocaleString()}` : 'Paid');
        return `${idx + 1}) ${row.hotelName}\nDate: ${row.lastSaleDate} ${row.lastSaleTime}\nItem: ${row.lastItem}\nTotal: Rs ${Number(row.totalBill || 0).toLocaleString()}\nPaid: Rs ${Number(row.totalPaid || 0).toLocaleString()}\nStatus: ${statusText}`;
    });

    const filterLabel = hotelTableFilterQuery || 'All';
    const summaryLines = [
        '*Hotel Dashboard (Filtered)*',
        `Filter: ${filterLabel}`,
        `Hotels: ${filteredRows.length}`,
        `Total Bill: Rs ${totalBill.toLocaleString()}`,
        `Total Paid: Rs ${totalPaid.toLocaleString()}`,
        `Total Due: Rs ${totalDue.toLocaleString()}`,
        `Total Advance: Rs ${totalAdvance.toLocaleString()}`,
        `Total Weight: ${totalWeight.toFixed(2)} kg`
    ];

    const maxMessageLength = 1700;
    let detailText = '';
    let included = 0;
    for (const line of detailLines) {
        const candidate = `${detailText}${detailText ? '\n\n' : ''}${line}`;
        const candidateMessage = `${summaryLines.join('\n')}\n\n${candidate}`;
        if (candidateMessage.length > maxMessageLength) break;
        detailText = candidate;
        included += 1;
    }

    let message = `${summaryLines.join('\n')}\n\n${detailText || 'No row details available.'}`;
    if (included < filteredRows.length) {
        message += `\n\n...and ${filteredRows.length - included} more records.`;
    }

    openWhatsAppUrl(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

function handleCurrentLedgerFilterInput(value) {
    currentLedgerFilterQuery = String(value || '').trim();
    const hotelId = currentActiveHotelId || currentHotelId;
    if (hotelId) renderDetailedLedgerRows(hotelId);
}

function getCurrentHotelLedgerLogs(hotelId, filterQuery = currentLedgerFilterQuery) {
    const hotel = hotels.find(h => Number(h.id) === Number(hotelId));
    const searchQuery = String(filterQuery || '').trim().toLowerCase();
    const logs = salesData.filter(l => Number(l.hotelId) === Number(hotelId) || l.source === hotel?.name);
    if (!searchQuery) return logs;

    return logs.filter(log => {
        const summary = getPaymentSummary(log);
        const haystack = [
            log.date || '',
            log.time || '',
            log.type || log.item || '',
            String(log.qty || 0),
            String(log.weight || 0),
            String(log.rate || 0),
            String(summary.total || 0),
            String(summary.paid || 0),
            String(summary.due || 0),
            String(summary.advance || 0)
        ].join(' ').toLowerCase();
        return haystack.includes(searchQuery);
    });
}

function exportCurrentLedgerToExcel() {
    const hotelId = currentActiveHotelId || currentHotelId;
    if (!hotelId) return appAlert('Open a hotel ledger first.');
    const hotel = hotels.find(h => Number(h.id) === Number(hotelId));
    const logs = getCurrentHotelLedgerLogs(hotelId, currentLedgerFilterQuery);
    if (!logs.length) return appAlert('No matching ledger rows found to export.', 'warning');
    const rows = logs.map((log, i) => {
        const summary = getPaymentSummary(log);
        const installments = getLogInstallments(log);
        const lastPayment = installments.length ? installments[installments.length - 1] : null;
        const rateValue = Number(log.rate || 0);
        const rateUnit = log.specialType ? '/pc' : '/kg';
        return [
            i + 1,
            hotel?.name || '',
            log.date || '',
            log.time || '',
            log.item || '',
            Number(log.qty || 0),
            Number(log.weight || 0),
            rateValue,
            rateUnit,
            Number(summary.total || 0),
            Number(summary.paid || 0),
            Number(summary.due || 0),
            Number(summary.advance || 0),
            installments.length,
            lastPayment?.date || '',
            lastPayment?.time || '',
            Number(lastPayment?.amt || 0)
        ];
    });
    const cleanFilter = currentLedgerFilterQuery ? currentLedgerFilterQuery.replace(/[^\w-]+/g, '_').slice(0, 40) : '';
    downloadCSV(
        `ledger_${(hotel?.name || 'hotel').replace(/\s+/g, '_')}${cleanFilter ? `_filtered_${cleanFilter}` : ''}_${new Date().toISOString().slice(0, 10)}.csv`,
        ['S.No', 'Hotel', 'Date', 'Time', 'Item', 'Qty', 'Weight', 'Rate', 'Rate Unit', 'Bill', 'Paid', 'Due', 'Advance', 'Installments', 'Last Payment Date', 'Last Payment Time', 'Last Payment Amount'],
        rows
    );
}

function sendCurrentLedgerFilteredToWhatsApp() {
    const hotelId = currentActiveHotelId || currentHotelId;
    if (!hotelId) return appAlert('Open a hotel ledger first.', 'warning');
    const hotel = hotels.find(h => Number(h.id) === Number(hotelId));
    if (!hotel) return appAlert('Hotel not found.', 'warning');

    const logs = getCurrentHotelLedgerLogs(hotelId, currentLedgerFilterQuery);
    if (!logs.length) return appAlert('No matching ledger rows found for WhatsApp.', 'warning');

    let totalBill = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalAdvance = 0;

    const detailLines = logs.map((log, idx) => {
        const summary = getPaymentSummary(log);
        totalBill += Number(summary.total || 0);
        totalPaid += Number(summary.paid || 0);
        totalDue += Number(summary.due || 0);
        totalAdvance += Number(summary.advance || 0);
        const rateValue = Number(log.rate || 0);
        const rateUnit = log.specialType ? '/pc' : '/kg';

        return `${idx + 1}) Date: ${log.date || '-'} ${log.time || ''}\nItem: ${log.type || log.item || '-'}\nQty: ${log.qty || 0}\nWeight: ${log.weight || 0} kg\nRate: Rs ${rateValue.toLocaleString()} ${rateUnit}\nBill: Rs ${Number(summary.total || 0).toLocaleString()}\nPaid: Rs ${Number(summary.paid || 0).toLocaleString()}\nDue: Rs ${Number(summary.due || 0).toLocaleString()}`;
    });

    const summaryLines = [
        `*${hotel.name} - Ledger (Filtered)*`,
        `Entries: ${logs.length}`,
        `Total Bill: Rs ${totalBill.toLocaleString()}`,
        `Total Paid: Rs ${totalPaid.toLocaleString()}`,
        `Total Due: Rs ${totalDue.toLocaleString()}`,
        `Total Advance: Rs ${totalAdvance.toLocaleString()}`
    ];

    const maxMessageLength = 1700;
    let detailText = '';
    let included = 0;
    for (const line of detailLines) {
        const candidate = `${detailText}${detailText ? '\n\n' : ''}${line}`;
        const candidateMessage = `${summaryLines.join('\n')}\n\n${candidate}`;
        if (candidateMessage.length > maxMessageLength) break;
        detailText = candidate;
        included += 1;
    }

    let message = `${summaryLines.join('\n')}\n\n${detailText || 'No row details available.'}`;
    if (included < logs.length) message += `\n\n...and ${logs.length - included} more entries.`;

    sendWhatsApp(getHotelPhoneList(hotel), {
        message,
        title: `${hotel.name} - Send Filtered Ledger`
    });
}

function exportHotelTodayReportToExcel(hotelId) {
    const hotel = hotels.find(h => Number(h.id) === Number(hotelId));
    if (!hotel) return appAlert('Hotel not found.');

    const todayISO = getTodayISODate();
    const logs = salesData
        .filter(l => Number(l.hotelId) === Number(hotel.id) || l.source === hotel.name)
        .filter(l => parseSalesDateToISO(l.date) === todayISO)
        .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    if (!logs.length) return appAlert(`No sales entries for ${hotel.name} today.`);

    let totalSales = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalKg = 0;
    let totalPieces = 0;

    const rows = logs.map((log, i) => {
        const billed = Number(log.total) || 0;
        const paid = Number(log.paid) || 0;
        const due = Math.max(0, billed - paid);
        const rateUnit = getSpecialItemType(log.item || '') ? '/pc' : '/kg';
        const weight = Number(log.weight) || 0;
        const qty = Number(log.qty) || 0;
        const specialType = getSpecialItemType(log.item || '');

        totalSales += billed;
        totalPaid += paid;
        totalDue += due;
        if (specialType) totalPieces += qty;
        else totalKg += weight;

        return [
            i + 1,
            hotel.name || '',
            log.date || todayISO,
            log.time || '',
            log.item || '',
            qty,
            weight,
            Number(log.rate || 0),
            rateUnit,
            billed,
            paid,
            due
        ];
    });

    rows.push(['', '', '', '', 'TOTAL', totalPieces, Number(totalKg.toFixed(2)), '', '', totalSales, totalPaid, totalDue]);
    downloadCSV(
        `hotel_today_report_${(hotel.name || 'hotel').replace(/\s+/g, '_')}_${todayISO}.csv`,
        ['S.No', 'Hotel', 'Date', 'Time', 'Item', 'Qty', 'Weight (kg)', 'Rate', 'Rate Unit', 'Bill', 'Paid', 'Due'],
        rows
    );
}

function exportBusinessToExcel() {
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    const rows = purchases.map((p, i) => [
        i + 1,
        p.date || '',
        p.time || '',
        p.type || '',
        p.qty || '',
        p.weight || '',
        p.rate || '',
        Number(p.total || 0),
        p.description || '',
        p.employeeName || '',
        p.daysWorked || '',
        p.leavesTaken || '',
        Number(p.paid || 0),
        Number(p.pending || 0)
    ]);
    downloadCSV(
        `business_pl_${new Date().toISOString().slice(0, 10)}.csv`,
        ['S.No', 'Date', 'Time', 'Category', 'Qty', 'Weight', 'Rate', 'Total', 'Description', 'Employee', 'Days Worked', 'Leaves', 'Paid', 'Pending'],
        rows
    );
}

function getStockAvailabilityTextForItem(itemName) {
    const item = String(itemName || '').trim();
    const stock = getCurrentAvailableStock();
    if (!item) {
        return `Stock: M ${stock.animals.toFixed(2)}kg | C ${stock.hens.toFixed(2)}kg | F ${stock.fish.toFixed(2)}kg | L ${stock.chickenLiver.toFixed(2)}kg`;
    }

    const special = getSpecialItemAvailability();
    const bucket = getStockBucket(item);

    if (isChickenLegItem(item)) {
        return `Stock: ${Math.floor(special.chickenLegs)} legs (${Math.floor(special.hensCount)} hens)`;
    }
    if (isMuttonLegItem(item)) {
        return `Stock: ${Math.floor(special.muttonLegs)} legs (${Math.floor(special.animalsCount)} animals)`;
    }
    if (isMuttonHeadItem(item)) {
        return `Stock: ${Math.floor(special.muttonHeads)} heads`;
    }
    if (isChickenLiverItem(item)) {
        return `Stock: ${(stock.chickenLiver || 0).toFixed(2)} kg liver`;
    }
    if (bucket) {
        return `Stock: ${(stock[bucket] || 0).toFixed(2)} kg`;
    }
    return `Stock: M ${stock.animals.toFixed(2)}kg | C ${stock.hens.toFixed(2)}kg | F ${stock.fish.toFixed(2)}kg | L ${stock.chickenLiver.toFixed(2)}kg`;
}

function getHotelLogs(hotelId) {
    return salesData.filter(l => Number(l.hotelId) === Number(hotelId) || l.source === hotels.find(h => h.id === hotelId)?.name);
}

function getHotelPaymentStats(hotelId) {
    const logs = getHotelLogs(hotelId);
    const totals = logs.map(getPaymentSummary);
    const totalDue = totals.reduce((s, t) => s + t.due, 0);
    const totalAdvance = totals.reduce((s, t) => s + t.advance, 0);
    const totalPaid = totals.reduce((s, t) => s + t.paid, 0);
    const dueEntries = totals.filter(t => t.due > 0).length;
    const paidEntries = totals.filter(t => t.due === 0).length;
    return { logs, totalDue, totalAdvance, totalPaid, dueEntries, paidEntries, totalEntries: totals.length };
}

function recordInstallmentPayment(logId, amount, hotelId) {
    const amt = Number(amount);
    if (!amt || amt <= 0) return false;
    const logIndex = salesData.findIndex(l => Number(l.id) === Number(logId));
    if (logIndex === -1) return false;

    if (!salesData[logIndex].installments) salesData[logIndex].installments = [];
    const now = new Date();
    salesData[logIndex].installments.push({
        date: now.toLocaleDateString('en-IN'),
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        amt: amt
    });
    salesData[logIndex].paid = (Number(salesData[logIndex].paid) || 0) + amt;

    saveData();
    if (hotelId) renderDetailedLedgerRows(hotelId);
    renderHotelTable();
    updateBusinessAnalytics();
    updateSalesTrackingStats();
    return true;
}

function closePaymentDetailsModal() {
    const modal = document.getElementById('payment-details-modal');
    const content = document.getElementById('payment-details-content');
    if (modal) modal.classList.add('hidden');
    if (content) content.innerHTML = '';
}

function setPaymentModalFilter(mode, hotelId, focusLogId = null) {
    const validMode = ['all', 'due', 'settled'].includes(mode) ? mode : 'all';
    const content = document.getElementById('payment-details-content');
    if (content) content.setAttribute('data-payment-filter', validMode);
    openPaymentDetailsModal(hotelId, focusLogId);
}

function useFullPendingAmount(logId, hotelId) {
    const log = salesData.find(l => Number(l.id) === Number(logId));
    if (!log) return;
    const summary = getPaymentSummary(log);
    const input = document.getElementById(`repay-amt-${logId}`);
    if (input) input.value = String(summary.due.toFixed(2));
}

function repayFromModal(logId, hotelId) {
    const input = document.getElementById(`repay-amt-${logId}`);
    const amount = parseFloat(input?.value || '0');
    if (!amount || amount <= 0) return appAlert('Please enter a valid repayment amount.');
    if (!recordInstallmentPayment(logId, amount, hotelId)) return appAlert('Payment failed.');
    openPaymentDetailsModal(hotelId, logId);
}

function openPaymentDetailsModal(hotelId, focusLogId = null) {
    const hotel = hotels.find(h => Number(h.id) === Number(hotelId));
    if (!hotel) return;

    const stats = getHotelPaymentStats(hotelId);
    const modal = document.getElementById('payment-details-modal');
    const content = document.getElementById('payment-details-content');
    if (!modal || !content) return;

    const contentFilter = content.getAttribute('data-payment-filter') || 'all';

    const paymentLogs = stats.logs
        .map(log => ({ log, summary: getPaymentSummary(log), installments: getLogInstallments(log) }))
        .filter(x => {
            if (contentFilter === 'due') return x.summary.due > 0;
            if (contentFilter === 'settled') return x.summary.due === 0;
            return true;
        })
        .sort((a, b) => Number(b.log.id) - Number(a.log.id));

    const rowsHtml = paymentLogs.length > 0 ? paymentLogs.map(({ log, summary, installments }) => {
        const isFocused = Number(focusLogId) === Number(log.id);
        const historyHtml = installments.length > 0
            ? [...installments].reverse().map(ins => `
                <div class="min-w-[132px] bg-white border border-slate-200 rounded-lg px-2.5 py-2 leading-tight shadow-sm">
                    <p class="text-[11px] font-bold text-slate-600">${ins.date || '-'}</p>
                    <p class="text-[10px] font-semibold text-slate-400">${ins.time || ''}</p>
                    <p class="text-sm font-black text-blue-700 mt-1">Rs ${Number(ins.amt || 0).toLocaleString()}</p>
                </div>
            `).join('')
            : '<div class="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">No installment history</div>';

        return `
            <div id="payment-log-${log.id}" class="border ${isFocused ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'} rounded-xl p-3 space-y-2.5">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="text-sm font-black text-slate-800">${log.item || 'Item'}</p>
                        <p class="text-xs text-slate-500 font-semibold mt-0.5">${log.date || '-'} ${log.time || ''}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[11px] text-slate-500 font-bold uppercase">${summary.due > 0 ? 'Pending Amount' : 'Status'}</p>
                        <p class="text-base font-black ${summary.due > 0 ? 'text-red-600' : 'text-green-700'}">${summary.due > 0 ? `Rs ${summary.due.toLocaleString()}` : 'Settled'}</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-1.5 text-[11px] font-black">
                    <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">Bill: Rs ${summary.total.toLocaleString()}</span>
                    <span class="bg-green-100 text-green-700 px-2.5 py-1 rounded-md">Paid: Rs ${summary.paid.toLocaleString()}</span>
                    <span class="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md">Inst: ${installments.length}</span>
                    ${summary.due > 0
                        ? `<span class="bg-red-100 text-red-700 px-2.5 py-1 rounded-md">Due: Rs ${summary.due.toLocaleString()}</span>`
                        : '<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md">Clear</span>'
                    }
                </div>
                <div class="space-y-1.5">
                    <p class="text-xs font-black uppercase text-slate-500">Installment History</p>
                    <div class="flex flex-wrap gap-1.5 max-h-28 overflow-auto pr-1">${historyHtml}</div>
                </div>
                ${summary.due > 0 ? `
                    <div class="flex gap-2">
                        <input type="number" id="repay-amt-${log.id}" placeholder="Enter repayment amount" class="flex-1 px-3 py-2 border border-slate-200 rounded-lg font-semibold text-sm">
                        <button onclick="repayFromModal(${log.id}, ${hotelId})" class="px-4 bg-red-600 text-white rounded-lg font-black text-sm">Repay</button>
                    </div>
                    <button onclick="useFullPendingAmount(${log.id}, ${hotelId})" class="w-full bg-slate-200 text-slate-700 py-2 rounded-lg font-black text-xs">Use Full Pending Amount</button>
                ` : ''}
            </div>
        `;
    }).join('') : `<div class="text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">No payment entries available.</div>`;

    content.innerHTML = `
        <div class="bg-slate-950 text-white px-4 py-3.5 flex items-center justify-between">
            <h3 class="text-2xl md:text-3xl font-black">Repayment Details - ${escapeHTML(hotel.name)}</h3>
            <button onclick="closePaymentDetailsModal()" class="text-xl font-black text-slate-300 hover:text-white">x</button>
        </div>
        <div class="p-4 space-y-3.5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div class="rounded-xl border border-red-100 bg-red-50 p-3">
                    <p class="text-xs font-black uppercase text-red-500">Total Due</p>
                    <p class="text-2xl font-black text-red-700">Rs ${stats.totalDue.toLocaleString()}</p>
                </div>
                <div class="rounded-xl border border-green-100 bg-green-50 p-3">
                    <p class="text-xs font-black uppercase text-green-500">Total Paid</p>
                    <p class="text-2xl font-black text-green-700">Rs ${stats.totalPaid.toLocaleString()}</p>
                </div>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="setPaymentModalFilter('all', ${hotelId}, ${focusLogId ? Number(focusLogId) : 'null'})" class="px-3.5 py-2 rounded-lg text-sm font-black border ${contentFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}">All</button>
                <button onclick="setPaymentModalFilter('due', ${hotelId}, ${focusLogId ? Number(focusLogId) : 'null'})" class="px-3.5 py-2 rounded-lg text-sm font-black border ${contentFilter === 'due' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-200'}">Due Only</button>
                <button onclick="setPaymentModalFilter('settled', ${hotelId}, ${focusLogId ? Number(focusLogId) : 'null'})" class="px-3.5 py-2 rounded-lg text-sm font-black border ${contentFilter === 'settled' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-200'}">Settled</button>
            </div>
            <div class="space-y-3 max-h-[55vh] overflow-auto pr-1">${rowsHtml}</div>
        </div>
    `;

    modal.classList.remove('hidden');
    if (focusLogId) {
        setTimeout(() => {
            document.getElementById(`payment-log-${focusLogId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
    }
}



function renderHotelTable() {
    const tbody = document.getElementById('hotels-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filteredRows = getHotelDashboardRows(hotelTableFilterQuery);
    if (!filteredRows.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="p-6 text-center text-sm font-semibold text-slate-500">No matching records found.</td></tr>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    filteredRows.forEach((rowData, index) => {
        const displayRate = Number(rowData.lastSaleRate) || 0;
        const isLastSalePiece = rowData.lastSaleRateUnit === '/pc';

        const row = `
            <tr class="border-b hover:bg-slate-50 transition-colors text-sm">
                <td class="p-4 text-slate-500 font-medium">${index + 1}</td>
                <td class="p-4">
                    <div class="flex flex-col text-[11px]">
                        <span class="font-bold text-slate-700">${rowData.lastSaleDate}</span>
                        <span class="text-red-500 font-bold">${rowData.lastSaleTime}</span>
                    </div>
                </td>
                <td class="p-4 font-bold text-blue-600 cursor-pointer" onclick="openHotelLedger(${rowData.hotelId})">${rowData.hotelName}</td>
                <td class="p-4 text-slate-600">
                    <div class="font-semibold">${rowData.lastItem}</div>
                    <div class="text-[11px] font-bold text-slate-500">${rowData.stockText}</div>
                    <div class="text-[11px] font-black text-indigo-600 mt-0.5">${rowData.weightBreakdown}${rowData.otherBreakdown} kg</div>
                </td>
                <td class="p-4 text-center font-bold text-slate-500">${rowData.lastQty || '0'}</td>
                <td class="p-4 text-center">
                    <div class="font-bold text-slate-700">${rowData.totalWeightKg.toFixed(2)} kg</div>
                    <div class="text-[11px] font-semibold text-slate-500">${rowData.weightBreakdown}${rowData.otherBreakdown}</div>
                </td>
                <td class="p-4 font-bold text-slate-700">Rs ${displayRate.toLocaleString()} <span class="text-[11px] text-slate-400 font-semibold">${isLastSalePiece ? '/pc' : '/kg'}</span></td>
                <td class="p-4 font-bold text-slate-900">Rs ${Number(rowData.lastSaleTotal || 0).toLocaleString()}</td>
                <td class="p-4">
                    <div class="space-y-1">
                        ${getStatusBadgeHtml(rowData.ledgerSummary)}
                        <div class="text-[11px] font-black text-amber-600">Installments: ${rowData.paymentStats.paidEntries}/${rowData.paymentStats.totalEntries} paid</div>
                    </div>
                </td>
                <td class="p-4 text-slate-500 text-xs font-medium">${rowData.phoneText || '-'}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2 justify-center">
                        <button onclick="sendHotelWhatsApp(${rowData.hotelId})" class="text-green-600 p-2 hover:bg-green-50 rounded-lg"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
                        <button onclick="exportHotelTodayReportToExcel(${rowData.hotelId})" class="text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg"><i data-lucide="download" class="w-4 h-4"></i></button>
                        <button onclick="editHotel(${rowData.hotelId})" class="text-blue-600 p-2 hover:bg-blue-50 rounded-lg"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick="deleteHotel(${rowData.hotelId})" class="text-red-600 p-2 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    if (window.lucide) lucide.createIcons();
}


async function addInstallment(logId) {
    const raw = await appPrompt("Enter Installment Amount (Rs):", '', 'Add Installment');
    const amount = parseFloat(raw || '');
    if (!amount || isNaN(amount) || amount <= 0) return;
    recordInstallmentPayment(logId, amount, currentActiveHotelId || currentHotelId);
}

// function openCurrentHotelPaymentDetails() {
//     const hotelId = currentActiveHotelId || currentHotelId;
//     if (!hotelId) return appAlert('Open a hotel first.', 'warning');
//     openPaymentDetailsModal(hotelId);
// }
// Function to render Detailed Ledger inside a Hotel
function renderLedgerTable(hotelId) {
    const tbody = document.getElementById('ledger-table-body');
    const logs = transactionLogs.filter(l => l.hotelId === hotelId);
    tbody.innerHTML = '';

    logs.forEach((log, index) => {
        const totalAmt = log.weight * log.rate;
        // logic for installment display
        const installmentHtml = log.installments ? 
            log.installments.map(ins => `<div class="text-[10px] bg-slate-100 px-1 rounded">Rs ${ins.amt} (${ins.date})</div>`).join('' ) : 
            '<span class="text-slate-300 text-[10px]">No installments</span>';

        const row = `
            <tr>
                <td class="py-4 px-2 text-xs">${index + 1}</td>
                <td class="py-4 px-2 font-bold">${log.item}</td>
                <td class="py-4 px-2 text-right">${log.qty}</td>
                <td class="py-4 px-2 text-right">${log.weight} kg</td>
                <td class="py-4 px-2 text-right font-bold">Rs ${Number(log.rate || 0)} ${log.specialType ? '/pc' : '/kg'}</td>
                <td class="py-4 px-2 text-right font-bold">Rs ${totalAmt}</td>
                <td class="py-4 px-2 text-right text-green-600 font-bold">Rs ${log.paid}</td>
                <td class="py-4 px-2">
                    <div class="space-y-1">
                        ${installmentHtml}
                        <button onclick="addInstallmentPrompt(${log.id})" class="text-[9px] text-blue-600 font-bold">+ Add Pay</button>
                    </div>
                </td>
                <td class="py-4 px-2">
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold ${log.paid >= totalAmt ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${log.paid >= totalAmt ? 'PAID' : 'DUE'}
                    </span>
                </td>
                <td class="py-4 px-2">
                     <div class="flex justify-center gap-2">
                        <button onclick="sendWhatsAppLog(${log.id})" class="p-1.5 hover:bg-slate-100 rounded text-green-600"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
                        <button onclick="editLog(${log.id})" class="p-1.5 hover:bg-slate-100 rounded text-blue-600"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick="deleteLog(${log.id})" class="p-1.5 hover:bg-slate-100 rounded text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    lucide.createIcons();
}

function shareWA(log) {
    const hotelId = currentHotelId || currentActiveHotelId;
    const hotel = hotels.find(h => h.id === hotelId);
    const hotelName = hotel?.name || 'Hotel';

    const total = Number(log.total) || 0;
    const paid = Number(log.paid) || 0;
    const balance = Math.max(0, total - paid);
    const rateValue = Number(log.rate || 0);
    const rateUnit = log.specialType ? '/pc' : '/kg';

    const msg = `*Delivery - ${hotelName}*\n` +
        `*Date* : ${log.date || '-'}\n` +
        `*Item* : ${log.item}\n` +
        `*Rate* : Rs ${rateValue.toLocaleString()} ${rateUnit}\n` +
        `*Weight* : ${log.weight || 0}kg\n` +
        `*Total* : Rs ${total.toLocaleString()}\n` +
        `*Paid* : Rs ${paid.toLocaleString()}\n` +
        `*Balance* : Rs ${balance.toLocaleString()}\n\n` +
        `Thank you!`;

    sendWhatsApp(getHotelPhoneList(hotel), {
        message: msg,
        title: `${hotelName} - Send Ledger Message`
    });
}

function shareWAById(id) {
    const hotelId = currentHotelId || currentActiveHotelId;
    const log = salesData.find(l => Number(l.id) === Number(id) && Number(l.hotelId) === Number(hotelId));
    if (log) shareWA(log);
}

function sendWhatsAppLog(id) {
    shareWAById(id);
}

function editLog(id) {
    const hotelId = currentHotelId || currentActiveHotelId;
    const log = salesData.find(l => Number(l.id) === Number(id) && Number(l.hotelId) === Number(hotelId));
    if (!log) return;
    if (document.getElementById('log-form-container').classList.contains('hidden')) toggleLogForm();
    document.getElementById('edit-id').value = log.id;
    const dateField = document.getElementById('log-date');
    if (dateField) dateField.value = parseSalesDateToISO(log.date) || toLocalISODate(new Date());
    const guessedCategory = inferCategoryByItem(log.item);
    const categoryField = document.getElementById('log-main-category');
    if (categoryField) {
        categoryField.value = guessedCategory;
        updateLedgerSubItems();
    }
    document.getElementById('log-item').value = log.item || '';
    document.getElementById('log-qty').value = log.qty || 0;
    document.getElementById('log-weight').value = log.weight;
    document.getElementById('log-rate').value = log.rate;
    document.getElementById('log-total').value = log.total || 0;
    document.getElementById('log-paid').value = log.paid;
    applySaleEntryMode('ledger');
    updateLedgerItemStockHint();
}

async function deleteLog(id) {
    if (await appConfirm('Delete this entry?', 'Delete Entry')) {
        salesData = salesData.filter(l => Number(l.id) !== Number(id));
        saveData();
        const hotelId = currentHotelId || currentActiveHotelId;
        if (hotelId) renderDetailedLedgerRows(hotelId);
        renderHotelTable();
        updateBusinessAnalytics();
        appAlert('Entry deleted.', 'success');
    }
}

async function addNewCategory() {
    const name = await appPrompt('Add new item (use prefix, e.g., "Chicken Liver", "Mutton Paya"):', '', 'Add Category');
    const cleaned = sanitizeText(name, 40);
    if (cleaned) {
        if (ITEM_CATEGORIES.some(c => c.toLowerCase() === cleaned.toLowerCase())) return;
        ITEM_CATEGORIES.push(cleaned);
        localStorage.setItem('meat_categories', JSON.stringify(ITEM_CATEGORIES));
        refreshItemDropdown();
        handlePurchaseTypeChange();
        appAlert('Category added.', 'success');
    }
}

async function removeCategory() {
    const name = await appPrompt('Type the name of the Meat Category to remove:', '', 'Remove Category');
    const cleaned = sanitizeText(name, 40).toLowerCase();
    if (cleaned && ITEM_CATEGORIES.some(c => c.toLowerCase() === cleaned)) {
        ITEM_CATEGORIES = ITEM_CATEGORIES.filter(c => c.toLowerCase() !== cleaned);
        localStorage.setItem('meat_categories', JSON.stringify(ITEM_CATEGORIES));
        refreshItemDropdown();
        handlePurchaseTypeChange();
        appAlert('Category removed.', 'success');
    }
}

function manageItems() { addNewCategory(); }
function removeItem() { removeCategory(); }

function refreshItemDropdown() {
    const pTypeSelect = document.getElementById('p-type');
    const logItemSelect = document.getElementById('log-item');

    if (pTypeSelect) {
        const businessOptions = [...ITEM_CATEGORIES, 'Salary', 'Miscellaneous'];
        pTypeSelect.innerHTML = businessOptions.map(c => {
            const safe = escapeHTML(c);
            return `<option value="${safe}">${safe}</option>`;
        }).join('');
    }

    if (logItemSelect) updateLedgerSubItems();
    applySaleEntryMode('hotel');
    applySaleEntryMode('ledger');
    updateLedgerItemStockHint();
}

// Auto-Calculate Total in the Dashboard
function calculateHotelSaleTotal() {
    const qty = parseFloat(document.getElementById('h-qty')?.value) || 0;
    const weight = parseFloat(document.getElementById('h-weight')?.value) || 0;
    const rate = parseFloat(document.getElementById('h-rate')?.value) || 0;
    const item = document.getElementById('h-item')?.value || '';
    const isPieceBilling = Boolean(getSpecialItemType(item));
    const total = isPieceBilling ? (qty * rate) : (weight * rate);
    document.getElementById('h-total').value = total.toFixed(2);
}

function calculateLogTotal() {
    const qty = parseFloat(document.getElementById('log-qty')?.value) || 0;
    const weight = parseFloat(document.getElementById('log-weight')?.value) || 0;
    const rate = parseFloat(document.getElementById('log-rate')?.value) || 0;
    const item = document.getElementById('log-item')?.value || '';
    const isPieceBilling = Boolean(getSpecialItemType(item));
    const total = isPieceBilling ? (qty * rate) : (weight * rate);
    const totalEl = document.getElementById('log-total');
    if (totalEl) totalEl.value = total.toFixed(2);
}

// 1. Function to show/hide the row

function toggleInstallmentRow(rowId) {
    const target = document.getElementById(rowId);
    const isHidden = target.classList.contains('hidden');
    
    // Close all other dashboard rows
    document.querySelectorAll('[id^="details-"]').forEach(r => r.classList.add('hidden'));

    if (isHidden) target.classList.remove('hidden');
}

function saveInstallmentPayment(logId, hotelId) {
    const input = document.getElementById(`input-amt-${logId}`);
    const amount = parseFloat(input.value);

    if (!amount || amount <= 0) return appAlert("Please enter a valid amount");
    if (!recordInstallmentPayment(logId, amount, hotelId)) return appAlert("Payment failed");
    
    appAlert("Payment Added Successfully!");
}

function saveHotelAndSale() {
    // 1. Get Values
    const nameInput = document.getElementById('h-name');
    const phoneInput = document.getElementById('h-phone');
    const name = sanitizeText(nameInput?.value, 80);
    const item = sanitizeText(document.getElementById('h-item')?.value, 60);
    const qty = parseFloat(document.getElementById('h-qty')?.value) || 0;
    const weight = parseFloat(document.getElementById('h-weight')?.value) || 0;
    const rate = parseFloat(document.getElementById('h-rate')?.value) || 0;
    const totalFromUI = parseFloat(document.getElementById('h-total')?.value) || 0;
    const rawPaid = parseFloat(document.getElementById('h-paid')?.value) || 0;
    const paid = toNonNegative(rawPaid);
    const specialType = getSpecialItemType(item);
    const phoneCheck = validateIndianPhoneList(phoneInput?.value || '', false);
    markInvalidField(phoneInput, !phoneCheck.ok);

    // 2. Validation based on selected item billing mode
    if (!name || !item || !rate) return appAlert("Please fill Hotel Name, Item, and Rate.");
    if (rawPaid < 0) return appAlert('Paid amount cannot be negative.');
    if (!phoneCheck.ok) return appAlert(phoneCheck.message);
    if (specialType && qty <= 0) return appAlert("For heads/legs items, Qty is required.");
    if (!specialType && weight <= 0) return appAlert("For meat/liver items, Weight is required.");
    const stockError = validateSaleAgainstStock({ item, qty, weight });
    if (stockError) return appAlert(stockError);

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // 3. Create New Hotel
    const hotelId = Date.now();
    hotels.push({
        id: hotelId,
        name: name,
        phone: phoneCheck.normalizedList?.[0] || '',
        phones: phoneCheck.normalizedList || []
    });

    // 4. Create First Sale Entry
    const isPieceBilling = Boolean(specialType);
    const effectiveWeight = isPieceBilling ? 0 : weight;
    const lineTotal = isPieceBilling ? (qty * rate) : (totalFromUI || (effectiveWeight * rate));
    salesData.push({
        id: hotelId + 1,
        hotelId: hotelId,
        source: name, 
        item: item,
        qty: String(qty || 0),
        weight: effectiveWeight,
        rate: rate,
        total: lineTotal,
        paid: paid,
        date: now.toLocaleDateString('en-IN'),
        time: timeString,
        specialType: specialType || '',
        installments: paid > 0 ? [{
            date: now.toLocaleDateString('en-IN'),
            time: timeString,
            amt: paid
        }] : []
    });

    // 5. Save and Refresh UI
    saveData();
    renderHotelTable(); 
    
    // 6. Clear Form and Hide
    setAddHotelSaveMode(null);
    resetAddHotelForm();
    closeAddHotelDashboard();
    appAlert("Hotel and Entry Saved Successfully!");
}

function getStockBucket(text) {
    const value = String(text || '').toLowerCase().trim();
    const hasPrefix = (prefix) => value === prefix || value.startsWith(prefix + ' ') || value.startsWith(prefix + '-');
    const inferFromItemCatalog = () => {
        const db = itemDatabase || {};
        const hasItem = (arr) => Array.isArray(arr) && arr.some(i => String(i || '').toLowerCase() === value);
        if (hasItem(db.Mutton)) return 'animals';
        if (hasItem(db.Chicken)) return 'hens';
        if (hasItem(db.Fish)) return 'fish';
        return null;
    };

    if (isChickenLiverItem(value)) return 'chickenLiver';
    // Prefix mapping requested by user:
    // "chicken ..." -> chicken stock, "mutton ..." -> mutton stock, "fish ..." -> fish stock
    if (hasPrefix('chicken') || hasPrefix('hen')) return 'hens';
    if (hasPrefix('mutton') || hasPrefix('goat') || hasPrefix('lamb')) return 'animals';
    if (hasPrefix('fish')) return 'fish';
    const fromCatalog = inferFromItemCatalog();
    if (fromCatalog) return fromCatalog;
    if (value.includes('fish')) return 'fish';
    if (value.includes('mutton') || value.includes('goat') || value.includes('lamb')) return 'animals';
    if (value.includes('chicken') || value.includes('hen')) return 'hens';
    return null;
}

function getStockBucketLabel(bucket) {
    if (bucket === 'hens') return 'Chicken';
    if (bucket === 'animals') return 'Mutton';
    if (bucket === 'fish') return 'Fish';
    if (bucket === 'chickenLiver') return 'Chicken Liver';
    return 'Category';
}

function getCurrentAvailableStock() {
    const availableStock = { animals: 0, hens: 0, fish: 0, chickenLiver: 0 };
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];

    purchases.forEach(p => {
        if (getSpecialItemType(p.type)) return;
        const bucket = getStockBucket(p.type);
        if (bucket) availableStock[bucket] += (parseFloat(p.weight) || 0);
    });

    // Deduct sold stock from all hotel ledger entries (by item + sold weight)
    salesData.forEach(log => {
        const bucket = getStockBucket(log.item);
        if (!bucket) return;
        if (getSpecialItemType(log.item)) return; // piece items do not consume weight pools
        availableStock[bucket] -= (parseFloat(log.weight) || 0);
    });

    availableStock.animals = Math.max(0, availableStock.animals);
    availableStock.hens = Math.max(0, availableStock.hens);
    availableStock.fish = Math.max(0, availableStock.fish);
    availableStock.chickenLiver = Math.max(0, availableStock.chickenLiver);

    return availableStock;
}

function isChickenLegItem(text) {
    const value = String(text || '').toLowerCase();
    return (value.startsWith('chicken ') || value === 'chicken' || value.startsWith('hen ') || value === 'hen')
        && value.includes('leg');
}

function isMuttonLegItem(text) {
    const value = String(text || '').toLowerCase();
    const isMuttonPrefix = value.startsWith('mutton ') || value === 'mutton' || value.startsWith('goat ') || value === 'goat' || value.startsWith('lamb ') || value === 'lamb';
    return isMuttonPrefix && value.includes('leg');
}

function isMuttonHeadItem(text) {
    const value = String(text || '').toLowerCase();
    const isMuttonPrefix = value.startsWith('mutton ') || value === 'mutton' || value.startsWith('goat ') || value === 'goat' || value.startsWith('lamb ') || value === 'lamb';
    return isMuttonPrefix && value.includes('head');
}

function isChickenLiverItem(text) {
    const value = String(text || '').toLowerCase().trim();
    const hasChickenContext = value.includes('chicken') || value.includes('hen');
    return hasChickenContext && value.includes('liver');
}

function getSpecialItemType(text) {
    if (isChickenLegItem(text)) return 'chicken_legs';
    if (isMuttonLegItem(text)) return 'mutton_legs';
    if (isMuttonHeadItem(text)) return 'mutton_head';
    return null;
}

function getUnitsPerAnimal(item, bucket) {
    if (bucket === 'hens' && isChickenLegItem(item)) return VENDOR_INVENTORY_RULES.chickenLegsPerBird;
    if (bucket === 'animals' && isMuttonLegItem(item)) return VENDOR_INVENTORY_RULES.muttonLegsPerAnimal;
    if (bucket === 'animals' && isMuttonHeadItem(item)) return VENDOR_INVENTORY_RULES.muttonHeadsPerAnimal;
    return 1;
}

function getCurrentAvailableCountStock() {
    const available = { animals: 0, hens: 0, fish: 0 };
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];

    purchases.forEach(p => {
        if (getSpecialItemType(p.type)) return;
        const bucket = getStockBucket(p.type);
        if (!bucket) return;
        if (!['animals', 'hens', 'fish'].includes(bucket)) return;
        const qty = parseFloat(p.qty);
        if (Number.isFinite(qty) && qty > 0) {
            available[bucket] += qty;
        }
    });

    salesData.forEach(log => {
        const bucket = getStockBucket(log.item);
        if (!bucket) return;
        if (!['animals', 'hens', 'fish'].includes(bucket)) return;

        const specialType = getSpecialItemType(log.item);
        if (!specialType) return;

        const soldQty = parseFloat(log.qty);
        const unitsPerAnimal = getUnitsPerAnimal(log.item, bucket);
        if (Number.isFinite(soldQty) && soldQty > 0) {
            available[bucket] -= soldQty / (unitsPerAnimal || 1);
        }
    });

    available.animals = Math.max(0, available.animals);
    available.hens = Math.max(0, available.hens);
    available.fish = Math.max(0, available.fish);

    return available;
}

function getPurchasedBaseCountStock() {
    const available = { animals: 0, hens: 0, fish: 0 };
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];

    purchases.forEach(p => {
        const bucket = getStockBucket(p.type);
        if (!bucket) return;
        if (!['animals', 'hens', 'fish'].includes(bucket)) return;
        const qty = parseFloat(p.qty);
        if (Number.isFinite(qty) && qty > 0) {
            available[bucket] += qty;
        }
    });
    return available;
}

function getSpecialItemAvailability(excludeLogId = null) {
    const baseCountStock = getCurrentAvailableCountStock();
    let hensCount = baseCountStock.hens || 0;
    let animalsCount = baseCountStock.animals || 0;
    let purchasedChickenLegs = 0;
    let purchasedMuttonLegs = 0;
    let purchasedMuttonHeads = 0;

    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    purchases.forEach(p => {
        const type = String(p.type || '').toLowerCase().trim();
        const qty = parseFloat(p.qty) || 0;
        if (!qty || qty <= 0) return;
        if (type === 'chicken legs') purchasedChickenLegs += qty;
        if (type === 'mutton legs') purchasedMuttonLegs += qty;
        if (type === 'mutton head') purchasedMuttonHeads += qty;
    });

    if (excludeLogId) {
        const excludedLog = salesData.find(l => Number(l.id) === Number(excludeLogId));
        if (excludedLog) {
            const bucket = getStockBucket(excludedLog.item);
            const soldQty = parseFloat(excludedLog.qty) || 0;
            if (bucket && soldQty > 0) {
                const unitsPerAnimal = getUnitsPerAnimal(excludedLog.item, bucket);
                if (bucket === 'hens') hensCount += soldQty / (unitsPerAnimal || 1);
                if (bucket === 'animals') animalsCount += soldQty / (unitsPerAnimal || 1);
            }
        }
    }

    let soldChickenLegs = 0;
    let soldMuttonLegs = 0;
    let soldMuttonHeads = 0;

    salesData.forEach(log => {
        if (excludeLogId && Number(log.id) === Number(excludeLogId)) return;
        const savedType = sanitizeText(log.specialType, 30);
        const soldQty = parseFloat(log.qty) || 0;

        if (!['chicken_legs', 'mutton_legs', 'mutton_head'].includes(savedType)) return;
        if (savedType === 'chicken_legs') soldChickenLegs += soldQty;
        if (savedType === 'mutton_legs') soldMuttonLegs += soldQty;
        if (savedType === 'mutton_head') soldMuttonHeads += soldQty;
    });

    const derivedChickenLegs = hensCount * VENDOR_INVENTORY_RULES.chickenLegsPerBird;
    const derivedMuttonLegs = animalsCount * VENDOR_INVENTORY_RULES.muttonLegsPerAnimal;
    const derivedMuttonHeads = animalsCount * VENDOR_INVENTORY_RULES.muttonHeadsPerAnimal;
    const chickenLegs = Math.max(0, derivedChickenLegs + purchasedChickenLegs - soldChickenLegs);
    const muttonLegs = Math.max(0, derivedMuttonLegs + purchasedMuttonLegs - soldMuttonLegs);
    const muttonHeads = Math.max(0, derivedMuttonHeads + purchasedMuttonHeads - soldMuttonHeads);

    return {
        hensCount,
        animalsCount,
        chickenLegs,
        muttonLegs,
        muttonHeads
    };
}

function updateLedgerItemStockHint() {
    const hint = document.getElementById('log-stock-availability');
    const logItem = document.getElementById('log-item');
    if (!hint || !logItem) return;

    const bucket = getStockBucket(logItem.value);
    if (!bucket) {
        hint.textContent = 'Stock Available: -';
        hint.className = 'text-[11px] font-bold text-red-600 px-1';
        return;
    }

    const stock = getCurrentAvailableStock();
    const available = stock[bucket] || 0;
    const bucketLabel = getStockBucketLabel(bucket);
    const selectedItem = logItem.value || '';
    const special = getSpecialItemAvailability();

    if (isChickenLegItem(selectedItem)) {
        hint.textContent = `Stock Available (Chicken Legs): ${Math.floor(special.chickenLegs)} legs (${special.hensCount} hens)`;
        hint.className = `text-[11px] font-bold px-1 ${special.chickenLegs > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }

    if (isChickenLiverItem(selectedItem)) {
        hint.textContent = `Stock Available (Chicken Liver): ${available.toFixed(2)} kg`;
        hint.className = `text-[11px] font-bold px-1 ${available > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }

    if (isMuttonLegItem(selectedItem)) {
        hint.textContent = `Stock Available (Mutton Legs): ${Math.floor(special.muttonLegs)} legs (${special.animalsCount} animals)`;
        hint.className = `text-[11px] font-bold px-1 ${special.muttonLegs > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }

    if (isMuttonHeadItem(selectedItem)) {
        hint.textContent = `Stock Available (Mutton Head): ${Math.floor(special.muttonHeads)} heads`;
        hint.className = `text-[11px] font-bold px-1 ${special.muttonHeads > 0 ? 'text-green-600' : 'text-red-600'}`;
        return;
    }

    hint.textContent = `Stock Available (${bucketLabel}): ${available.toFixed(2)} kg`;
    hint.className = `text-[11px] font-bold px-1 ${available > 0 ? 'text-green-600' : 'text-red-600'}`;
}

function toLocalISODate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseSalesDateToISO(rawDate) {
    const value = String(rawDate || '').trim();
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const normalized = value.replace(/[.]/g, '/').replace(/-/g, '/');
    const parts = normalized.split('/');
    if (parts.length === 3) {
        const p1 = parseInt(parts[0], 10);
        const p2 = parseInt(parts[1], 10);
        const p3 = parseInt(parts[2], 10);
        if ([p1, p2, p3].every(n => Number.isFinite(n))) {
            let day = 0;
            let month = 0;
            let year = 0;
            if (parts[0].length === 4) {
                year = p1;
                month = p2;
                day = p3;
            } else {
                day = p1;
                month = p2;
                year = p3 < 100 ? 2000 + p3 : p3;
            }
            if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toLocalISODate(parsed);
    return '';
}

function getRangeFromFilter(filterType) {
    const today = new Date();
    const todayISO = toLocalISODate(today);
    const y = new Date(today);
    y.setDate(today.getDate() - 1);
    const yesterdayISO = toLocalISODate(y);

    if (filterType === 'today') return { from: todayISO, to: todayISO, label: 'Today' };
    if (filterType === 'yesterday') return { from: yesterdayISO, to: yesterdayISO, label: 'Yesterday' };
    if (filterType === 'last7') {
        const start = new Date(today);
        start.setDate(today.getDate() - 6);
        return { from: toLocalISODate(start), to: todayISO, label: 'Last 7 Days' };
    }
    if (filterType === 'thisMonth') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: toLocalISODate(start), to: todayISO, label: 'This Month' };
    }

    const customFrom = document.getElementById('sales-date-from')?.value || '';
    const customTo = document.getElementById('sales-date-to')?.value || '';
    if (!customFrom || !customTo || customFrom > customTo) return null;
    return { from: customFrom, to: customTo, label: `Custom (${customFrom} to ${customTo})` };
}

function getSalesAggregateByRange(fromISO, toISO) {
    let totalSales = 0;
    let totalPaid = 0;
    let totalStockKg = 0;
    let totalEntries = 0;

    salesData.forEach(entry => {
        const isoDate = parseSalesDateToISO(entry.date);
        if (!isoDate) return;
        if (isoDate < fromISO || isoDate > toISO) return;
        const billed = Number(entry.total) || 0;
        const paid = Number(entry.paid) || 0;
        totalSales += billed;
        totalPaid += paid;
        totalStockKg += Number(entry.weight) || 0;
        totalEntries += 1;
    });

    return {
        totalSales,
        totalPaid,
        totalDue: Math.max(0, totalSales - totalPaid),
        totalStockKg,
        totalEntries
    };
}

function getPurchasedStockByRange(fromISO, toISO) {
    let totalPurchasedKg = 0;
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    purchases.forEach(entry => {
        const bucket = getStockBucket(entry.type);
        if (!bucket) return;
        const isoDate = parseSalesDateToISO(entry.date);
        if (!isoDate) return;
        if (isoDate < fromISO || isoDate > toISO) return;
        totalPurchasedKg += Number(entry.weight) || 0;
    });
    return totalPurchasedKg;
}

function getPurchasedStockUpTo(toISO) {
    return getPurchasedStockByRange('1900-01-01', toISO);
}

function getSoldStockUpTo(toISO) {
    return getSalesAggregateByRange('1900-01-01', toISO).totalStockKg;
}

function handleSalesFilterChange() {
    const filterType = document.getElementById('sales-filter-type')?.value || 'today';
    const customRange = document.getElementById('sales-custom-range');
    if (customRange) customRange.classList.toggle('hidden', filterType !== 'custom');
    applySalesTrackingFilter();
}

function applySalesTrackingFilter() {
    const filterType = document.getElementById('sales-filter-type')?.value || 'today';
    if (filterType === 'custom') {
        const from = document.getElementById('sales-date-from')?.value || '';
        const to = document.getElementById('sales-date-to')?.value || '';
        if (!from || !to) return appAlert('Please choose both From and To dates.');
        if (from > to) return appAlert('Custom range is invalid: From date must be before To date.');
    }
    updateSalesTrackingStats();
}

function resetSalesTrackingFilter() {
    const typeEl = document.getElementById('sales-filter-type');
    const fromEl = document.getElementById('sales-date-from');
    const toEl = document.getElementById('sales-date-to');
    if (typeEl) typeEl.value = 'today';
    if (fromEl) fromEl.value = toLocalISODate(new Date());
    if (toEl) toEl.value = toLocalISODate(new Date());
    handleSalesFilterChange();
}

function getSalesRowsByRange(fromISO, toISO) {
    return salesData
        .map(entry => ({ entry, isoDate: parseSalesDateToISO(entry.date) }))
        .filter(item => item.isoDate && item.isoDate >= fromISO && item.isoDate <= toISO)
        .sort((a, b) => {
            if (a.isoDate === b.isoDate) return String(a.entry.time || '').localeCompare(String(b.entry.time || ''));
            return a.isoDate.localeCompare(b.isoDate);
        })
        .map(item => item.entry);
}

function exportSalesTrackingToExcel() {
    const today = new Date();
    const todayISO = toLocalISODate(today);
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayISO = toLocalISODate(yesterdayDate);

    const filterType = document.getElementById('sales-filter-type')?.value || 'today';
    const range = getRangeFromFilter(filterType) || { from: todayISO, to: todayISO, label: 'Today' };

    const yesterdayAgg = getSalesAggregateByRange(yesterdayISO, yesterdayISO);
    const todayAgg = getSalesAggregateByRange(todayISO, todayISO);
    const rangeAgg = getSalesAggregateByRange(range.from, range.to);

    const yesterdayPurchased = getPurchasedStockByRange(yesterdayISO, yesterdayISO);
    const todayPurchased = getPurchasedStockByRange(todayISO, todayISO);
    const rangePurchased = getPurchasedStockByRange(range.from, range.to);

    const yesterdayClosingLeft = Math.max(0, getPurchasedStockUpTo(yesterdayISO) - getSoldStockUpTo(yesterdayISO));
    const todayOpeningAvailable = yesterdayClosingLeft + todayPurchased;
    const rangeNetMovement = rangePurchased - rangeAgg.totalStockKg;
    const collectionEfficiency = rangeAgg.totalSales > 0 ? (rangeAgg.totalPaid / rangeAgg.totalSales) * 100 : 0;
    const avgRealization = rangeAgg.totalStockKg > 0 ? (rangeAgg.totalSales / rangeAgg.totalStockKg) : 0;

    let alertText = 'Healthy cycle: stock and collections are balanced.';
    if (rangeAgg.totalEntries === 0) alertText = 'No sales in selected range. Check filter or add today sales.';
    else if (collectionEfficiency < 70) alertText = `Low collection (${collectionEfficiency.toFixed(1)}%). Follow up pending payments.`;
    else if (rangeNetMovement < 0) alertText = `Stock depletion ${Math.abs(rangeNetMovement).toFixed(2)} kg in range. Refill needed.`;
    else if (todayOpeningAvailable < 10) alertText = 'Low available stock for today. Add stock to avoid shortages.';

    const rows = [
<<<<<<< HEAD
        ['Filter', 'Filtered Range', `${range.label} (${range.from} to ${range.to})`],
=======
        ['Filter', 'Selected Days', `${range.label} (${range.from} to ${range.to})`],
>>>>>>> c4c06e1e678780345f4e605aa178b5330383cc09
        ['Filter', 'Bills Count', Number(rangeAgg.totalEntries || 0)],
        ['KPI', 'Stock Left / Used', `${rangeNetMovement >= 0 ? '+' : ''}${rangeNetMovement.toFixed(2)} kg`],
        ['KPI', 'Money Collected %', `${collectionEfficiency.toFixed(1)}%`],
        ['KPI', 'Average Rate / Kg', `Rs ${Math.round(avgRealization).toLocaleString()} / kg`],
        ['KPI', 'What To Do Now', alertText],
        ['Yesterday', 'Money', `Rs ${yesterdayAgg.totalSales.toLocaleString()}`],
        ['Yesterday', 'Kg Sold', `${yesterdayAgg.totalStockKg.toFixed(2)} kg`],
        ['Yesterday', 'Kg Bought', `${yesterdayPurchased.toFixed(2)} kg`],
<<<<<<< HEAD
        ['Yesterday', 'Left', `${yesterdayClosingLeft.toFixed(2)} kg`],
        ['Today', 'Money', `Rs ${todayAgg.totalSales.toLocaleString()}`],
        ['Today', 'Kg Sold', `${todayAgg.totalStockKg.toFixed(2)} kg`],
        ['Today', 'Kg Bought', `${todayPurchased.toFixed(2)} kg`],
        ['Filtered', 'Total Money', `Rs ${rangeAgg.totalSales.toLocaleString()}`],
        ['Filtered', 'Total Kg Sold', `${rangeAgg.totalStockKg.toFixed(2)} kg`],
=======
        ['Yesterday', 'Stock Left', `${yesterdayClosingLeft.toFixed(2)} kg`],
        ['Today', 'Money', `Rs ${todayAgg.totalSales.toLocaleString()}`],
        ['Today', 'Kg Sold', `${todayAgg.totalStockKg.toFixed(2)} kg`],
        ['Today', 'Kg Bought', `${todayPurchased.toFixed(2)} kg`],
        ['Selected Days', 'Money', `Rs ${rangeAgg.totalSales.toLocaleString()}`],
        ['Selected Days', 'Kg Sold', `${rangeAgg.totalStockKg.toFixed(2)} kg`],
>>>>>>> c4c06e1e678780345f4e605aa178b5330383cc09
        ['Today', 'Available (Yday Left + Today Bought)', `${todayOpeningAvailable.toFixed(2)} kg`]
    ];

    downloadCSV(
        `sales_tracking_cards_${range.from}_to_${range.to}.csv`,
        ['Section', 'Metric', 'Value'],
        rows
    );
}

function updateSalesTrackingStats() {
    const yesterdayCard = document.getElementById('sales-stat-yesterday-sales');
    if (!yesterdayCard) return;

    const today = new Date();
    const todayISO = toLocalISODate(today);
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayISO = toLocalISODate(yesterdayDate);

    const yesterdayAgg = getSalesAggregateByRange(yesterdayISO, yesterdayISO);
    const todayAgg = getSalesAggregateByRange(todayISO, todayISO);
    const yesterdayPurchased = getPurchasedStockByRange(yesterdayISO, yesterdayISO);
    const todayPurchased = getPurchasedStockByRange(todayISO, todayISO);
    const yesterdayClosingLeft = Math.max(0, getPurchasedStockUpTo(yesterdayISO) - getSoldStockUpTo(yesterdayISO));
    const todayOpeningAvailable = yesterdayClosingLeft + todayPurchased;

    const filterType = document.getElementById('sales-filter-type')?.value || 'today';
    const range = getRangeFromFilter(filterType) || { from: todayISO, to: todayISO, label: 'Today' };
    const rangeAgg = getSalesAggregateByRange(range.from, range.to);
    const rangePurchased = getPurchasedStockByRange(range.from, range.to);
    const rangeNetMovement = rangePurchased - rangeAgg.totalStockKg;
    const collectionEfficiency = rangeAgg.totalSales > 0 ? (rangeAgg.totalPaid / rangeAgg.totalSales) * 100 : 0;
    const avgRealization = rangeAgg.totalStockKg > 0 ? (rangeAgg.totalSales / rangeAgg.totalStockKg) : 0;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('sales-stat-yesterday-sales', `Rs ${yesterdayAgg.totalSales.toLocaleString()}`);
    setText('sales-stat-yesterday-stock', `${yesterdayAgg.totalStockKg.toFixed(2)} kg`);
    setText('sales-stat-yesterday-added', `${yesterdayPurchased.toFixed(2)} kg`);
    setText('sales-stat-yesterday-left', `${yesterdayClosingLeft.toFixed(2)} kg`);
    setText('sales-stat-today-sales', `Rs ${todayAgg.totalSales.toLocaleString()}`);
    setText('sales-stat-today-stock', `${todayAgg.totalStockKg.toFixed(2)} kg`);
    setText('sales-stat-today-added', `${todayPurchased.toFixed(2)} kg`);
    setText('sales-stat-today-opening', `${todayOpeningAvailable.toFixed(2)} kg`);
    setText('sales-stat-range-sales', `Rs ${rangeAgg.totalSales.toLocaleString()}`);
    setText('sales-stat-range-stock', `${rangeAgg.totalStockKg.toFixed(2)} kg`);
<<<<<<< HEAD
    setText('sales-range-label', `Filtered Days: ${range.label} (${range.from} to ${range.to}) | Bills: ${rangeAgg.totalEntries}`);
=======
    setText('sales-range-label', `Selected Days: ${range.label} (${range.from} to ${range.to}) | Bills: ${rangeAgg.totalEntries}`);
>>>>>>> c4c06e1e678780345f4e605aa178b5330383cc09

    const netMovementEl = document.getElementById('sales-kpi-net-movement');
    if (netMovementEl) {
        netMovementEl.textContent = `${rangeNetMovement >= 0 ? '+' : ''}${rangeNetMovement.toFixed(2)} kg`;
        netMovementEl.className = `text-lg font-black ${rangeNetMovement >= 0 ? 'text-emerald-700' : 'text-red-700'}`;
    }

    const collectionEl = document.getElementById('sales-kpi-collection');
    if (collectionEl) {
        collectionEl.textContent = `${collectionEfficiency.toFixed(1)}%`;
        collectionEl.className = `text-lg font-black ${collectionEfficiency >= 85 ? 'text-emerald-700' : collectionEfficiency >= 70 ? 'text-amber-700' : 'text-red-700'}`;
    }

    const realizationEl = document.getElementById('sales-kpi-realization');
    if (realizationEl) {
        realizationEl.textContent = rangeAgg.totalStockKg > 0
            ? `Rs ${Math.round(avgRealization).toLocaleString()} / kg`
            : 'Rs 0 / kg';
        realizationEl.className = `text-lg font-black ${avgRealization > 0 ? 'text-slate-800' : 'text-slate-400'}`;
    }

    const alertEl = document.getElementById('sales-kpi-alert');
    if (alertEl) {
        let alertText = 'Healthy cycle: stock and collections are balanced.';
        if (rangeAgg.totalEntries === 0) alertText = 'No sales in selected range. Check filter or add today sales.';
        else if (collectionEfficiency < 70) alertText = `Low collection (${collectionEfficiency.toFixed(1)}%). Follow up pending payments.`;
        else if (rangeNetMovement < 0) alertText = `Stock depletion ${Math.abs(rangeNetMovement).toFixed(2)} kg in range. Refill needed.`;
        else if (todayOpeningAvailable < 10) alertText = 'Low available stock for today. Add stock to avoid shortages.';
        alertEl.textContent = alertText;
    }

    const lastUpdatedEl = document.getElementById('sales-last-updated');
    if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = `Updated: ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
}

function getTodayISODate() {
    return new Date().toISOString().split('T')[0];
}

function setPurchaseDateToToday(force = false) {
    const dateInput = document.getElementById('p-date');
    if (dateInput && (force || !dateInput.value)) dateInput.value = getTodayISODate();
}

function getSelectedMonthDays() {
    const dateInput = document.getElementById('p-date');
    const dateValue = dateInput?.value;
    const dt = dateValue ? new Date(dateValue + 'T00:00:00') : new Date();
    return new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
}

function updateSalaryLeaves() {
    const daysField = document.getElementById('p-days');
    const leavesField = document.getElementById('p-leaves');
    if (!daysField || !leavesField) return;

    const monthDays = getSelectedMonthDays();
    daysField.max = String(monthDays);

    let worked = parseInt(daysField.value || '0', 10);
    if (isNaN(worked)) worked = 0;
    worked = Math.max(0, Math.min(worked, monthDays));
    if (daysField.value !== '') daysField.value = String(worked);

    leavesField.value = String(Math.max(0, monthDays - worked));
    leavesField.readOnly = true;
}

function handlePurchaseTypeChange() {
    const type = document.getElementById('p-type')?.value || '';
    const stockFields = ['field-qty', 'field-weight', 'field-rate', 'field-total-cost', 'field-paid', 'field-pending'];
    const salaryFields = ['field-total-cost', 'field-emp-name', 'field-days', 'field-leaves', 'field-paid', 'field-pending'];
    const miscFields = ['field-total-cost', 'field-description', 'field-paid', 'field-pending'];

    stockFields.concat(salaryFields, miscFields).forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
    });

    if (type === 'Salary') {
        salaryFields.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        setTotalCostReadonly(false);
        setPurchaseDateToToday();
        updateSalaryLeaves();
        updateSalaryPending();
    } else if (type === 'Miscellaneous') {
        miscFields.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        setTotalCostReadonly(false);
        updateSalaryPending();
    } else {
        stockFields.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        setTotalCostReadonly(true);
        updateStockTotalCost();
        updateSalaryPending();
    }
}

function setTotalCostReadonly(isReadonly) {
    const totalCostField = document.getElementById('p-total-cost');
    if (!totalCostField) return;
    totalCostField.readOnly = isReadonly;
    totalCostField.classList.toggle('bg-slate-100', isReadonly);
}

function updateStockTotalCost() {
    const type = document.getElementById('p-type')?.value || '';
    if (type === 'Salary' || type === 'Miscellaneous') return;

    const weight = parseFloat(document.getElementById('p-weight')?.value) || 0;
    const rate = parseFloat(document.getElementById('p-rate')?.value) || 0;
    const totalField = document.getElementById('p-total-cost');
    if (!totalField) return;

    if (!weight || !rate) {
        totalField.value = '';
        updateSalaryPending();
        return;
    }
    totalField.value = (weight * rate).toFixed(2);
    updateSalaryPending();
}

function initPurchaseCostListeners() {
    ['p-weight', 'p-rate'].forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.totalBound === '1') return;
        el.addEventListener('input', updateStockTotalCost);
        el.dataset.totalBound = '1';
    });
}

function updateSalaryPending() {
    const totalCost = parseFloat(document.getElementById('p-total-cost')?.value) || 0;
    const paid = parseFloat(document.getElementById('p-paid')?.value) || 0;
    const purchaseForm = document.getElementById('purchase-form');
    const existingPaid = Number(purchaseForm?.getAttribute('data-existing-paid')) || 0;
    const pendingField = document.getElementById('p-pending');
    const totalPaid = existingPaid + paid;
    if (pendingField) pendingField.value = Math.max(0, totalCost - totalPaid);
}

function initSalaryFieldListeners() {
    ['p-total-cost', 'p-paid', 'p-days', 'p-date'].forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.dataset.bound === '1') return;
        if (id === 'p-days') el.addEventListener('input', updateSalaryLeaves);
        else if (id === 'p-date') el.addEventListener('change', updateSalaryLeaves);
        else el.addEventListener('input', updateSalaryPending);
        el.dataset.bound = '1';
    });
}

function savePurchase() {
    const type = document.getElementById('p-type').value;
    const date = document.getElementById('p-date').value;
    const editId = document.getElementById('purchase-form').getAttribute('data-edit-id');
    if (!type) return appAlert('Please select a category.');
    if (!date) return appAlert('Please select a valid date.');
    let paidInput = 0;

    let entry = {
        id: editId ? parseInt(editId) : Date.now(),
        date: date || new Date().toISOString().split('T')[0],
        time: editId
            ? (JSON.parse(localStorage.getItem('business_purchases')) || []).find(p => p.id == editId)?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type,
        qty: '0',
        weight: '0',
        rate: '0',
        total: 0,
        description: ''
    };

    if (type === 'Salary') {
        const totalCost = parseFloat(document.getElementById('p-total-cost').value) || 0;
        const paid = parseFloat(document.getElementById('p-paid').value) || 0;
        const monthDays = getSelectedMonthDays();
        const workedDays = Math.max(0, Math.min(parseInt(document.getElementById('p-days').value || '0', 10) || 0, monthDays));
        const leavesTaken = Math.max(0, monthDays - workedDays);
        const empName = (document.getElementById('p-emp-name').value || '').trim();

        if (!empName) return appAlert('Please enter Employee Name for salary.');
        if (totalCost <= 0) return appAlert('Please enter valid Total Cost (greater than 0).');
        if (paid < 0) return appAlert('Paid Amount cannot be negative.');
        if (workedDays <= 0) return appAlert('Days Worked must be greater than 0.');

        entry.employeeName = empName;
        entry.daysWorked = String(workedDays);
        entry.leavesTaken = String(leavesTaken);
        paidInput = paid;
        entry.total = totalCost;
    } else if (type === 'Miscellaneous') {
        const miscTotal = parseFloat(document.getElementById('p-total-cost').value) || 0;
        const paid = parseFloat(document.getElementById('p-paid').value) || 0;
        const description = sanitizeText(document.getElementById('p-description')?.value, 160);
        if (miscTotal <= 0) return appAlert('Please enter Miscellaneous total cost (greater than 0).');
        if (paid < 0) return appAlert('Paid Amount cannot be negative.');
        if (!description) return appAlert('Please enter description for miscellaneous expense.');
        entry.description = description;
        paidInput = paid;
        entry.total = miscTotal;
    } else {
        const qty = parseFloat(document.getElementById('p-qty').value);
        const weight = parseFloat(document.getElementById('p-weight').value);
        const rate = parseFloat(document.getElementById('p-rate').value);
        const paid = parseFloat(document.getElementById('p-paid').value) || 0;

        if (!Number.isFinite(qty) || qty <= 0) return appAlert('Qty (Count) must be greater than 0.');
        if (!Number.isFinite(weight) || weight <= 0) return appAlert('Weight (Kgs) must be greater than 0.');
        if (!Number.isFinite(rate) || rate <= 0) return appAlert('Price / Kg must be greater than 0.');

        entry.qty = String(qty);
        entry.weight = String(weight);
        entry.rate = String(rate);
        entry.total = parseFloat(document.getElementById('p-total-cost')?.value) || ((parseFloat(entry.weight) || 0) * (parseFloat(entry.rate) || 0));
        if (paid < 0) return appAlert('Paid Amount cannot be negative.');
        paidInput = paid;
    }

    let purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    if (editId) {
        const idx = purchases.findIndex(p => p.id == editId);
        if (idx >= 0) {
            const existingPaid = Number(purchases[idx]?.paid) || 0;
            entry.paid = existingPaid + paidInput;
            entry.pending = Math.max(0, entry.total - entry.paid);
            purchases[idx] = entry;
            const advance = Math.max(0, entry.paid - entry.total);
            if (advance > 0) {
                appAlert(`Advance recorded: Rs ${advance.toLocaleString()}`, 'success');
            }
        } else {
            entry.paid = paidInput;
            entry.pending = Math.max(0, entry.total - entry.paid);
        }
        document.getElementById('purchase-form').removeAttribute('data-edit-id');
        document.getElementById('purchase-form').removeAttribute('data-existing-paid');
        document.getElementById('btn-record-stock').textContent = 'Record Entry';
    } else {
        entry.paid = paidInput;
        entry.pending = Math.max(0, entry.total - entry.paid);
        const advance = Math.max(0, entry.paid - entry.total);
        if (advance > 0) {
            appAlert(`Advance recorded: Rs ${advance.toLocaleString()}`, 'success');
        }
        purchases.unshift(entry);
    }

    localStorage.setItem('business_purchases', JSON.stringify(purchases));
    renderPurchaseTable();
    updateBusinessAnalytics();
    resetPurchaseForm();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // Returns format: DD/MM/YYYY
    return date.toLocaleDateString('en-GB'); 
}

function renderPurchaseTable() {
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    const tbody = document.getElementById('purchase-table-body');
    if (!tbody) return;

    tbody.innerHTML = purchases.map(p => {
        const isSalary = p.type === 'Salary';
        const isMisc = p.type === 'Miscellaneous';
        const totalCost = Number(p.total) || 0;
        const paid = Number(p.paid) || 0;
        const due = Number.isFinite(Number(p.pending)) ? Math.max(0, Number(p.pending) || 0) : Math.max(0, totalCost - paid);
        const advance = Math.max(0, paid - totalCost);
        const qtyText = isSalary ? (p.employeeName || '-') : (isMisc ? '-' : (p.qty || '-'));
        const weightText = isSalary
            ? `Days: ${p.daysWorked || 0} | Leaves: ${p.leavesTaken || 0}`
            : (isMisc ? '-' : (p.weight ? p.weight + ' kg' : '-'));
        const rateText = isSalary
            ? `Paid: Rs ${paid} | ${advance > 0 ? `Adv: Rs ${advance}` : `Pending: Rs ${due}`}`
            : (isMisc ? '-' : (p.rate ? 'Rs ' + p.rate : '-'));
        const descriptionText = p.description ? p.description : '-';

        return `
            <tr class="border-b hover:bg-slate-50 text-xs">
                <td class="p-4">
                    <div class="font-bold text-slate-700">${escapeHTML(formatDate(p.date))}</div>
                    <div class="text-[10px] text-slate-400 font-medium">${escapeHTML(p.time || '')}</div>
                </td>
                <td class="p-4"><span class="bg-slate-900 text-white px-2 py-1 rounded text-[9px] font-bold uppercase flex items-center justify-center">${escapeHTML(p.type)}</span></td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(qtyText)}</td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(weightText)}</td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(rateText)}</td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(descriptionText)}</td>
                <td class="p-4 text-center font-black text-slate-900 text-sm">Rs ${totalCost.toLocaleString()}</td>
                <td class="p-4 text-center font-black text-green-700 text-sm">Rs ${paid.toLocaleString()}</td>
                <td class="p-4 text-center font-black text-sm ${advance > 0 ? 'text-amber-700' : 'text-red-700'}">
                    Rs ${(advance > 0 ? advance : due).toLocaleString()}
                    <div class="text-[10px] font-black uppercase ${advance > 0 ? 'text-amber-600' : 'text-red-500'}">${advance > 0 ? 'ADV' : 'DUE'}</div>
                </td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick='shareBusinessWAById(${p.id})' class="p-1.5 text-green-600"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
                        <button onclick='editPurchase(${p.id})' class="p-1.5 text-blue-600"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick='deletePurchase(${p.id})' class="p-1.5 text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateSalesTrackingStats();
}

// function shareBusinessWA(purchase) {
//     const totalCost = Number(purchase.total) || 0;
//     const paid = Number(purchase.paid) || 0;
//     const due = Number.isFinite(Number(purchase.pending)) ? Math.max(0, Number(purchase.pending) || 0) : Math.max(0, totalCost - paid);
//     const salaryInfo = purchase.type === 'Salary'
//         ? `\nEmployee: ${purchase.employeeName || '-'}\nDays Worked: ${purchase.daysWorked || 0}\nLeaves: ${purchase.leavesTaken || 0}`
//         : '';
//     const miscDescription = purchase.description ? `\nDescription: ${purchase.description}` : '';

//     const msg = `*Business Analytics Entry*\n\nDate: ${purchase.date}\nCategory: ${purchase.type}\nQuantity: ${purchase.qty || '-'}\nWeight: ${purchase.weight || '-'} kg\nRate: Rs ${purchase.rate || 0}\nTotal Cost: Rs ${totalCost}\nAmount Paid: Rs ${paid}\nDue: Rs ${due}${miscDescription}${salaryInfo}`;
//     window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
// }

function shareBusinessWA(purchase) {
    const formattedDate = purchase.date ? new Date(purchase.date).toLocaleDateString('en-GB') : '-';
    const totalCost = Number(purchase.total) || 0;
    const paid = Number(purchase.paid) || 0;
    const due = Math.max(0, totalCost - paid);

    // We remove extra spaces to ensure WhatsApp's markdown triggers correctly
    let msg = `*Business Analytics Entry*\n\n`;
    msg += `*Date*: ${formattedDate}\n`;
    msg += `*Category*: ${purchase.type}\n`;
    msg += `*Quantity*: ${purchase.qty || '-'}\n`;
    msg += `*Weight*: ${purchase.weight || '-'} kg\n`;
    msg += `*Rate*: ₹${purchase.rate || 0}\n`;
    msg += `*Total Cost*: ₹${totalCost}\n`;
    msg += `*Amount Paid*: ₹${paid}\n`;
    msg += `*Due*: ₹${due}\n\n`;
    
    if (purchase.description) msg += `*Note*: ${purchase.description}\n`;
    
    msg += `*Thank You!*`;

    // The encodeURIComponent is essential to keep the line breaks (\n) working
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function shareBusinessWAById(id) {
    const purchases = safeGetJSON('business_purchases', []);
    const purchase = (purchases || []).find(p => p.id === id);
    if (purchase) shareBusinessWA(purchase);
}

function renderLowStockAlerts(stock) {
    const panel = document.getElementById('stock-low-alerts');
    if (!panel) return;

    const special = getSpecialItemAvailability();
    const alerts = [];
    if ((stock.animals || 0) <= LOW_STOCK_THRESHOLDS.animalsKg) alerts.push({ label: 'Mutton', value: `${(stock.animals || 0).toFixed(2)} kg` });
    if ((stock.hens || 0) <= LOW_STOCK_THRESHOLDS.hensKg) alerts.push({ label: 'Chicken', value: `${(stock.hens || 0).toFixed(2)} kg` });
    if ((stock.fish || 0) <= LOW_STOCK_THRESHOLDS.fishKg) alerts.push({ label: 'Fish', value: `${(stock.fish || 0).toFixed(2)} kg` });
    if ((stock.chickenLiver || 0) <= LOW_STOCK_THRESHOLDS.chickenLiverKg) alerts.push({ label: 'Chicken Liver', value: `${(stock.chickenLiver || 0).toFixed(2)} kg` });
    if ((special.chickenLegs || 0) <= LOW_STOCK_THRESHOLDS.chickenLegs) alerts.push({ label: 'Chicken Legs', value: `${Math.floor(special.chickenLegs || 0)} pcs` });
    if ((special.muttonLegs || 0) <= LOW_STOCK_THRESHOLDS.muttonLegs) alerts.push({ label: 'Mutton Legs', value: `${Math.floor(special.muttonLegs || 0)} pcs` });
    if ((special.muttonHeads || 0) <= LOW_STOCK_THRESHOLDS.muttonHeads) alerts.push({ label: 'Mutton Heads', value: `${Math.floor(special.muttonHeads || 0)} pcs` });

    if (!alerts.length) {
        panel.innerHTML = '<div class="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">Stock levels look healthy.</div>';
        return;
    }

    panel.innerHTML = alerts.map(a => `
        <div class="stock-low-item">
            <span>${escapeHTML(a.label)}</span>
            <span class="chip">${escapeHTML(a.value)}</span>
        </div>
    `).join('');
}

function updateBusinessAnalytics() {
    let totalSales = 0;
    let clearedSales = 0;
    let marketDues = 0;
    let totalExpenses = 0;

    let availableStock = getCurrentAvailableStock();
    let opCosts = { salary: 0, miscellaneous: 0 };

    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    purchases.forEach(p => {
        const cost = parseFloat(p.total) || 0;
        totalExpenses += cost;
        const typeKey = (p.type || '').toLowerCase();

        if (typeKey === 'salary') opCosts.salary += cost;
        else if (typeKey === 'miscellaneous') opCosts.miscellaneous += cost;
    });

    salesData.forEach(log => {
        const billed = parseFloat(log.total) || 0;
        const paid = parseFloat(log.paid) || 0;
        const pending = Math.max(0, billed - paid);

        totalSales += billed;
        clearedSales += paid;
        if (pending > 0) marketDues += pending;
    });

    const animalsEl = document.getElementById('stat-total-animals');
    const hensEl = document.getElementById('stat-total-hens');
    const fishEl = document.getElementById('stat-total-fish');
    const liverEl = document.getElementById('stat-total-chicken-liver');
    const chickenLegsEl = document.getElementById('stat-total-chicken-legs');
    const muttonLegsEl = document.getElementById('stat-total-mutton-legs');
    const muttonHeadsEl = document.getElementById('stat-total-mutton-heads');
    const special = getSpecialItemAvailability();

    if (animalsEl) {
        animalsEl.textContent = availableStock.animals.toFixed(2) + ' kg';
        animalsEl.className = `font-bold ${availableStock.animals > 0 ? 'text-green-600' : 'text-red-500'}`;
    }
    if (hensEl) {
        hensEl.textContent = availableStock.hens.toFixed(2) + ' kg';
        hensEl.className = `font-bold ${availableStock.hens > 0 ? 'text-green-600' : 'text-red-500'}`;
    }
    if (fishEl) {
        fishEl.textContent = availableStock.fish.toFixed(2) + ' kg';
        fishEl.className = `font-bold ${availableStock.fish > 0 ? 'text-green-600' : 'text-red-500'}`;
    }
    if (liverEl) {
        liverEl.textContent = availableStock.chickenLiver.toFixed(2) + ' kg';
        liverEl.className = `font-bold ${availableStock.chickenLiver > 0 ? 'text-green-600' : 'text-red-500'}`;
    }
    if (chickenLegsEl) {
        chickenLegsEl.textContent = `${Math.floor(special.chickenLegs || 0)} pcs`;
        chickenLegsEl.className = `font-bold ${(special.chickenLegs || 0) > 0 ? 'text-green-600' : 'text-red-500'}`;
    }
    if (muttonLegsEl) {
        muttonLegsEl.textContent = `${Math.floor(special.muttonLegs || 0)} pcs`;
        muttonLegsEl.className = `font-bold ${(special.muttonLegs || 0) > 0 ? 'text-green-600' : 'text-red-500'}`;
    }
    if (muttonHeadsEl) {
        muttonHeadsEl.textContent = `${Math.floor(special.muttonHeads || 0)} pcs`;
        muttonHeadsEl.className = `font-bold ${(special.muttonHeads || 0) > 0 ? 'text-green-600' : 'text-red-500'}`;
    }
    renderLowStockAlerts(availableStock);

    if (document.getElementById('stat-total-salaries')) document.getElementById('stat-total-salaries').textContent = 'Rs ' + opCosts.salary.toLocaleString();
    if (document.getElementById('stat-total-misc')) document.getElementById('stat-total-misc').textContent = 'Rs ' + opCosts.miscellaneous.toLocaleString();

    // Dashboard sales card now reflects cleared (received) amount.
    document.getElementById('stat-total-sales').textContent = 'Rs ' + clearedSales.toLocaleString();
    document.getElementById('stat-total-expenses').textContent = 'Rs ' + totalExpenses.toLocaleString();
    document.getElementById('stat-total-pending').textContent = 'Rs ' + marketDues.toLocaleString();

    const netProfit = clearedSales - totalExpenses;
    const profitEl = document.getElementById('stat-net-profit');
    if (profitEl) {
        profitEl.textContent = (netProfit < 0 ? '- ' : '') + 'Rs ' + Math.abs(netProfit).toLocaleString();
        profitEl.className = netProfit < 0 ? 'text-3xl font-black text-white-500' : 'text-3xl font-black text-green-600';
    }
    updateLedgerItemStockHint();
}

function showBusinessView() {
    switchMainView('business-view');
    setTopNavActive('business');
    renderPurchaseTable();
    updateBusinessAnalytics();
}

function quickOpenAddStock() {
    showBusinessView();
    setTopNavActive('stock');
    const purchaseForm = document.getElementById('purchase-form');
    const stockCard = document.getElementById('stock-overview-card');
    resetPurchaseForm();
    if (purchaseForm?.classList.contains('hidden')) purchaseForm.classList.remove('hidden');

    // brief visual focus cue so users instantly locate stock entry + overview
    purchaseForm?.classList.add('stock-focus-active');
    stockCard?.classList.add('stock-overview-active');
    setTimeout(() => {
        purchaseForm?.classList.remove('stock-focus-active');
        stockCard?.classList.remove('stock-overview-active');
    }, 2200);

    purchaseForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
        document.getElementById('p-type')?.focus();
    }, 450);
}

function showSalesTrackingView() {
    switchMainView('sales-tracking-view');
    setTopNavActive('sales');
    updateSalesTrackingStats();
}

function inferCategoryByItem(itemName) {
    const name = String(itemName || '').toLowerCase();
    if (!name) return '';
    if (itemDatabase.Mutton?.some(i => String(i).toLowerCase() === name)) return 'Mutton';
    if (itemDatabase.Chicken?.some(i => String(i).toLowerCase() === name)) return 'Chicken';
    if (itemDatabase.Fish?.some(i => String(i).toLowerCase() === name)) return 'Fish';
    if (name.startsWith('mutton')) return 'Mutton';
    if (name.startsWith('chicken')) return 'Chicken';
    if (name.startsWith('fish')) return 'Fish';
    return '';
}

function toggleElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
}

function openPurchaseFormForNewRecord() {
    const form = document.getElementById('purchase-form');
    if (!form) return;
    resetPurchaseForm();
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('p-type')?.focus(), 250);
}

function saveData() {
    localStorage.setItem('meatWholesale_hotels', JSON.stringify(hotels));
    localStorage.setItem('meatWholesale_sales', JSON.stringify(salesData));
    localStorage.setItem('meatWholesale_inventory', JSON.stringify(inventoryData));
}

async function deletePurchase(id) {
    if (await appConfirm('Delete this business record?', 'Delete Record')) {
        let purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
        purchases = purchases.filter(p => p.id !== id);
        localStorage.setItem('business_purchases', JSON.stringify(purchases));
        renderPurchaseTable();
        updateBusinessAnalytics();
        appAlert('Business record deleted.', 'success');
    }
}

function editPurchase(id) {
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    const p = purchases.find(item => item.id === id);
    if (!p) return;
    const existingPaid = Number(p.paid) || 0;
    const totalCost = Number(p.total) || 0;
    const remainingDue = Math.max(0, totalCost - existingPaid);

    document.getElementById('p-type').value = p.type;
    handlePurchaseTypeChange();
    document.getElementById('p-date').value = p.date;
    document.getElementById('p-qty').value = p.qty || '';
    document.getElementById('p-weight').value = p.weight || '';
    document.getElementById('p-rate').value = p.rate || '';
    document.getElementById('p-total-cost').value = p.total || '';
    document.getElementById('p-description').value = p.description || '';
    document.getElementById('p-emp-name').value = p.employeeName || '';
    document.getElementById('p-days').value = p.daysWorked || '';
    document.getElementById('p-leaves').value = p.leavesTaken || '';
    // In edit mode, Paid field works as "repay now" amount; previous paid is preserved.
    document.getElementById('p-paid').value = '';
    document.getElementById('p-pending').value = remainingDue;

    if (p.type === 'Salary') {
        updateSalaryLeaves();
        updateSalaryPending();
    }

    document.getElementById('purchase-form').setAttribute('data-edit-id', id);
    document.getElementById('purchase-form').setAttribute('data-existing-paid', String(existingPaid));
    document.getElementById('btn-record-stock').textContent = 'Update Entry';
}

function resetPurchaseForm() {
    ['p-qty', 'p-weight', 'p-rate', 'p-total-cost', 'p-description', 'p-emp-name', 'p-days', 'p-leaves', 'p-paid', 'p-pending'].forEach(id => {
        if (document.getElementById(id)) document.getElementById(id).value = '';
    });

    document.getElementById('purchase-form').removeAttribute('data-edit-id');
    document.getElementById('purchase-form').removeAttribute('data-existing-paid');
    document.getElementById('btn-record-stock').textContent = 'Record Entry';
    setPurchaseDateToToday(true);
    handlePurchaseTypeChange();
    updateStockTotalCost();
}
