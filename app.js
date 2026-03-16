const sb = window.supabaseClient;

const GEMINI_ENDPOINT =
  "https://juryvtbmjyaxitdvtzwc.supabase.co/functions/v1/gemini-tag-image-dev";

const userPill = document.getElementById('user-pill');
const installSplash = document.getElementById('install-splash');
const installContinueBtn = document.getElementById('install-continue-btn');
const splashScreen = document.getElementById('splash-screen');
const splashGoBtn = document.getElementById('splash-go-btn');

const form = document.getElementById('item-form');
const formStatus = document.getElementById('form-status');

const titleInput = document.getElementById('title');
const colorInput = document.getElementById('color');
const materialInput = document.getElementById('material');
const conditionInput = document.getElementById('condition');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const photoInput = document.getElementById('photo');

const openAddBtn = document.getElementById('open-add-btn');
const hereBtn = document.getElementById('here-btn');
const closeAddBtn = document.getElementById('close-add-btn');
const submitAddBtn = document.getElementById('submit-add-btn');
const addModal = document.getElementById('add-modal');
const modalBackdrop = document.getElementById('modal-backdrop');

const addPhotoImage = document.getElementById('add-photo-image');
const addPhotoEmpty = document.getElementById('add-photo-empty');
const retakePhotoBtn = document.getElementById('retake-photo-btn');
const aiThinking = document.getElementById('ai-thinking');
const aiThinkingSkipBtn = document.getElementById('ai-thinking-skip-btn');

const pickTitleBtn = document.getElementById('pick-title-btn');
const pickColorBtn = document.getElementById('pick-color-btn');
const pickMaterialBtn = document.getElementById('pick-material-btn');
const pickConditionBtn = document.getElementById('pick-condition-btn');

const pickTitleValue = document.getElementById('pick-title-value');
const pickColorValue = document.getElementById('pick-color-value');
const pickMaterialValue = document.getElementById('pick-material-value');
const pickConditionValue = document.getElementById('pick-condition-value');

const pickerSheet = document.getElementById('picker-sheet');
const pickerSearchWrap = document.getElementById('picker-search-wrap');
const pickerSearchInput = document.getElementById('picker-search-input');
const pickerOptions = document.getElementById('picker-options');

const objectSheet = document.getElementById('object-sheet');
const objectSearchInput = document.getElementById('object-search-input');
const objectAiWrap = document.getElementById('object-ai-wrap');
const objectAiSuggestions = document.getElementById('object-ai-suggestions');
const objectOptions = document.getElementById('object-options');

const colorSheet = document.getElementById('color-sheet');
const materialSheet = document.getElementById('material-sheet');
const colorWheel = document.getElementById('color-wheel');
const colorWheelKnob = document.getElementById('color-wheel-knob');
const colorLightness = document.getElementById('color-lightness');
const colorPreviewSwatch = document.getElementById('color-preview-swatch');
const colorAiWrap = document.getElementById('color-ai-wrap');
const colorAiApply = document.getElementById('color-ai-apply');
const materialAiWrap = document.getElementById('material-ai-wrap');
const materialAiSuggestions = document.getElementById('material-ai-suggestions');
const materialSearchInput = document.getElementById('material-search-input');
const materialOptions = document.getElementById('material-options');
const colorSheetDoneBtn = document.getElementById('color-sheet-done-btn');
const materialSheetDoneBtn = document.getElementById('material-sheet-done-btn');

const mapSearchInput = document.getElementById('map-search');
const filterAllBtn = document.getElementById('filter-all-btn');
const filterNewBtn = document.getElementById('filter-new-btn');
const filterVerifiedBtn = document.getElementById('filter-verified-btn');

const detailModal = document.getElementById('detail-modal');
const detailBackdrop = document.getElementById('detail-backdrop');
const detailCard = document.getElementById('detail-card');
const detailCloseBtn = document.getElementById('detail-close-btn');
const detailImage = document.getElementById('detail-image');
const detailImagePlaceholder = document.getElementById('detail-image-placeholder');
const detailTitle = document.getElementById('detail-title');
const detailColor = document.getElementById('detail-color');
const detailCondition = document.getElementById('detail-condition');
const detailCount = document.getElementById('detail-count');
const detailStillBtn = document.getElementById('detail-still-btn');
const detailGoneBtn = document.getElementById('detail-gone-btn');
const detailReportBtn = document.getElementById('detail-report-btn');
const detailHeroState = document.getElementById('detail-hero-state');
const detailHeroStateText = document.getElementById('detail-hero-state-text');
const detailHeroStillBtn = document.getElementById('detail-hero-still-btn');

let currentUser = null;
let map = null;
let itemsLayer = null;
let draftMarker = null;
let userMarker = null;
let markersById = new Map();
let allItems = [];
let currentFilter = 'all';
let currentSearch = '';
let currentPicker = null;
let photoPreviewUrl = null;
let activeDetailItem = null;
let verifiedItemIds = new Set();
let itemsSubscription = null;
let expirationRefreshTimer = null;
let aiInFlight = false;
let aiLastResult = null;
let aiRequestSequence = 0;
let selectedColorName = '';
let selectedMaterialName = '';
let colorPickerState = { hue: 35, saturation: 0.1, lightness: 0.92 };

function primeInputForQuickReplace(input, value = '') {
  if (!input) return;
  input.value = value;
  input.dataset.autoclearReady = value ? 'true' : 'false';
}

function clearInputOnFirstClick(input, onAfterClear) {
  if (!input) return;
  input.addEventListener('pointerdown', () => {
    if (input.dataset.autoclearReady !== 'true') return;
    input.value = '';
    input.dataset.autoclearReady = 'false';
    if (typeof onAfterClear === 'function') onAfterClear();
  });
}

const DEFAULT_CENTER = [40.741, -73.989];
const DEFAULT_ZOOM = 12;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const MAX_CUSTOM_TITLE_LENGTH = 20;

const OBJECT_LIST = [
  'air conditioner',
  'armchair',
  'bench',
  'bike',
  'bookcase',
  'cabinet',
  'chair',
  'chaise lounge',
  'coffee table',
  'console table',
  'couch',
  'crate',
  'desk',
  'desk chair',
  'dining chair',
  'dining table',
  'dog crate',
  'dresser',
  'end table',
  'fan',
  'filing cabinet',
  'folding chair',
  'futon',
  'headboard',
  'heater',
  'hutch',
  'lamp',
  'lawn chair',
  'lounge chair',
  'loveseat',
  'mattress',
  'media console',
  'mirror',
  'monitor',
  'nightstand',
  'office chair',
  'ottoman',
  'patio chair',
  'patio table',
  'piano',
  'plant',
  'planter',
  'printer',
  'rack',
  'recliner',
  'rocking chair',
  'rug',
  'shelf',
  'shoe rack',
  'side table',
  'sink',
  'sofa',
  'speaker',
  'stool',
  'storage bin',
  'storage cabinet',
  'storage shelf',
  'stroller',
  'suitcase',
  'swivel chair',
  'table',
  'table lamp',
  'toolbox',
  'tv',
  'tv stand',
  'vanity',
  'wardrobe',
  'washing machine',
  'wheelchair',
  'window',
  'wine rack',
  'workbench',
  'bed frame',
  'bed',
  'bunk bed',
  'daybed',
  'crib',
  'toilet',
  'bathtub',
  'microwave',
  'mini fridge'
];

