const DEFAULT_ITEM_CATEGORIES = ['Chicken', 'Mutton', 'Fish'];
const COUNT_SETTINGS_KEY = 'stock_count_settings';
const DEFAULT_COUNT_SETTINGS = {
    muttonKgPerAnimal: 12,
    henKgPerBird: 1.8,
    chickenLiverKgPerHen: 0.09
};

let ITEM_CATEGORIES = normalizeCategories(
    safeGetJSON('meat_categories', DEFAULT_ITEM_CATEGORIES)
);
let countSettings = loadCountSettings();
let hotels = (safeGetJSON('hotels', [{ id: 1, name: "Grand Royal Hotel", phone: "" }]) || []).map(normalizeHotel);
let deliveries = normalizeDeliveries(safeGetJSON('deliveries', {}));
let currentHotelId = null;

function safeGetJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        if (!value) return fallback;
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function loadCountSettings() {
    const stored = safeGetJSON(COUNT_SETTINGS_KEY, DEFAULT_COUNT_SETTINGS);
    const mutton = parseFloat(stored?.muttonKgPerAnimal);
    const hen = parseFloat(stored?.henKgPerBird);
    const liver = parseFloat(stored?.chickenLiverKgPerHen);
    return {
        muttonKgPerAnimal: Number.isFinite(mutton) && mutton > 0 ? mutton : DEFAULT_COUNT_SETTINGS.muttonKgPerAnimal,
        henKgPerBird: Number.isFinite(hen) && hen > 0 ? hen : DEFAULT_COUNT_SETTINGS.henKgPerBird,
        chickenLiverKgPerHen: Number.isFinite(liver) && liver > 0 ? liver : DEFAULT_COUNT_SETTINGS.chickenLiverKgPerHen
    };
}

function saveCountSettings(settings) {
    countSettings = {
        muttonKgPerAnimal: Number(settings.muttonKgPerAnimal),
        henKgPerBird: Number(settings.henKgPerBird),
        chickenLiverKgPerHen: Number(settings.chickenLiverKgPerHen)
    };
    localStorage.setItem(COUNT_SETTINGS_KEY, JSON.stringify(countSettings));
}

function initCountSettingsControls() {
    const muttonInput = document.getElementById('setting-mutton-kg');
    const henInput = document.getElementById('setting-hen-kg');
    const liverInput = document.getElementById('setting-liver-kg');
    const saveBtn = document.getElementById('btn-save-stock-settings');
    if (!muttonInput || !henInput || !liverInput || !saveBtn) return;

    if (!saveBtn.dataset.bound) {
        saveBtn.addEventListener('click', saveCountSettingsFromUI);
        saveBtn.dataset.bound = '1';
    }

    muttonInput.value = String(countSettings.muttonKgPerAnimal);
    henInput.value = String(countSettings.henKgPerBird);
    liverInput.value = String(countSettings.chickenLiverKgPerHen);
}

function saveCountSettingsFromUI() {
    const muttonInput = document.getElementById('setting-mutton-kg');
    const henInput = document.getElementById('setting-hen-kg');
    const liverInput = document.getElementById('setting-liver-kg');
    if (!muttonInput || !henInput || !liverInput) return;

    const mutton = parseFloat(muttonInput.value);
    const hen = parseFloat(henInput.value);
    const liver = parseFloat(liverInput.value);
    if (!Number.isFinite(mutton) || mutton <= 0) return alert('Avg Kg Per Mutton Animal must be greater than 0.');
    if (!Number.isFinite(hen) || hen <= 0) return alert('Avg Kg Per Hen must be greater than 0.');
    if (!Number.isFinite(liver) || liver <= 0 || liver > 1) return alert('Chicken Liver Kg Per Hen must be between 0 and 1.');

    saveCountSettings({ muttonKgPerAnimal: mutton, henKgPerBird: hen, chickenLiverKgPerHen: liver });
    updateBusinessAnalytics();
    updateLedgerItemStockHint();
}

function sanitizeText(value, max = 80) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function sanitizePhone(value) {
    return String(value || '').replace(/[^\d+\-\s()]/g, '').trim().slice(0, 20);
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
    return {
        id: asNumber(hotel?.id) || Date.now(),
        name: sanitizeText(hotel?.name || 'Hotel'),
        phone: sanitizePhone(hotel?.phone || '')
    };
}

function normalizeCategories(categories) {
    const source = Array.isArray(categories) ? categories : DEFAULT_ITEM_CATEGORIES;
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
    refreshItemDropdown();
    handlePurchaseTypeChange();
    initPurchaseCostListeners();
    initSalaryFieldListeners();
    initCountSettingsControls();

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
        logItem.addEventListener('change', updateLedgerItemStockHint);
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
        alert('Invalid Credentials');
    }
};

function initApp() {
    setPurchaseDateToToday(true);
    renderHotels();
    refreshItemDropdown();
    handlePurchaseTypeChange();
    initPurchaseCostListeners();
    initSalaryFieldListeners();
    initCountSettingsControls();
    renderPurchaseTable();
    updateBusinessAnalytics();
    updateLedgerItemStockHint();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function saveNewHotelFromBar() {
    const input = document.getElementById('hotel-name-input');
    const phoneInput = document.getElementById('hotel-phone-input');
    const name = sanitizeText(input?.value, 80);
    const phone = sanitizePhone(phoneInput?.value);

    if (name) {
        if (phone && !/^[\d+\-\s()]{7,20}$/.test(phone)) {
            return alert('Please enter a valid phone number.');
        }
        hotels.push({ id: Date.now(), name, phone });
        saveData();
        renderHotels();
        input.value = '';
        if (phoneInput) phoneInput.value = '';
        toggleElement('add-hotel-bar');
    } else {
        alert('Please enter a hotel name.');
    }
}

function renderHotels() {
    const container = document.getElementById('hotels-grid') || document.getElementById('hotel-card-container');
    if (!container) return;

    container.innerHTML = hotels.map(hotel => {
        const logs = deliveries[hotel.id] || [];
        const totalPending = logs.reduce((sum, log) => sum + (parseFloat(log.pending) || 0), 0);
        const hotelName = escapeHTML(hotel.name);
        const hotelPhone = escapeHTML(hotel.phone);

        return `
            <div class="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <div onclick="viewLedger(${hotel.id})" class="cursor-pointer">
                        <h3 class="font-bold text-lg text-slate-800">${hotelName}</h3>
                        ${hotel.phone ? `<p class="text-xs text-slate-500 mb-1">Phone: ${hotelPhone}</p>` : ''}
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
    document.getElementById('hotel-list-view').classList.add('hidden');
    document.getElementById('ledger-view').classList.remove('hidden');
    document.getElementById('business-view')?.classList.add('hidden');
    renderLedgerTable();
    updateLedgerItemStockHint();
}

function showHotelList() {
    document.getElementById('ledger-view').classList.add('hidden');
    document.getElementById('business-view')?.classList.add('hidden');
    document.getElementById('hotel-list-view').classList.remove('hidden');
    renderHotels();
    updateBusinessAnalytics();
}

function editHotel(id) {
    const hotel = hotels.find(h => h.id === id);
    if (!hotel) return;
    const newName = prompt('Edit Hotel Name:', hotel.name);
    const cleaned = sanitizeText(newName, 80);
    if (cleaned) {
        hotel.name = cleaned;
        saveData();
        renderHotels();
    }
}

function deleteHotel(id) {
    if (confirm('Are you sure you want to delete this hotel and all its records?')) {
        hotels = hotels.filter(h => h.id !== id);
        delete deliveries[id];
        saveData();
        renderHotels();
        updateBusinessAnalytics();
    }
}

function toggleLogForm() {
    const form = document.getElementById('log-form-container');
    const isOpening = form?.classList.contains('hidden');
    toggleElement('log-form-container');
    if (isOpening) resetLogFormFields();
}

function resetLogFormFields() {
    const date = document.getElementById('log-date');
    const item = document.getElementById('log-item');
    const qty = document.getElementById('log-qty');
    const weight = document.getElementById('log-weight');
    const rate = document.getElementById('log-rate');
    const paid = document.getElementById('log-paid');
    const editId = document.getElementById('edit-id');

    if (editId) editId.value = '';
    if (date) date.value = new Date().toISOString().split('T')[0];
    if (item && item.options.length > 0) item.selectedIndex = 0;
    if (qty) qty.value = '0';
    if (weight) weight.value = '0';
    if (rate) rate.value = '0';
    if (paid) paid.value = '0';
    updateLedgerItemStockHint();
}

function saveLog() {
    const q = parseFloat(document.getElementById('log-qty').value) || 0;
    const w = parseFloat(document.getElementById('log-weight').value) || 0;
    const r = parseFloat(document.getElementById('log-rate').value) || 0;
    const p = parseFloat(document.getElementById('log-paid').value) || 0;
    const eid = document.getElementById('edit-id').value;
    const item = document.getElementById('log-item').value;
    const specialType = getSpecialItemType(item);

    if (!r) return alert('Please enter Rate.');
    if (!specialType && !w) return alert('Please enter Weight.');
    if ((specialType === 'chicken_legs' || specialType === 'mutton_legs' || specialType === 'mutton_head') && !q) {
        return alert('Please enter Qty for selected item.');
    }
    if (specialType === 'chicken_liver' && !w) return alert('Please enter Weight for Chicken Liver.');

    const bucket = getStockBucket(item);
    if (specialType) {
        const special = getSpecialItemAvailability(eid || null);
        if (specialType === 'chicken_legs' && q > special.chickenLegs) {
            return alert(`INSUFFICIENT STOCK!\nOnly ${Math.floor(special.chickenLegs)} chicken legs available.`);
        }
        if (specialType === 'mutton_legs' && q > special.muttonLegs) {
            return alert(`INSUFFICIENT STOCK!\nOnly ${Math.floor(special.muttonLegs)} mutton legs available.`);
        }
        if (specialType === 'mutton_head' && q > special.muttonHeads) {
            return alert(`INSUFFICIENT STOCK!\nOnly ${Math.floor(special.muttonHeads)} mutton heads available.`);
        }
        if (specialType === 'chicken_liver' && w > special.chickenLiverKg) {
            return alert(`INSUFFICIENT STOCK!\nOnly ${(special.chickenLiverKg * 1000).toFixed(0)}g chicken liver available.`);
        }
    } else if (bucket) {
        const stock = getCurrentAvailableStock();

        // On edit, add back old entry stock before validating the new value.
        if (eid && deliveries[currentHotelId]) {
            const oldLog = deliveries[currentHotelId].find(l => l.id == eid);
            if (oldLog) {
                const oldBucket = getStockBucket(oldLog.item);
                if (oldBucket) stock[oldBucket] += (parseFloat(oldLog.weight) || 0);
            }
        }

        const available = Math.max(0, stock[bucket] || 0);
        if (w > available) {
            return alert(`INSUFFICIENT STOCK!\nOnly ${available.toFixed(2)} kg available for ${item}.`);
        }
    }

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

function renderLedgerTable() {
    const logs = deliveries[currentHotelId] || [];
    let totalBal = 0;
    let totalWeight = 0;

    document.getElementById('ledger-table-body').innerHTML = logs.map(log => {
        totalBal += log.pending;
        totalWeight += log.weight;
        const statusLabel = log.pending > 0 ? ' (Due)' : (log.pending < 0 ? ' (Adv)' : '');

        return `<tr class="row-hover border-b">
            <td class="py-4 px-2 text-xs font-bold">${escapeHTML(log.date)}</td>
            <td class="py-4 px-2"><span class="bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold">${escapeHTML(log.item)}</span></td>
            <td class="py-4 px-2 text-right text-sm">${log.quantity || '-'}</td>
            <td class="py-4 px-2 text-right text-sm font-medium">${log.weight}kg</td>
            <td class="py-4 px-2 text-right text-sm font-bold">Rs ${log.total.toLocaleString()}</td>
            <td class="py-4 px-2 text-right text-sm font-bold text-green-600">Rs ${log.paid.toLocaleString()}</td>
            <td class="py-4 px-2 text-right text-sm font-black ${log.pending > 0 ? 'text-red-500' : 'text-green-600'}">Rs ${Math.abs(log.pending).toLocaleString()}${statusLabel}</td>
            <td class="py-4 px-2">
                <div class="flex items-center justify-center gap-2">
                    <button onclick='shareWAById(${log.id})' class="p-1.5 text-green-600"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
                    <button onclick='editLog(${log.id})' class="p-1.5 text-blue-600"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick='deleteLog(${log.id})' class="p-1.5 text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    document.getElementById('total-weight').textContent = totalWeight.toFixed(2) + ' kg';
    const amount = document.getElementById('total-dues');
    const label = document.getElementById('dues-label');
    amount.textContent = 'Rs ' + Math.abs(totalBal).toLocaleString();

    if (totalBal > 0) {
        label.textContent = 'Total Dues (Pending)';
        amount.className = 'text-3xl font-black text-red-400';
    } else if (totalBal < 0) {
        label.textContent = 'Surplus Credit (Advance)';
        amount.className = 'text-3xl font-black text-green-400';
    } else {
        label.textContent = 'Account Clear';
        amount.className = 'text-3xl font-black text-slate-400';
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function shareWA(log) {
    const hotelName = hotels.find(h => h.id === currentHotelId)?.name || 'Hotel';
    const msg = `*Meat Delivery - ${hotelName}*\n\nDate: ${log.date}\nItem: ${log.item}\nWeight: ${log.weight}kg\nTotal: Rs ${log.total}\nPaid: Rs ${log.paid}\nStatus: Rs ${Math.abs(log.pending)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function shareWAById(id) {
    const log = deliveries[currentHotelId]?.find(l => l.id === id);
    if (log) shareWA(log);
}

function editLog(id) {
    const log = deliveries[currentHotelId]?.find(l => l.id === id);
    if (!log) return;
    if (document.getElementById('log-form-container').classList.contains('hidden')) toggleLogForm();
    document.getElementById('edit-id').value = log.id;
    document.getElementById('log-date').value = log.date;
    document.getElementById('log-item').value = log.item;
    document.getElementById('log-qty').value = log.quantity;
    document.getElementById('log-weight').value = log.weight;
    document.getElementById('log-rate').value = log.rate;
    document.getElementById('log-paid').value = log.paid;
    updateLedgerItemStockHint();
}

function deleteLog(id) {
    if (confirm('Delete this entry?')) {
        deliveries[currentHotelId] = (deliveries[currentHotelId] || []).filter(l => l.id !== id);
        saveData();
        renderLedgerTable();
        updateBusinessAnalytics();
    }
}

function addNewCategory() {
    const name = prompt('Add new item (use prefix, e.g., "Chicken Liver", "Mutton Paya"):');
    const cleaned = sanitizeText(name, 40);
    if (cleaned) {
        if (ITEM_CATEGORIES.some(c => c.toLowerCase() === cleaned.toLowerCase())) return;
        ITEM_CATEGORIES.push(cleaned);
        localStorage.setItem('meat_categories', JSON.stringify(ITEM_CATEGORIES));
        refreshItemDropdown();
        handlePurchaseTypeChange();
    }
}

function removeCategory() {
    const name = prompt('Type the name of the Meat Category to remove:');
    const cleaned = sanitizeText(name, 40).toLowerCase();
    if (cleaned && ITEM_CATEGORIES.some(c => c.toLowerCase() === cleaned)) {
        ITEM_CATEGORIES = ITEM_CATEGORIES.filter(c => c.toLowerCase() !== cleaned);
        localStorage.setItem('meat_categories', JSON.stringify(ITEM_CATEGORIES));
        refreshItemDropdown();
        handlePurchaseTypeChange();
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

    if (logItemSelect) {
        logItemSelect.innerHTML = ITEM_CATEGORIES.map(c => {
            const safe = escapeHTML(c);
            return `<option value="${safe}">${safe}</option>`;
        }).join('');
    }
    updateLedgerItemStockHint();
}

function getStockBucket(text) {
    const value = String(text || '').toLowerCase();
    const hasPrefix = (prefix) => value === prefix || value.startsWith(prefix + ' ') || value.startsWith(prefix + '-');

    // Prefix mapping requested by user:
    // "chicken ..." -> chicken stock, "mutton ..." -> mutton stock, "fish ..." -> fish stock
    if (hasPrefix('chicken') || hasPrefix('hen')) return 'hens';
    if (hasPrefix('mutton') || hasPrefix('goat') || hasPrefix('lamb')) return 'animals';
    if (hasPrefix('fish')) return 'fish';
    return null;
}

function getStockBucketLabel(bucket) {
    if (bucket === 'hens') return 'Chicken';
    if (bucket === 'animals') return 'Mutton';
    if (bucket === 'fish') return 'Fish';
    return 'Category';
}

function getCurrentAvailableStock() {
    const availableStock = { animals: 0, hens: 0, fish: 0 };
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];

    purchases.forEach(p => {
        const bucket = getStockBucket(p.type);
        if (bucket) availableStock[bucket] += (parseFloat(p.weight) || 0);
    });

    // Deduct sold stock from all hotel ledger entries (by item + sold weight)
    Object.values(deliveries || {}).forEach(hotelLogs => {
        (hotelLogs || []).forEach(log => {
            const bucket = getStockBucket(log.item);
            if (bucket) availableStock[bucket] -= (parseFloat(log.weight) || 0);
        });
    });

    availableStock.animals = Math.max(0, availableStock.animals);
    availableStock.hens = Math.max(0, availableStock.hens);
    availableStock.fish = Math.max(0, availableStock.fish);

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
    const value = String(text || '').toLowerCase();
    const isChickenPrefix = value.startsWith('chicken ') || value === 'chicken' || value.startsWith('hen ') || value === 'hen';
    return isChickenPrefix && value.includes('liver');
}

function getSpecialItemType(text) {
    if (isChickenLegItem(text)) return 'chicken_legs';
    if (isChickenLiverItem(text)) return 'chicken_liver';
    if (isMuttonLegItem(text)) return 'mutton_legs';
    if (isMuttonHeadItem(text)) return 'mutton_head';
    return null;
}

function getUnitsPerAnimal(item, bucket) {
    if (bucket === 'hens' && isChickenLegItem(item)) return 2;
    if (bucket === 'animals' && isMuttonLegItem(item)) return 4;
    if (bucket === 'animals' && isMuttonHeadItem(item)) return 1;
    return 1;
}

function estimateCountFromWeight(bucket, weightKg) {
    const weight = parseFloat(weightKg) || 0;
    if (weight <= 0) return 0;
    if (bucket === 'animals') return weight / countSettings.muttonKgPerAnimal;
    if (bucket === 'hens') return weight / countSettings.henKgPerBird;
    return 0;
}

function estimateWholeCountFromWeight(bucket, weightKg) {
    const estimated = estimateCountFromWeight(bucket, weightKg);
    if (estimated <= 0) return 0;
    return Math.max(1, Math.round(estimated));
}

function getCurrentAvailableCountStock() {
    const available = { animals: 0, hens: 0, fish: 0 };
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];

    purchases.forEach(p => {
        const bucket = getStockBucket(p.type);
        if (!bucket) return;
        const qty = parseFloat(p.qty);
        if (Number.isFinite(qty) && qty > 0) {
            available[bucket] += qty;
            return;
        }
        // Backward-compatible fallback for older records that only have weight.
        available[bucket] += estimateCountFromWeight(bucket, p.weight);
    });

    Object.values(deliveries || {}).forEach(hotelLogs => {
        (hotelLogs || []).forEach(log => {
            const bucket = getStockBucket(log.item);
            if (!bucket) return;

            const soldQty = parseFloat(log.quantity);
            const unitsPerAnimal = getUnitsPerAnimal(log.item, bucket);
            let consumedBaseCount = 0;

            if (Number.isFinite(soldQty) && soldQty > 0) {
                consumedBaseCount = soldQty / (unitsPerAnimal || 1);
            } else {
                // If quantity is missing, estimate sold animal/bird count from sold weight.
                consumedBaseCount = estimateCountFromWeight(bucket, log.weight);
            }

            available[bucket] -= consumedBaseCount;
        });
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
        const qty = parseFloat(p.qty);
        if (Number.isFinite(qty) && qty > 0) {
            available[bucket] += qty;
            return;
        }
        available[bucket] += estimateCountFromWeight(bucket, p.weight);
    });
    return available;
}

function getSpecialItemAvailability(excludeLogId = null) {
    const liveKgStock = getCurrentAvailableStock();

    // When editing, add back the current log's weight so availability is accurate.
    if (excludeLogId) {
        let excludedLog = null;
        Object.values(deliveries || {}).some(hotelLogs => {
            excludedLog = (hotelLogs || []).find(l => Number(l.id) === Number(excludeLogId));
            return Boolean(excludedLog);
        });
        if (excludedLog) {
            const bucket = getStockBucket(excludedLog.item);
            const weight = parseFloat(excludedLog.weight) || 0;
            if (bucket && weight > 0) liveKgStock[bucket] += weight;
        }
    }

    // Derive available hens/animals from live kg stock for real-time behavior.
    const hensCount = estimateWholeCountFromWeight('hens', liveKgStock.hens || 0);
    // For mutton special cuts, always derive animal count from live kg stock
    // to avoid inflated counts when purchase qty is entered in non-animal units.
    const animalsCount = estimateWholeCountFromWeight('animals', liveKgStock.animals || 0);

    let soldChickenLegs = 0;
    let soldChickenLiverKg = 0;
    let soldMuttonLegs = 0;
    let soldMuttonHeads = 0;

    Object.values(deliveries || {}).forEach(hotelLogs => {
        (hotelLogs || []).forEach(log => {
            if (excludeLogId && Number(log.id) === Number(excludeLogId)) return;
            const savedType = sanitizeText(log.specialType, 30);
            const soldQty = parseFloat(log.quantity) || 0;
            const soldWeight = parseFloat(log.weight) || 0;

            // Use explicit tag only. This avoids legacy ambiguous rows
            // (same names used for kg sales) from corrupting piece stock.
            const specialType = savedType;
            if (!['chicken_legs', 'chicken_liver', 'mutton_legs', 'mutton_head'].includes(specialType)) return;

            if (specialType === 'chicken_legs') soldChickenLegs += soldQty;
            if (specialType === 'mutton_legs') soldMuttonLegs += soldQty;
            if (specialType === 'mutton_head') soldMuttonHeads += soldQty;
            if (specialType === 'chicken_liver') soldChickenLiverKg += soldWeight;
        });
    });

    const chickenLegs = Math.max(0, (hensCount * 2) - soldChickenLegs);
    const muttonLegs = Math.max(0, (animalsCount * 4) - soldMuttonLegs);
    const muttonHeads = Math.max(0, animalsCount - soldMuttonHeads);
    const chickenLiverKg = Math.max(0, (hensCount * countSettings.chickenLiverKgPerHen) - soldChickenLiverKg);

    return {
        hensCount,
        animalsCount,
        chickenLegs,
        muttonLegs,
        muttonHeads,
        chickenLiverKg
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
        const grams = special.chickenLiverKg * 1000;
        hint.textContent = `Stock Available (Chicken Liver): ${Math.max(0, Math.floor(grams))} g`;
        hint.className = `text-[11px] font-bold px-1 ${grams > 0 ? 'text-green-600' : 'text-red-600'}`;
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
    const stockFields = ['field-qty', 'field-weight', 'field-rate', 'field-total-cost'];
    const salaryFields = ['field-total-cost', 'field-emp-name', 'field-days', 'field-leaves', 'field-paid', 'field-pending'];
    const miscFields = ['field-total-cost', 'field-description'];

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
    } else {
        stockFields.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        setTotalCostReadonly(true);
        updateStockTotalCost();
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
        return;
    }
    totalField.value = (weight * rate).toFixed(2);
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
    const pendingField = document.getElementById('p-pending');
    if (pendingField) pendingField.value = Math.max(0, totalCost - paid);
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

        if (!empName) return alert('Please enter Employee Name for salary.');
        if (totalCost <= 0) return alert('Please enter valid Total Cost (greater than 0).');
        if (paid < 0) return alert('Paid Amount cannot be negative.');
        if (workedDays <= 0) return alert('Days Worked must be greater than 0.');

        entry.employeeName = empName;
        entry.daysWorked = String(workedDays);
        entry.leavesTaken = String(leavesTaken);
        entry.paid = paid;
        entry.pending = Math.max(0, totalCost - paid);
        entry.total = totalCost;
    } else if (type === 'Miscellaneous') {
        const miscTotal = parseFloat(document.getElementById('p-total-cost').value) || 0;
        const description = sanitizeText(document.getElementById('p-description')?.value, 160);
        if (miscTotal <= 0) return alert('Please enter Miscellaneous total cost (greater than 0).');
        entry.description = description;
        entry.total = miscTotal;
    } else {
        const qty = parseFloat(document.getElementById('p-qty').value);
        const weight = parseFloat(document.getElementById('p-weight').value);
        const rate = parseFloat(document.getElementById('p-rate').value);

        if (!Number.isFinite(qty) || qty <= 0) return alert('Qty (Count) must be greater than 0.');
        if (!Number.isFinite(weight) || weight <= 0) return alert('Weight (Kgs) must be greater than 0.');
        if (!Number.isFinite(rate) || rate <= 0) return alert('Price / Kg must be greater than 0.');

        entry.qty = String(qty);
        entry.weight = String(weight);
        entry.rate = String(rate);
        entry.total = parseFloat(document.getElementById('p-total-cost')?.value) || ((parseFloat(entry.weight) || 0) * (parseFloat(entry.rate) || 0));
    }

    let purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    if (editId) {
        const idx = purchases.findIndex(p => p.id == editId);
        if (idx >= 0) purchases[idx] = entry;
        document.getElementById('purchase-form').removeAttribute('data-edit-id');
        document.getElementById('btn-record-stock').textContent = 'Record Entry';
    } else {
        purchases.unshift(entry);
    }

    localStorage.setItem('business_purchases', JSON.stringify(purchases));
    renderPurchaseTable();
    updateBusinessAnalytics();
    resetPurchaseForm();
}

function renderPurchaseTable() {
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    const tbody = document.getElementById('purchase-table-body');
    if (!tbody) return;

    tbody.innerHTML = purchases.map(p => {
        const isSalary = p.type === 'Salary';
        const isMisc = p.type === 'Miscellaneous';
        const qtyText = isSalary ? (p.employeeName || '-') : (isMisc ? '-' : (p.qty || '-'));
        const weightText = isSalary
            ? `Days: ${p.daysWorked || 0} | Leaves: ${p.leavesTaken || 0}`
            : (isMisc ? '-' : (p.weight ? p.weight + ' kg' : '-'));
        const rateText = isSalary
            ? `Paid: Rs ${p.paid || 0} | Pending: Rs ${p.pending || 0}`
            : (isMisc ? '-' : (p.rate ? 'Rs ' + p.rate : '-'));
        const descriptionText = p.description ? p.description : '-';

        return `
            <tr class="border-b hover:bg-slate-50 text-xs">
                <td class="p-4">
                    <div class="font-bold text-slate-700">${escapeHTML(p.date)}</div>
                    <div class="text-[10px] text-slate-400 font-medium">${escapeHTML(p.time || '')}</div>
                </td>
                <td class="p-4"><span class="bg-slate-900 text-white px-2 py-1 rounded text-[9px] font-bold uppercase">${escapeHTML(p.type)}</span></td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(qtyText)}</td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(weightText)}</td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(rateText)}</td>
                <td class="p-4 text-center font-bold text-slate-700">${escapeHTML(descriptionText)}</td>
                <td class="p-4 text-right font-black text-slate-900 text-sm">Rs ${Number(p.total || 0).toLocaleString()}</td>
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
}

function shareBusinessWA(purchase) {
    const salaryInfo = purchase.type === 'Salary'
        ? `\nEmployee: ${purchase.employeeName || '-'}\nDays Worked: ${purchase.daysWorked || 0}\nLeaves: ${purchase.leavesTaken || 0}\nPaid: Rs ${purchase.paid || 0}\nPending: Rs ${purchase.pending || 0}`
        : '';
    const miscDescription = purchase.description ? `\nDescription: ${purchase.description}` : '';

    const msg = `*Business Analytics Entry*\n\nDate: ${purchase.date}\nCategory: ${purchase.type}\nQuantity: ${purchase.qty || '-'}\nWeight: ${purchase.weight || '-'} kg\nRate: Rs ${purchase.rate || 0}\nTotal Cost: Rs ${purchase.total || 0}${miscDescription}${salaryInfo}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function shareBusinessWAById(id) {
    const purchases = safeGetJSON('business_purchases', []);
    const purchase = (purchases || []).find(p => p.id === id);
    if (purchase) shareBusinessWA(purchase);
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

    Object.values(deliveries).forEach(hotelLogs => {
        hotelLogs.forEach(log => {
            const billed = parseFloat(log.total) || 0;
            const paid = parseFloat(log.paid) || 0;
            const pending = parseFloat(log.pending) || 0;

            totalSales += billed;
            clearedSales += paid;
            if (pending > 0) marketDues += pending;
        });
    });

    const animalsEl = document.getElementById('stat-total-animals');
    const hensEl = document.getElementById('stat-total-hens');
    const fishEl = document.getElementById('stat-total-fish');

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
        profitEl.className = netProfit < 0 ? 'text-3xl font-black text-red-500' : 'text-3xl font-black text-green-600';
    }
    updateLedgerItemStockHint();
}

function showBusinessView() {
    document.getElementById('hotel-list-view').classList.add('hidden');
    document.getElementById('ledger-view').classList.add('hidden');
    document.getElementById('business-view').classList.remove('hidden');
    renderPurchaseTable();
    updateBusinessAnalytics();
}

function toggleElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
}

function saveData() {
    localStorage.setItem('hotels', JSON.stringify(hotels.map(normalizeHotel)));
    localStorage.setItem('deliveries', JSON.stringify(normalizeDeliveries(deliveries)));
}

function deletePurchase(id) {
    if (confirm('Delete this business record?')) {
        let purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
        purchases = purchases.filter(p => p.id !== id);
        localStorage.setItem('business_purchases', JSON.stringify(purchases));
        renderPurchaseTable();
        updateBusinessAnalytics();
    }
}

function editPurchase(id) {
    const purchases = JSON.parse(localStorage.getItem('business_purchases')) || [];
    const p = purchases.find(item => item.id === id);
    if (!p) return;

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
    document.getElementById('p-paid').value = p.paid || '';
    document.getElementById('p-pending').value = p.pending || '';

    if (p.type === 'Salary') {
        updateSalaryLeaves();
        updateSalaryPending();
    }

    document.getElementById('purchase-form').setAttribute('data-edit-id', id);
    document.getElementById('btn-record-stock').textContent = 'Update Entry';
}

function resetPurchaseForm() {
    ['p-qty', 'p-weight', 'p-rate', 'p-total-cost', 'p-description', 'p-emp-name', 'p-days', 'p-leaves', 'p-paid', 'p-pending'].forEach(id => {
        if (document.getElementById(id)) document.getElementById(id).value = '';
    });

    document.getElementById('purchase-form').removeAttribute('data-edit-id');
    document.getElementById('btn-record-stock').textContent = 'Record Entry';
    setPurchaseDateToToday(true);
    handlePurchaseTypeChange();
    updateStockTotalCost();
}