const COLOR_LIST = [
  'black','white','gray','silver','red','orange','yellow','green','blue',
  'purple','pink','brown','tan','beige','cream','clear','wood','metal',
  'chrome','steel','brass','cane','wicker','rattan','plastic','glass',
  'leather','fabric','velvet'
];

const MATERIAL_LIST = [
  'wood',
  'metal',
  'plastic',
  'glass',
  'fabric',
  'leather',
  'paper',
  'cardboard',
  'ceramic',
  'stone',
  'wicker',
  'rattan',
  'rubber'
];

const CONDITION_LIST = ['Perfect','Great','Good','Scruffy','Salvage'];

const COLOR_NAME_PRESETS = {
  black: { hue: 0, saturation: 0, lightness: 0.08 },
  white: { hue: 0, saturation: 0, lightness: 0.98 },
  gray: { hue: 0, saturation: 0, lightness: 0.55 },
  silver: { hue: 0, saturation: 0, lightness: 0.72 },
  red: { hue: 0, saturation: 0.92, lightness: 0.55 },
  orange: { hue: 28, saturation: 0.96, lightness: 0.56 },
  yellow: { hue: 56, saturation: 0.98, lightness: 0.54 },
  green: { hue: 122, saturation: 0.78, lightness: 0.42 },
  blue: { hue: 215, saturation: 0.85, lightness: 0.52 },
  purple: { hue: 276, saturation: 0.8, lightness: 0.56 },
  pink: { hue: 328, saturation: 0.82, lightness: 0.68 },
  brown: { hue: 28, saturation: 0.5, lightness: 0.36 },
  tan: { hue: 33, saturation: 0.42, lightness: 0.68 },
  beige: { hue: 42, saturation: 0.32, lightness: 0.83 },
  cream: { hue: 50, saturation: 0.52, lightness: 0.9 },
  clear: { hue: 0, saturation: 0, lightness: 0.97 },
  wood: { hue: 32, saturation: 0.55, lightness: 0.46 },
  metal: { hue: 210, saturation: 0.08, lightness: 0.66 },
  chrome: { hue: 210, saturation: 0.05, lightness: 0.78 },
  steel: { hue: 210, saturation: 0.11, lightness: 0.6 },
  brass: { hue: 44, saturation: 0.74, lightness: 0.54 },
  cane: { hue: 36, saturation: 0.4, lightness: 0.67 },
  wicker: { hue: 34, saturation: 0.42, lightness: 0.62 },
  rattan: { hue: 36, saturation: 0.35, lightness: 0.64 },
  plastic: { hue: 0, saturation: 0, lightness: 0.95 },
  glass: { hue: 205, saturation: 0.25, lightness: 0.9 },
  leather: { hue: 22, saturation: 0.36, lightness: 0.31 },
  fabric: { hue: 0, saturation: 0, lightness: 0.85 },
  velvet: { hue: 310, saturation: 0.6, lightness: 0.42 }
};

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeCustomTitle(value = '') {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isValidCustomTitle(value = '') {
  const normalized = normalizeCustomTitle(value);
  return normalized.length > 0 && normalized.length <= MAX_CUSTOM_TITLE_LENGTH;
}

function getTitleValidationMessage(value = '') {
  const normalized = normalizeCustomTitle(value);
  if (!normalized) return 'Type an object name.';
  if (normalized.length > MAX_CUSTOM_TITLE_LENGTH) {
    return 'Keep object names under 21 characters.';
  }
  return '';
}

async function resizeImage(file, maxWidth = 1200, quality = 0.8) {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read image file.'));
    img.onerror = () => reject(new Error('Could not load image for resizing.'));

    reader.onload = (e) => {
      img.src = e.target?.result;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create image canvas.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not compress image.'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function showInstallSplash() {
  if (!installSplash) return;
  installSplash.hidden = false;
  installSplash.classList.remove('is-hidden');
}

function dismissInstallSplash() {
  if (!installSplash || installSplash.hidden || installSplash.classList.contains('is-hidden')) return;
  installSplash.classList.add('is-hidden');
}

function dismissSplashScreen() {
  if (!splashScreen || splashScreen.classList.contains('is-hidden')) return;
  splashScreen.classList.add('is-hidden');
}

function configureLaunchSplash() {
  if (isStandaloneMode()) {
    if (installSplash) installSplash.hidden = true;
    if (splashScreen) splashScreen.classList.remove('is-hidden');
    return;
  }

  if (splashScreen) splashScreen.classList.add('is-hidden');
  showInstallSplash();
}

function setAuthError(message = 'Auth error') {
  console.error(message);
  if (userPill) userPill.textContent = message;
}

function renderUser() {
  if (!userPill) return;
  if (!currentUser) {
    userPill.textContent = 'Not connected';
    return;
  }
  userPill.textContent = `anon ${currentUser.id.slice(0, 8)}`;
}

async function ensureAnonymousSession() {
  if (!sb?.auth) {
    setAuthError('Auth unavailable');
    return false;
  }

  try {
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    if (sessionError) {
      setAuthError('Auth error');
      console.error(sessionError);
      return false;
    }

    if (!sessionData?.session) {
      const { data: signInData, error: signInError } = await sb.auth.signInAnonymously();
      if (signInError) {
        setAuthError('Auth error');
        console.error(signInError);
        return false;
      }
      currentUser = signInData?.user ?? signInData?.session?.user ?? null;
    } else {
      currentUser = sessionData.session.user ?? null;
    }

    if (!currentUser) {
      const { data: userData, error: userError } = await sb.auth.getUser();
      if (userError) {
        setAuthError('Auth error');
        console.error(userError);
        return false;
      }
      currentUser = userData?.user ?? null;
    }

    if (!currentUser) {
      setAuthError('No user session');
      return false;
    }

    renderUser();
    return true;
  } catch (error) {
    setAuthError('Auth error');
    console.error(error);
    return false;
  }
}

function parseDateMs(value) {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? ms : null;
}

function fallbackExpiresAt(item) {
  const createdMs = parseDateMs(item.created_at);
  if (!createdMs) return null;
  return new Date(createdMs + ONE_WEEK_MS).toISOString();
}

function normalizeItem(item) {
  return {
    ...item,
    lat: item.lat == null ? null : Number(item.lat),
    lng: item.lng == null ? null : Number(item.lng),
    confirm_count: Number(item.confirm_count ?? 0),
    gone_reported: Boolean(item.gone_reported),
    expires_at: item.expires_at || fallbackExpiresAt(item)
  };
}

function isItemExpired(item) {
  const expiresMs = parseDateMs(item.expires_at);
  if (!expiresMs) return false;
  return expiresMs <= Date.now();
}

function getItemStatus(item) {
  if (isItemExpired(item)) return 'expired';
  if (item.gone_reported) return 'gone';
  return Number(item.confirm_count ?? 0) > 0 ? 'verified' : 'new';
}

function createLabeledIcon(label, variant = '') {
  const safeLabel = escapeHtml((label || 'item').trim().toLowerCase());
  const variantClass = variant ? ` ${variant}` : '';

  return L.divIcon({
    className: 'rething-marker',
    html: `
      <div class="map-chip${variantClass}">
        <span class="map-chip__dot"></span>
        <span class="map-chip__label">${safeLabel}</span>
      </div>
    `,
    iconSize: null,
    iconAnchor: [20, 24]
  });
}

function initMap() {
  map = L.map('map', { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  itemsLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 0);
}

function setDraftLocation(lat, lng, message = 'Location added.') {
  latInput.value = Number(lat).toFixed(6);
  lngInput.value = Number(lng).toFixed(6);
  if (formStatus) formStatus.textContent = message;

  const label = (titleInput.value || 'new item').trim();
  if (!draftMarker) {
    draftMarker = L.marker([lat, lng], { icon: createLabeledIcon(label, ' is-draft') }).addTo(map);
  } else {
    draftMarker.setLatLng([lat, lng]);
    draftMarker.setIcon(createLabeledIcon(label, ' is-draft'));
  }
}

function refreshDraftMarkerLabel() {
  if (!draftMarker) return;
  const label = (titleInput.value || 'new item').trim();
  draftMarker.setIcon(createLabeledIcon(label, ' is-draft'));
}

async function useCurrentLocation(options = {}) {
  const { silent = false } = options;
  if (!navigator.geolocation) {
    if (!silent && formStatus) formStatus.textContent = 'Geolocation is not supported in this browser.';
    return;
  }

  if (!silent && formStatus) formStatus.textContent = 'Getting location…';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setDraftLocation(lat, lng, silent ? 'Location ready.' : 'Location added.');

      if (!userMarker) {
        userMarker = L.marker([lat, lng], { icon: createLabeledIcon('you', ' is-user') }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
      }
      map.setView([lat, lng], 16);
    },
    (error) => {
      console.error(error);
      if (!silent && formStatus) formStatus.textContent = `Location failed: ${error.message}`;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function resetHereButton() {
  if (!hereBtn) return;
  hereBtn.disabled = false;
  hereBtn.classList.remove('is-locating');
  hereBtn.textContent = 'near you';
}

function moveMapToCurrentLocation() {
  if (!navigator.geolocation) {
    if (userPill) userPill.textContent = 'Location unavailable';
    return;
  }

  if (hereBtn) {
    hereBtn.disabled = true;
    hereBtn.classList.add('is-locating');
    hereBtn.textContent = '...';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (!userMarker) {
        userMarker = L.marker([lat, lng], { icon: createLabeledIcon('you', ' is-user') }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      map.flyTo([lat, lng], Math.max(map.getZoom(), 16), {
        animate: true,
        duration: 0.75
      });

      resetHereButton();
    },
    (error) => {
      console.error('HERE button location failed:', error);
      resetHereButton();
      if (userPill) userPill.textContent = 'Location blocked';
      setTimeout(() => renderUser(), 1800);
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

function getUnexpiredItems(items) {
  return items.filter((item) => !isItemExpired(item));
}

function applyFilters(items) {
  let filtered = [...getUnexpiredItems(items)];

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter((item) =>
      [item.title || '', item.color || '', item.condition || '']
        .some((value) => value.toLowerCase().includes(q))
    );
  }

  if (currentFilter === 'new') {
    filtered = filtered.filter((item) => getItemStatus(item) === 'new');
  }

  if (currentFilter === 'verified') {
    filtered = filtered.filter((item) => getItemStatus(item) === 'verified');
  }

  return filtered;
}

function updateFilterButtons() {
  const isAll = currentFilter === 'all';
  filterAllBtn.classList.toggle('is-active', isAll);
  filterNewBtn.classList.toggle('is-active', isAll || currentFilter === 'new');
  filterVerifiedBtn.classList.toggle('is-active', isAll || currentFilter === 'verified');
}

function syncDetailVerifyState() {
  if (!activeDetailItem) return;

  const isGone = activeDetailItem.gone_reported;
  const alreadyVerified = verifiedItemIds.has(activeDetailItem.id);
  const disableStill = alreadyVerified && !isGone;

  detailStillBtn.disabled = disableStill;
  detailHeroStillBtn.disabled = false;

  detailStillBtn.textContent = disableStill ? 'verified' : 'still there';
  detailHeroStillBtn.textContent = 'still there?';

  detailGoneBtn.classList.toggle('is-active-red', isGone);
  detailStillBtn.classList.toggle('is-active-green', !disableStill && !isGone);

  detailCard.classList.toggle('is-gone', isGone);

  detailHeroState.hidden = !isGone;
  detailHeroStillBtn.hidden = !isGone;
  detailHeroStateText.textContent = isGone ? 'reported gone' : '';

  if (isGone) {
    detailStillBtn.disabled = false;
  }
}

function openDetailModal(item) {
  activeDetailItem = item;

  if (detailImage) {
    if (item.image_url) {
      detailImage.src = item.image_url;
      detailImage.hidden = false;
      if (detailImagePlaceholder) detailImagePlaceholder.hidden = true;
    } else {
      detailImage.removeAttribute('src');
      detailImage.hidden = true;
      if (detailImagePlaceholder) detailImagePlaceholder.hidden = false;
    }
  }

  if (detailTitle) detailTitle.textContent = (item.title || 'unknown item').toLowerCase();
  if (detailColor) detailColor.textContent = item.color || 'Unknown';
  if (detailCondition) detailCondition.textContent = item.condition || 'Unknown';
  if (detailCount) detailCount.textContent = String(item.confirm_count ?? 0);

  syncDetailVerifyState();
  detailModal.hidden = false;
}

function closeDetailModal() {
  detailModal.hidden = true;
  activeDetailItem = null;
  detailCard.classList.remove('is-gone');
  detailHeroState.hidden = true;
  detailStillBtn.disabled = false;
  detailStillBtn.textContent = 'still there';
  detailHeroStillBtn.disabled = false;
  detailHeroStillBtn.textContent = 'still there?';
  detailGoneBtn.classList.remove('is-active-red');
  detailStillBtn.classList.remove('is-active-green');
}

function getMarkerVariantClass(item) {
  const status = getItemStatus(item);
  if (status === 'gone') return ' is-gone';
  if (status === 'verified') return ' is-verified';
  return ' is-new';
}

function updateMapMarkers(items) {
  itemsLayer.clearLayers();
  markersById = new Map();
  const bounds = [];

  items.forEach((item) => {
    if (typeof item.lat !== 'number' || Number.isNaN(item.lat) || typeof item.lng !== 'number' || Number.isNaN(item.lng)) {
      return;
    }

    const marker = L.marker([item.lat, item.lng], {
      icon: createLabeledIcon(item.title || 'item', getMarkerVariantClass(item))
    });

    marker.on('click', () => openDetailModal(item));
    marker.addTo(itemsLayer);
    markersById.set(item.id, marker);
    bounds.push([item.lat, item.lng]);
  });

  if (bounds.length) {
    map.fitBounds(L.latLngBounds(bounds), { padding: [60, 120], maxZoom: 16 });
  } else if (draftMarker) {
    map.setView(draftMarker.getLatLng(), 16);
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }
}

function renderVisibleItems() {
  updateFilterButtons();
  const visibleItems = applyFilters(allItems);
  updateMapMarkers(visibleItems);

  if (activeDetailItem) {
    const freshItem = allItems.find((item) => item.id === activeDetailItem.id);
    if (!freshItem || isItemExpired(freshItem)) {
      closeDetailModal();
      return;
    }

    activeDetailItem = freshItem;
    if (!detailModal.hidden) openDetailModal(freshItem);
  }
}

async function loadVerifiedItemIds() {
  if (!sb || !currentUser) return;

  const { data, error } = await sb
    .from('item_verifications')
    .select('item_id')
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('loadVerifiedItemIds failed:', error);
    return;
  }

  verifiedItemIds = new Set((data || []).map((row) => row.item_id));
  if (activeDetailItem) syncDetailVerifyState();
}

async function loadItems() {
  if (!sb) return;

  const { data, error } = await sb
    .from('items')
    .select('id, title, color, condition, created_at, is_available, image_url, lat, lng, confirm_count, expires_at, gone_reported')
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    console.error('loadItems failed:', error);
    return;
  }

  allItems = (data || []).map(normalizeItem);
  renderVisibleItems();
}

function subscribeToItemChanges() {
  if (!sb?.channel || itemsSubscription) return;

  itemsSubscription = sb
    .channel('public:items-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items' },
      async () => {
        await loadItems();
      }
    )
    .subscribe();
}

function resetPhotoPreview() {
  if (photoPreviewUrl) {
    URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = null;
  }
  addPhotoImage.removeAttribute('src');
  addPhotoImage.hidden = true;
  addPhotoEmpty.hidden = false;
  retakePhotoBtn.hidden = true;
}

function handlePhotoPreview() {
  const file = photoInput.files?.[0];
  if (!file) {
    resetPhotoPreview();
    return;
  }
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = URL.createObjectURL(file);
  addPhotoImage.src = photoPreviewUrl;
  addPhotoImage.hidden = false;
  addPhotoEmpty.hidden = true;
  retakePhotoBtn.hidden = false;
}

function hasAtLeastOneSelection() {
  return Boolean(titleInput.value.trim() || colorInput.value.trim() || materialInput.value.trim() || conditionInput.value.trim());
}

function updateSubmitState() {
  const enabled = hasAtLeastOneSelection();
  submitAddBtn.disabled = !enabled;
  submitAddBtn.classList.toggle('is-disabled', !enabled);
}

function setLineValue(buttonEl, textEl, value, placeholder) {
  const hasValue = Boolean((value || '').trim());
  textEl.textContent = hasValue ? value : placeholder;
  textEl.classList.toggle('is-placeholder', !hasValue);
  buttonEl.classList.toggle('is-selected', hasValue);
}

function syncAddUI() {
  setLineValue(pickTitleBtn, pickTitleValue, titleInput.value, 'What is it?');
  setLineValue(pickColorBtn, pickColorValue, colorInput.value, 'Color');
  setLineValue(pickMaterialBtn, pickMaterialValue, materialInput.value, 'Material');
  setLineValue(pickConditionBtn, pickConditionValue, conditionInput.value, 'Condition');
  updateSubmitState();
  refreshDraftMarkerLabel();
}

function openPicker(config) {
  currentPicker = config;
  pickerSheet.hidden = false;
  pickerSearchWrap.hidden = !config.searchable;

  if (config.searchable) {
    primeInputForQuickReplace(pickerSearchInput, config.initialQuery || config.input.value || '');
    pickerSearchInput.placeholder = config.placeholder || '';
    pickerSearchInput.maxLength = config.maxLength || 200;
    renderPickerOptions(config, pickerSearchInput.value);
    setTimeout(() => pickerSearchInput.focus(), 20);
  } else {
    renderPickerOptions(config, '');
  }
}

function closePicker() {
  pickerSheet.hidden = true;
  currentPicker = null;
}

function renderPickerOptions(config, query = '') {
  let options = config.options;
  let html = '';
  const rawQuery = query || '';

  if (config.searchable) {
    const q = rawQuery.trim().toLowerCase();

    if (config.requireQuery && !q) {
      pickerOptions.innerHTML = '';
      return;
    }

    options = options.filter((item) => item.toLowerCase().includes(q));

    if (config.allowCustom) {
      const normalizedCustom = normalizeCustomTitle(rawQuery);
      const matchesExisting = config.options.some(
        (item) => item.toLowerCase() === normalizedCustom
      );

      if (normalizedCustom && !matchesExisting) {
        if (isValidCustomTitle(normalizedCustom)) {
          html += `
            <button class="picker-option picker-option--custom" type="button" data-custom-value="${escapeHtml(normalizedCustom)}">
              use “${escapeHtml(normalizedCustom)}”
            </button>
          `;
        } else {
          html += `
            <div class="picker-option" aria-disabled="true">
              ${escapeHtml(getTitleValidationMessage(normalizedCustom))}
            </div>
          `;
        }
      }
    }
  }

  if (!options.length && !html) {
    pickerOptions.innerHTML = '<div class="picker-option">No matches</div>';
    return;
  }

  html += options.map((item) => {
    const isSelected = item.toLowerCase() === (config.input.value || '').trim().toLowerCase();
    return `<button class="picker-option${isSelected ? ' is-selected' : ''}" type="button" data-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
  }).join('');

  pickerOptions.innerHTML = html;
}

function applyPickerValue(value) {
  if (!currentPicker) return;
  currentPicker.input.value = value;
  syncAddUI();
  closePicker();
}

function promptCameraCapture() {
  try {
    photoInput.click();
  } catch (error) {
    console.error('camera open failed', error);
  }
}

function openAddModal() {
  addModal.hidden = false;
  syncAddUI();
  clearAISuggestions();
  setTimeout(() => map.invalidateSize(), 40);
  useCurrentLocation({ silent: true });
  promptCameraCapture();
}

function closeAddModal() {
  addModal.hidden = true;
  closePicker();
  closeObjectSheet();
  closeColorSheet();
  closeMaterialSheet();
  if (formStatus) formStatus.textContent = '';
}

function resetAddForm() {
  form.reset();
  latInput.value = '';
  lngInput.value = '';
  resetPhotoPreview();
  clearAISuggestions();
  syncAddUI();
  if (draftMarker) {
    map.removeLayer(draftMarker);
    draftMarker = null;
  }
}

async function uploadPhoto(file) {
  if (!file || !file.size) return null;
  if (!currentUser) throw new Error('No authenticated user for upload.');

  const resizedBlob = await resizeImage(file, 1200, 0.8);
  if (!resizedBlob) throw new Error('Could not prepare image for upload.');

  const path = `${currentUser.id}/${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await sb.storage.from('item-photos').upload(path, resizedBlob, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg'
  });
  if (uploadError) throw uploadError;

  const { data } = sb.storage.from('item-photos').getPublicUrl(path);
  return data.publicUrl;
}

async function handleSubmit() {
  if (!currentUser) {
    if (formStatus) formStatus.textContent = 'No user session yet.';
    return;
  }
  if (!hasAtLeastOneSelection()) {
    if (formStatus) formStatus.textContent = 'Pick at least one filter.';
    return;
  }

  const normalizedTitle = normalizeCustomTitle(titleInput.value);

  if (!isValidCustomTitle(normalizedTitle)) {
    if (formStatus) formStatus.textContent = getTitleValidationMessage(normalizedTitle);
    return;
  }

  const title = normalizedTitle || 'item';
  const color = combineColorMaterial(colorInput.value, materialInput.value) || null;
  const condition = conditionInput.value.trim() || null;
  const photoFile = photoInput.files?.[0] || null;
  const lat = latInput.value ? Number(latInput.value) : null;
  const lng = lngInput.value ? Number(lngInput.value) : null;

  if (formStatus) formStatus.textContent = 'Posting…';
  let imageUrl = null;

  try {
    imageUrl = await uploadPhoto(photoFile);
  } catch (error) {
    console.error(error);
    if (formStatus) formStatus.textContent = `Photo upload failed: ${error.message}`;
    return;
  }

  const payload = {
    created_by: currentUser.id,
    title,
    color,
    condition,
    description: null,
    category: null,
    borough: null,
    neighborhood: null,
    source: 'manual',
    is_available: true,
    image_url: imageUrl,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    confirm_count: 0,
    gone_reported: false,
    expires_at: new Date(Date.now() + ONE_WEEK_MS).toISOString()
  };

  const { error } = await sb.from('items').insert([payload]);
  if (error) {
    console.error(error);
    if (formStatus) formStatus.textContent = error.message;
    return;
  }

  if (formStatus) formStatus.textContent = 'Posted.';
  closeAddModal();
  resetAddForm();
  await loadItems();
}

async function handleStillThere() {
  if (!activeDetailItem || !currentUser) return;

  const alreadyVerified = verifiedItemIds.has(activeDetailItem.id);
  const wasGone = Boolean(activeDetailItem.gone_reported);

  if (alreadyVerified && !wasGone) {
    syncDetailVerifyState();
    return;
  }

  detailStillBtn.disabled = true;
  detailHeroStillBtn.disabled = true;
  detailStillBtn.textContent = 'saving…';
  detailHeroStillBtn.textContent = 'saving…';

  const { data, error } = await sb.rpc('verify_item_still_there', {
    p_item_id: activeDetailItem.id,
    p_user_id: currentUser.id
  });

  if (error) {
    console.error('verify failed:', error);

    detailStillBtn.disabled = false;
    detailHeroStillBtn.disabled = false;
    detailStillBtn.textContent = 'try again';
    detailHeroStillBtn.textContent = 'try again';
    return;
  }

  if (!alreadyVerified) {
    verifiedItemIds.add(activeDetailItem.id);
  }

  const result = data || {};
  const nextCount = Number(
    result.confirm_count ??
    (alreadyVerified ? activeDetailItem.confirm_count ?? 0 : (activeDetailItem.confirm_count ?? 0) + 1)
  );

  const nextExpiresAt =
    result.expires_at ||
    new Date(
      Math.max(parseDateMs(activeDetailItem.expires_at) || 0, Date.now()) + TWO_DAYS_MS
    ).toISOString();

  activeDetailItem = {
    ...activeDetailItem,
    confirm_count: nextCount,
    gone_reported: false,
    expires_at: nextExpiresAt
  };

  allItems = allItems.map((item) =>
    item.id === activeDetailItem.id
      ? { ...item, confirm_count: nextCount, gone_reported: false, expires_at: nextExpiresAt }
      : item
  );

  if (detailCount) detailCount.textContent = String(nextCount);
  syncDetailVerifyState();
  renderVisibleItems();
}

async function handleGone() {
  if (!activeDetailItem || !currentUser) return;
  if (activeDetailItem.gone_reported) {
    syncDetailVerifyState();
    return;
  }

  detailGoneBtn.disabled = true;
  detailGoneBtn.textContent = 'saving…';

  const { data, error } = await sb.rpc('mark_item_gone', {
    p_item_id: activeDetailItem.id,
    p_user_id: currentUser.id
  });

  if (error) {
    console.error('mark gone failed:', error);
    detailGoneBtn.disabled = false;
    detailGoneBtn.textContent = 'try again';
    return;
  }

  const nextGoneReported = Boolean(data?.gone_reported ?? true);

  activeDetailItem = {
    ...activeDetailItem,
    gone_reported: nextGoneReported
  };

  allItems = allItems.map((item) =>
    item.id === activeDetailItem.id ? { ...item, gone_reported: nextGoneReported } : item
  );

  detailGoneBtn.disabled = false;
  detailGoneBtn.textContent = 'gone';
  syncDetailVerifyState();
  renderVisibleItems();
}


function setAIThinkingState(isThinking) {
  aiInFlight = isThinking;
  if (aiThinking) aiThinking.hidden = !isThinking;

  [pickTitleBtn, pickColorBtn, pickMaterialBtn, pickConditionBtn, retakePhotoBtn].forEach((button) => {
    if (!button) return;
    button.disabled = isThinking;
    button.classList.toggle('is-disabled', isThinking);
  });

  if (aiThinkingSkipBtn) {
    aiThinkingSkipBtn.disabled = !isThinking;
  }

  if (isThinking) {
    closeObjectSheet();
    closeColorSheet();
    closeMaterialSheet();
  }
}

function skipAIThinking() {
  if (!aiInFlight) return;
  aiRequestSequence += 1;
  setAIThinkingState(false);
  openObjectSheet();
}


function clearAISuggestions() {
  setAIThinkingState(false);
  aiLastResult = null;
  if (objectAiWrap) objectAiWrap.hidden = true;
  if (objectAiSuggestions) objectAiSuggestions.innerHTML = '';
  if (colorAiWrap) colorAiWrap.hidden = true;
  if (colorAiApply) colorAiApply.textContent = '';
  if (materialAiWrap) materialAiWrap.hidden = true;
  if (materialAiSuggestions) materialAiSuggestions.innerHTML = '';
}

function setAIStatus() {}

function renderSuggestionButtons(container, values, onChoose, selectedValue = '') {
  if (!container) return;

  const selected = String(selectedValue || '').trim().toLowerCase();
  container.innerHTML = (values || []).map((value) => {
    const normalized = String(value || '').trim().toLowerCase();
    const isSelected = normalized && normalized === selected;
    return `
      <button class="smart-chip${isSelected ? ' is-selected' : ''}" type="button" data-ai-value="${escapeHtml(value)}">
        ${escapeHtml(value)}
      </button>
    `;
  }).join('');

  container.querySelectorAll('[data-ai-value]').forEach((button) => {
    button.addEventListener('click', () => {
      onChoose(button.dataset.aiValue || '');
    });
  });
}

function normalizeAIResponse(data) {
  const objectSuggestions = Array.isArray(data?.objectSuggestions)
    ? data.objectSuggestions.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean)
    : [];

  const materialSuggestions = Array.isArray(data?.materialSuggestions)
    ? data.materialSuggestions.map((v) => String(v || '').trim().toLowerCase()).filter(Boolean)
    : [];

  const colorSuggestion = String(data?.colorSuggestion || '').trim().toLowerCase();

  return {
    objectSuggestions: [...new Set(objectSuggestions)].slice(0, 3),
    materialSuggestions: [...new Set(materialSuggestions)].slice(0, 3),
    colorSuggestion
  };
}

function parseColorMaterial(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return { color: '', material: '' };

  const material = MATERIAL_LIST.find((item) => raw.split(/\s+/).includes(item)) || '';
  let color = raw;

  if (material) {
    color = raw.replace(material, '').replace(/\s+/g, ' ').trim();
  }

  if (color && !COLOR_LIST.includes(color)) {
    color = '';
  }

  return { color, material };
}

function combineColorMaterial(colorName = '', materialName = '') {
  const parts = [String(colorName || '').trim(), String(materialName || '').trim()].filter(Boolean);
  return [...new Set(parts)].join(' ');
}

function hslToCss(h, s, l) {
  return `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

function setColorPickerFromName(name = '') {
  const normalized = String(name || '').trim().toLowerCase();
  const preset = COLOR_NAME_PRESETS[normalized] || COLOR_NAME_PRESETS.cream;
  colorPickerState = { ...preset };
  selectedColorName = normalized || nearestColorNameFromState();
}

function nearestColorNameFromState() {
  const { hue, saturation, lightness } = colorPickerState;

  if (lightness >= 0.95) return 'white';
  if (lightness <= 0.12 && saturation <= 0.22) return 'black';
  if (saturation <= 0.08) {
    if (lightness < 0.38) return 'gray';
    if (lightness < 0.68) return 'silver';
    return 'white';
  }

  if (lightness > 0.88 && hue >= 38 && hue <= 62) return 'cream';
  if (lightness > 0.8 && hue >= 30 && hue <= 58) return 'beige';
  if (lightness > 0.62 && hue >= 24 && hue <= 42) return 'tan';
  if (hue < 12 || hue >= 345) return 'red';
  if (hue < 42) return lightness < 0.45 ? 'brown' : 'orange';
  if (hue < 72) return 'yellow';
  if (hue < 165) return 'green';
  if (hue < 255) return 'blue';
  if (hue < 310) return 'purple';
  return 'pink';
}

function updateColorWheelUI() {
  if (!colorWheel || !colorWheelKnob) return;

  const radius = colorWheel.clientWidth / 2;
  const angle = (colorPickerState.hue - 90) * (Math.PI / 180);
  const distance = radius * Math.max(0.08, Math.min(0.98, colorPickerState.saturation));
  const x = radius + Math.cos(angle) * distance;
  const y = radius + Math.sin(angle) * distance;

  colorWheelKnob.style.left = `${x}px`;
  colorWheelKnob.style.top = `${y}px`;

  if (colorLightness) {
    colorLightness.value = String(Math.round(colorPickerState.lightness * 100));
    colorLightness.style.setProperty('--track-color', hslToCss(colorPickerState.hue, colorPickerState.saturation, colorPickerState.lightness));
  }

  selectedColorName = nearestColorNameFromState();

  if (colorPreviewSwatch) {
    colorPreviewSwatch.style.background = hslToCss(colorPickerState.hue, colorPickerState.saturation, colorPickerState.lightness);
  }
}

function setColorFromPointer(clientX, clientY) {
  if (!colorWheel) return;
  const rect = colorWheel.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const radius = rect.width / 2;
  const distance = Math.min(radius, Math.sqrt(dx * dx + dy * dy));
  const angle = Math.atan2(dy, dx);
  const hue = ((angle * 180 / Math.PI) + 90 + 360) % 360;
  const saturation = Math.min(1, Math.max(0.08, distance / radius));

  colorPickerState.hue = hue;
  colorPickerState.saturation = saturation;
  updateColorWheelUI();
}

function renderObjectSheet() {
  if (!objectSearchInput || !objectOptions) return;

  const query = objectSearchInput.value.trim().toLowerCase();
  const filtered = OBJECT_LIST.filter((item) => item.includes(query));
  const current = titleInput.value.trim().toLowerCase();

  if (objectAiWrap) {
    const suggestions = aiLastResult?.objectSuggestions || [];
    objectAiWrap.hidden = !suggestions.length;
    renderSuggestionButtons(objectAiSuggestions, suggestions, (value) => {
      titleInput.value = value;
      syncAddUI();
      objectSearchInput.value = value;
      renderObjectSheet();
      closeObjectSheet();
    }, current);
  }

  const matchesExisting = OBJECT_LIST.includes(query);
  let html = '';

  if (query && !matchesExisting && isValidCustomTitle(query)) {
    html += `<button class="smart-option smart-option--custom" type="button" data-object-value="${escapeHtml(query)}">${escapeHtml(query)}</button>`;
  }

  html += filtered.map((item) => {
    const selectedClass = item === current ? ' is-selected' : '';
    return `<button class="smart-option${selectedClass}" type="button" data-object-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
  }).join('');

  if (!html) {
    html = '<div class="smart-option smart-option--empty">No matches</div>';
  }

  objectOptions.innerHTML = html;
}

function openObjectSheet() {
  if (aiInFlight) return;
  if (!objectSheet || !objectSearchInput) return;
  objectSheet.hidden = false;
  primeInputForQuickReplace(objectSearchInput, titleInput.value || '');
  renderObjectSheet();
  setTimeout(() => objectSearchInput.focus(), 30);
}

function closeObjectSheet() {
  if (objectSheet) objectSheet.hidden = true;
}

function renderMaterialOptions() {
  if (!materialOptions || !materialSearchInput) return;

  const query = materialSearchInput.value.trim().toLowerCase();
  const filtered = MATERIAL_LIST.filter((item) => item.includes(query));

  if (materialAiWrap) {
    const suggestions = aiLastResult?.materialSuggestions || [];
    materialAiWrap.hidden = !suggestions.length;
    renderSuggestionButtons(materialAiSuggestions, suggestions, (value) => {
      selectedMaterialName = value;
      materialSearchInput.value = value;
      renderMaterialOptions();
    }, selectedMaterialName);
  }

  let html = filtered.map((item) => {
    const selectedClass = item === selectedMaterialName ? ' is-selected' : '';
    return `<button class="smart-option${selectedClass}" type="button" data-material-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
  }).join('');

  if (query && !MATERIAL_LIST.includes(query)) {
    html = `<button class="smart-option smart-option--custom" type="button" data-material-value="${escapeHtml(query)}">${escapeHtml(query)}</button>` + html;
  }

  if (!html) html = '<div class="smart-option smart-option--empty">No matches</div>';
  materialOptions.innerHTML = html;
}

function renderColorSheet() {
  if (colorAiWrap && colorAiApply) {
    const colorSuggestion = aiLastResult?.colorSuggestion || '';
    colorAiWrap.hidden = !colorSuggestion;
    colorAiApply.textContent = colorSuggestion;
    colorAiApply.classList.toggle('is-selected', colorSuggestion && colorSuggestion === selectedColorName);
  }

  updateColorWheelUI();
}

function openColorSheet() {
  if (aiInFlight) return;
  if (!colorSheet) return;
  colorSheet.hidden = false;

  selectedColorName = colorInput.value.trim().toLowerCase() || aiLastResult?.colorSuggestion || 'cream';
  setColorPickerFromName(selectedColorName);
  renderColorSheet();
}

function closeColorSheet() {
  if (colorSheet) colorSheet.hidden = true;
}

function commitColorSheet() {
  if (aiInFlight) return;
  colorInput.value = selectedColorName;
  syncAddUI();
  closeColorSheet();
}

function openMaterialSheet() {
  if (aiInFlight) return;
  if (!materialSheet) return;
  materialSheet.hidden = false;
  selectedMaterialName = materialInput.value.trim().toLowerCase();
  primeInputForQuickReplace(materialSearchInput, materialInput.value || '');
  renderMaterialOptions();
  setTimeout(() => materialSearchInput?.focus(), 30);
}

function closeMaterialSheet() {
  if (materialSheet) materialSheet.hidden = true;
}

function commitMaterialSheet() {
  if (aiInFlight) return;
  materialInput.value = selectedMaterialName;
  syncAddUI();
  closeMaterialSheet();
}

function refreshAIStageVisibility() {
  renderObjectSheet();
  renderColorSheet();
  renderMaterialOptions();
}

function applyAISuggestions(ai) {
  const normalized = normalizeAIResponse(ai);
  aiLastResult = normalized;

  if (!titleInput.value.trim() && normalized.objectSuggestions.length) {
    titleInput.value = normalized.objectSuggestions[0];
  }

  const currentColor = colorInput.value.trim().toLowerCase();
  const currentMaterial = materialInput.value.trim().toLowerCase();

  if (!currentColor && normalized.colorSuggestion) {
    selectedColorName = normalized.colorSuggestion;
    colorInput.value = normalized.colorSuggestion;
  } else if (currentColor) {
    selectedColorName = currentColor;
  }

  if (!currentMaterial && normalized.materialSuggestions.length) {
    selectedMaterialName = normalized.materialSuggestions[0];
    materialInput.value = normalized.materialSuggestions[0];
  } else if (currentMaterial) {
    selectedMaterialName = currentMaterial;
  }
  syncAddUI();
  refreshAIStageVisibility();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Could not convert image to base64.'));
        return;
      }
      resolve(base64);
    };

    reader.onerror = () => {
      reject(reader.error || new Error('Could not read image.'));
    };

    reader.readAsDataURL(blob);
  });
}

async function getAISuggestionsFromBlob(blob) {
  const imageBase64 = await blobToBase64(blob);

  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      imageBase64,
      mimeType: 'image/jpeg',
      objectOptions: OBJECT_LIST,
      materialOptions: MATERIAL_LIST
    })
  });

  let data = null;
  try {
    data = await res.json();
  } catch (error) {
    throw new Error('AI response was not valid JSON.');
  }

  if (!res.ok) {
    throw new Error(data?.error || 'AI tagging failed.');
  }

  return data;
}

async function runAIForPhoto(file) {
  if (!file || aiInFlight) return;

  const requestId = ++aiRequestSequence;
  clearAISuggestions();
  setAIThinkingState(true);

  try {
    const resizedBlob = await resizeImage(file, 1200, 0.82);
    const ai = await getAISuggestionsFromBlob(resizedBlob);

    if (requestId !== aiRequestSequence) {
      return;
    }

    applyAISuggestions(ai);
  } catch (error) {
    if (requestId === aiRequestSequence) {
      console.error('AI tagging failed:', error);
    }
  } finally {
    if (requestId === aiRequestSequence) {
      setAIThinkingState(false);
    }
  }
}

async function handlePhotoChange() {
  handlePhotoPreview();

  const file = photoInput.files?.[0];
  if (!file) {
    clearAISuggestions();
    syncAddUI();
    return;
  }

  await runAIForPhoto(file);
}

function attachEvents() {
  if (splashGoBtn) {
    splashGoBtn.addEventListener('click', dismissSplashScreen);
  }

  if (installContinueBtn) {
    installContinueBtn.addEventListener('click', dismissInstallSplash);
  }

  if (hereBtn) {
    hereBtn.addEventListener('click', moveMapToCurrentLocation);
    hereBtn.addEventListener('touchend', (event) => {
      event.preventDefault();
      moveMapToCurrentLocation();
    }, { passive: false });
  }

  openAddBtn.addEventListener('click', openAddModal);
  closeAddBtn.addEventListener('click', closeAddModal);
  modalBackdrop.addEventListener('click', closeAddModal);
  submitAddBtn.addEventListener('click', handleSubmit);

  retakePhotoBtn.addEventListener('click', promptCameraCapture);
  photoInput.addEventListener('change', handlePhotoChange);
  aiThinkingSkipBtn?.addEventListener('click', skipAIThinking);

  pickTitleBtn.addEventListener('click', openObjectSheet);

  pickColorBtn.addEventListener('click', openColorSheet);
  pickMaterialBtn.addEventListener('click', openMaterialSheet);

  pickConditionBtn.addEventListener('click', () => {
    openPicker({
      key: 'condition',
      input: conditionInput,
      options: CONDITION_LIST,
      searchable: false,
      placeholder: ''
    });
  });

  clearInputOnFirstClick(pickerSearchInput, () => {
    if (!currentPicker) return;
    renderPickerOptions(currentPicker, '');
  });

  pickerSearchInput.addEventListener('input', () => {
    pickerSearchInput.dataset.autoclearReady = 'false';
    if (!currentPicker) return;
    renderPickerOptions(currentPicker, pickerSearchInput.value);
  });

  pickerOptions.addEventListener('click', (event) => {
    const customButton = event.target.closest('[data-custom-value]');
    if (customButton) {
      applyPickerValue(customButton.dataset.customValue || '');
      return;
    }

    const button = event.target.closest('[data-value]');
    if (!button) return;
    applyPickerValue(button.dataset.value || '');
  });

  pickerSheet.addEventListener('click', (event) => {
    if (event.target === pickerSheet) closePicker();
  });

  clearInputOnFirstClick(objectSearchInput, renderObjectSheet);

  objectSearchInput?.addEventListener('input', () => {
    objectSearchInput.dataset.autoclearReady = 'false';
    renderObjectSheet();
  });
  objectOptions?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-object-value]');
    if (!button) return;
    titleInput.value = button.dataset.objectValue || '';
    syncAddUI();
    closeObjectSheet();
  });

  clearInputOnFirstClick(materialSearchInput, renderMaterialOptions);

  materialSearchInput?.addEventListener('input', () => {
    materialSearchInput.dataset.autoclearReady = 'false';
    renderMaterialOptions();
  });
  materialOptions?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-material-value]');
    if (!button) return;
    selectedMaterialName = button.dataset.materialValue || '';
    materialSearchInput.value = selectedMaterialName;
    renderMaterialOptions();
  });

  materialSheetDoneBtn?.addEventListener('click', commitMaterialSheet);

  colorAiApply?.addEventListener('click', () => {
    selectedColorName = aiLastResult?.colorSuggestion || selectedColorName;
    setColorPickerFromName(selectedColorName);
    renderColorSheet();
  });

  colorSheetDoneBtn?.addEventListener('click', commitColorSheet);

  colorLightness?.addEventListener('input', (event) => {
    colorPickerState.lightness = Number(event.target.value) / 100;
    updateColorWheelUI();
  });

  if (colorWheel) {
    let draggingColor = false;

    const handleMove = (clientX, clientY) => {
      if (!draggingColor) return;
      setColorFromPointer(clientX, clientY);
    };

    colorWheel.addEventListener('pointerdown', (event) => {
      draggingColor = true;
      colorWheel.setPointerCapture?.(event.pointerId);
      setColorFromPointer(event.clientX, event.clientY);
    });

    colorWheel.addEventListener('pointermove', (event) => {
      handleMove(event.clientX, event.clientY);
    });

    const stopDragging = () => {
      draggingColor = false;
    };

    colorWheel.addEventListener('pointerup', stopDragging);
    colorWheel.addEventListener('pointercancel', stopDragging);
  }

  objectSheet?.addEventListener('click', (event) => {
    if (event.target === objectSheet) closeObjectSheet();
  });

  colorSheet?.addEventListener('click', (event) => {
    if (event.target === colorSheet) closeColorSheet();
  });

  materialSheet?.addEventListener('click', (event) => {
    if (event.target === materialSheet) closeMaterialSheet();
  });

  titleInput.addEventListener('input', () => {
    syncAddUI();
    refreshAIStageVisibility();
  });

  colorInput.addEventListener('input', syncAddUI);
  materialInput.addEventListener('input', syncAddUI);
  conditionInput.addEventListener('input', syncAddUI);

  mapSearchInput.addEventListener('input', (event) => {
    currentSearch = event.target.value.trim();
    renderVisibleItems();
  });

  filterAllBtn.addEventListener('click', () => {
    currentFilter = 'all';
    renderVisibleItems();
  });

  filterNewBtn.addEventListener('click', () => {
    currentFilter = currentFilter === 'new' ? 'all' : 'new';
    renderVisibleItems();
  });

  filterVerifiedBtn.addEventListener('click', () => {
    currentFilter = currentFilter === 'verified' ? 'all' : 'verified';
    renderVisibleItems();
  });

  detailCloseBtn.addEventListener('click', closeDetailModal);
  detailBackdrop.addEventListener('click', closeDetailModal);

  detailStillBtn.addEventListener('click', handleStillThere);
  detailHeroStillBtn.addEventListener('click', handleStillThere);
  detailGoneBtn.addEventListener('click', handleGone);

  detailReportBtn.addEventListener('click', () => {
    console.log('report clicked', activeDetailItem);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && objectSheet && !objectSheet.hidden) {
      closeObjectSheet();
      return;
    }
    if (event.key === 'Escape' && colorSheet && !colorSheet.hidden) {
      closeColorSheet();
      return;
    }
    if (event.key === 'Escape' && materialSheet && !materialSheet.hidden) {
      closeMaterialSheet();
      return;
    }
    if (event.key === 'Escape' && !pickerSheet.hidden) {
      closePicker();
      return;
    }
    if (event.key === 'Escape' && !addModal.hidden) {
      closeAddModal();
      return;
    }
    if (event.key === 'Escape' && !detailModal.hidden) {
      closeDetailModal();
    }
  });
}

function startExpirationRefreshLoop() {
  if (expirationRefreshTimer) {
    clearInterval(expirationRefreshTimer);
  }

  expirationRefreshTimer = setInterval(() => {
    renderVisibleItems();
  }, 60 * 1000);
}

async function init() {
  configureLaunchSplash();
  initMap();
  attachEvents();
  resetAddForm();
  startExpirationRefreshLoop();

  const signedIn = await ensureAnonymousSession();
  if (!signedIn) return;

  await Promise.all([
    loadVerifiedItemIds(),
    loadItems()
  ]);

  subscribeToItemChanges();
}

init();