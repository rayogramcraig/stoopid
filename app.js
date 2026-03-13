const sb = window.supabaseClient;

const userPill = document.getElementById('user-pill');

const form = document.getElementById('item-form');
const formStatus = document.getElementById('form-status');

const titleInput = document.getElementById('title');
const colorInput = document.getElementById('color');
const conditionInput = document.getElementById('condition');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const photoInput = document.getElementById('photo');

const openAddBtn = document.getElementById('open-add-btn');
const closeAddBtn = document.getElementById('close-add-btn');
const submitAddBtn = document.getElementById('submit-add-btn');
const addModal = document.getElementById('add-modal');
const modalBackdrop = document.getElementById('modal-backdrop');

const addPhotoImage = document.getElementById('add-photo-image');
const addPhotoEmpty = document.getElementById('add-photo-empty');
const retakePhotoBtn = document.getElementById('retake-photo-btn');

const pickTitleBtn = document.getElementById('pick-title-btn');
const pickColorBtn = document.getElementById('pick-color-btn');
const pickConditionBtn = document.getElementById('pick-condition-btn');

const pickTitleValue = document.getElementById('pick-title-value');
const pickColorValue = document.getElementById('pick-color-value');
const pickConditionValue = document.getElementById('pick-condition-value');

const pickerSheet = document.getElementById('picker-sheet');
const pickerSearchWrap = document.getElementById('picker-search-wrap');
const pickerSearchInput = document.getElementById('picker-search-input');
const pickerOptions = document.getElementById('picker-options');

const mapSearchInput = document.getElementById('map-search');
const filterAllBtn = document.getElementById('filter-all-btn');
const filterNewBtn = document.getElementById('filter-new-btn');
const filterVerifiedBtn = document.getElementById('filter-verified-btn');

const detailModal = document.getElementById('detail-modal');
const detailBackdrop = document.getElementById('detail-backdrop');
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
let activeItemId = null;
let activeDetailItem = null;

const DEFAULT_CENTER = [40.741, -73.989];
const DEFAULT_ZOOM = 12;

const OBJECT_LIST = [
  'air conditioner',
  'armchair',
  'art',
  'bar stool',
  'beach chair',
  'bench',
  'bike',
  'bookcase',
  'bookshelf',
  'cabinet',
  'camping chair',
  'chair',
  'coffee table',
  'couch',
  'crate',
  'desk',
  'desk chair',
  'dining chair',
  'dining table',
  'door',
  'dresser',
  'fan',
  'folding chair',
  'frame',
  'headboard',
  'heater',
  'lamp',
  'lawn chair',
  'lounge chair',
  'mattress',
  'media console',
  'mirror',
  'nightstand',
  'office chair',
  'ottoman',
  'patio chair',
  'planter',
  'plant',
  'rocking chair',
  'rug',
  'shelf',
  'side table',
  'sofa',
  'stool',
  'storage bin',
  'swivel chair',
  'table',
  'tv',
  'tv stand',
  'wheel chair',
  'window'
];

const COLOR_LIST = [
  'black',
  'white',
  'gray',
  'silver',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'brown',
  'tan',
  'beige',
  'cream',
  'clear',
  'wood',
  'metal',
  'chrome',
  'steel',
  'brass',
  'cane',
  'wicker',
  'rattan',
  'plastic',
  'glass',
  'leather',
  'fabric',
  'velvet'
];

const CONDITION_LIST = [
  'Perfect',
  'Great',
  'Good',
  'Rough',
  'Salvage'
];

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setAuthError(message = 'Auth error') {
  console.error(message);
  userPill.textContent = message;
}

function renderUser() {
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
      console.error('getSession failed:', sessionError);
      setAuthError('Auth error');
      return false;
    }

    if (!sessionData?.session) {
      const { data: signInData, error: signInError } = await sb.auth.signInAnonymously();

      if (signInError) {
        console.error('signInAnonymously failed:', signInError);
        setAuthError('Auth error');
        return false;
      }

      currentUser = signInData?.user ?? signInData?.session?.user ?? null;
    } else {
      currentUser = sessionData.session.user ?? null;
    }

    if (!currentUser) {
      const { data: userData, error: userError } = await sb.auth.getUser();

      if (userError) {
        console.error('getUser failed:', userError);
        setAuthError('Auth error');
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
    console.error('ensureAnonymousSession unexpected error:', error);
    setAuthError('Auth error');
    return false;
  }
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
  map = L.map('map', {
    zoomControl: true
  }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

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
  formStatus.textContent = message;

  const label = (titleInput.value || 'new item').trim();

  if (!draftMarker) {
    draftMarker = L.marker([lat, lng], {
      icon: createLabeledIcon(label, ' is-draft')
    }).addTo(map);
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
    if (!silent) {
      formStatus.textContent = 'Geolocation is not supported in this browser.';
    }
    return;
  }

  if (!silent) {
    formStatus.textContent = 'Getting location…';
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setDraftLocation(lat, lng, silent ? 'Location ready.' : 'Location added.');

      if (!userMarker) {
        userMarker = L.marker([lat, lng], {
          icon: createLabeledIcon('you', ' is-user')
        }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      map.setView([lat, lng], 16);
    },
    (error) => {
      console.error(error);
      if (!silent) {
        formStatus.textContent = `Location failed: ${error.message}`;
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function applyFilters(items) {
  let filtered = [...items];

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter((item) => {
      return [item.title || '', item.color || '', item.condition || '']
        .some((value) => value.toLowerCase().includes(q));
    });
  }

  if (currentFilter === 'new') {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((item) => {
      const created = item.created_at ? new Date(item.created_at).getTime() : 0;
      return created >= twoDaysAgo;
    });
  }

  if (currentFilter === 'verified') {
    filtered = filtered.filter((item) => item.image_url);
  }

  return filtered;
}

function updateFilterButtons() {
  filterAllBtn.classList.toggle('is-active', currentFilter === 'all');
  filterNewBtn.classList.toggle('is-active', currentFilter === 'new');
  filterVerifiedBtn.classList.toggle('is-active', currentFilter === 'verified');
}

function updateMapMarkers(items) {
  itemsLayer.clearLayers();
  markersById = new Map();

  const bounds = [];

  items.forEach((item) => {
    if (
      typeof item.lat !== 'number' ||
      Number.isNaN(item.lat) ||
      typeof item.lng !== 'number' ||
      Number.isNaN(item.lng)
    ) {
      return;
    }

    const marker = L.marker([item.lat, item.lng], {
      icon: createLabeledIcon(item.title || 'item')
    });

    marker.on('click', () => {
      openDetailModal(item);
    });

    marker.addTo(itemsLayer);
    markersById.set(item.id, marker);
    bounds.push([item.lat, item.lng]);
  });

  if (bounds.length) {
    const latLngBounds = L.latLngBounds(bounds);
    map.fitBounds(latLngBounds, { padding: [60, 120], maxZoom: 16 });
  } else if (draftMarker) {
    map.setView(draftMarker.getLatLng(), 16);
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }
}

function renderVisibleItems() {
  const visibleItems = applyFilters(allItems);
  updateFilterButtons();
  updateMapMarkers(visibleItems);
}

async function loadItems() {
  const { data, error } = await sb
    .from('items')
    .select(`
      id,
      title,
      color,
      condition,
      created_at,
      is_available,
      image_url,
      lat,
      lng
    `)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('loadItems failed:', error);
    return;
  }

  allItems = (data || []).map((item) => ({
    ...item,
    lat: item.lat == null ? null : Number(item.lat),
    lng: item.lng == null ? null : Number(item.lng),
    confirm_count: item.confirm_count ?? 0
  }));

  renderVisibleItems();
}


function openDetailModal(item) {
  activeDetailItem = item;
  activeItemId = item.id ?? null;

  if (!detailModal) return;

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

  if (detailTitle) {
    detailTitle.textContent = (item.title || 'unknown item').toLowerCase();
  }

  if (detailColor) {
    detailColor.textContent = item.color || 'Unknown';
  }

  if (detailCondition) {
    detailCondition.textContent = item.condition || 'Unknown';
  }

  if (detailCount) {
    detailCount.textContent = String(item.confirm_count ?? 0);
  }

  detailModal.hidden = false;
}

function closeDetailModal() {
  if (!detailModal) return;
  detailModal.hidden = true;
  activeDetailItem = null;
  activeItemId = null;
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

  if (photoPreviewUrl) {
    URL.revokeObjectURL(photoPreviewUrl);
  }

  photoPreviewUrl = URL.createObjectURL(file);
  addPhotoImage.src = photoPreviewUrl;
  addPhotoImage.hidden = false;
  addPhotoEmpty.hidden = true;
  retakePhotoBtn.hidden = false;
}

function hasAtLeastOneSelection() {
  return Boolean(
    titleInput.value.trim() ||
    colorInput.value.trim() ||
    conditionInput.value.trim()
  );
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
  setLineValue(pickConditionBtn, pickConditionValue, conditionInput.value, 'Condition');
  updateSubmitState();
  refreshDraftMarkerLabel();
}

function openPicker(config) {
  currentPicker = config;
  pickerSheet.hidden = false;
  pickerSearchWrap.hidden = !config.searchable;

  if (config.searchable) {
    pickerSearchInput.value = config.initialQuery || config.input.value || '';
    pickerSearchInput.placeholder = config.placeholder || '';
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

  if (config.searchable) {
    const q = query.trim().toLowerCase();
    options = options.filter((item) => item.toLowerCase().includes(q));
  }

  if (!options.length) {
    pickerOptions.innerHTML = `<div class="picker-option">No matches</div>`;
    return;
  }

  pickerOptions.innerHTML = options
    .map((item) => {
      const isSelected = item.toLowerCase() === (config.input.value || '').trim().toLowerCase();
      return `
        <button
          class="picker-option${isSelected ? ' is-selected' : ''}"
          type="button"
          data-value="${escapeHtml(item)}"
        >
          ${escapeHtml(item)}
        </button>
      `;
    })
    .join('');
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
  setTimeout(() => map.invalidateSize(), 40);

  useCurrentLocation({ silent: true });
  promptCameraCapture();
}

function closeAddModal() {
  addModal.hidden = true;
  closePicker();
  formStatus.textContent = '';
}

function resetAddForm() {
  form.reset();
  latInput.value = '';
  lngInput.value = '';
  resetPhotoPreview();
  syncAddUI();

  if (draftMarker) {
    map.removeLayer(draftMarker);
    draftMarker = null;
  }
}

async function uploadPhoto(file) {
  if (!file || !file.size) {
    return null;
  }

  if (!currentUser) {
    throw new Error('No authenticated user for upload.');
  }

  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${currentUser.id}/${crypto.randomUUID()}.${safeExtension}`;

  const { error: uploadError } = await sb.storage
    .from('item-photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = sb.storage.from('item-photos').getPublicUrl(path);
  return data.publicUrl;
}

async function handleSubmit() {
  if (!currentUser) {
    formStatus.textContent = 'No user session yet.';
    return;
  }

  if (!hasAtLeastOneSelection()) {
    formStatus.textContent = 'Pick at least one filter.';
    return;
  }

  const title = titleInput.value.trim().toLowerCase() || 'item';
  const color = colorInput.value.trim() || null;
  const condition = conditionInput.value.trim() || null;
  const photoFile = photoInput.files?.[0] || null;
  const lat = latInput.value ? Number(latInput.value) : null;
  const lng = lngInput.value ? Number(lngInput.value) : null;

  formStatus.textContent = 'Posting…';

  let imageUrl = null;

  try {
    imageUrl = await uploadPhoto(photoFile);
  } catch (error) {
    console.error(error);
    formStatus.textContent = `Photo upload failed: ${error.message}`;
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
    lng: Number.isFinite(lng) ? lng : null
  };

  const { error } = await sb.from('items').insert([payload]);

  if (error) {
    console.error(error);
    formStatus.textContent = error.message;
    return;
  }

  formStatus.textContent = 'Posted.';
  closeAddModal();
  resetAddForm();
  await loadItems();
}

function attachEvents() {
  openAddBtn.addEventListener('click', openAddModal);
  closeAddBtn.addEventListener('click', closeAddModal);
  modalBackdrop.addEventListener('click', closeAddModal);
  submitAddBtn.addEventListener('click', handleSubmit);

  retakePhotoBtn.addEventListener('click', promptCameraCapture);
  photoInput.addEventListener('change', handlePhotoPreview);

  pickTitleBtn.addEventListener('click', () => {
    openPicker({
      key: 'title',
      input: titleInput,
      options: OBJECT_LIST,
      searchable: true,
      placeholder: 'Chair',
      initialQuery: titleInput.value
    });
  });

  pickColorBtn.addEventListener('click', () => {
    openPicker({
      key: 'color',
      input: colorInput,
      options: COLOR_LIST,
      searchable: true,
      placeholder: 'wood'
    });
  });

  pickConditionBtn.addEventListener('click', () => {
    openPicker({
      key: 'condition',
      input: conditionInput,
      options: CONDITION_LIST,
      searchable: false,
      placeholder: ''
    });
  });

  pickerSearchInput.addEventListener('input', () => {
    if (!currentPicker) return;
    renderPickerOptions(currentPicker, pickerSearchInput.value);
  });

  pickerOptions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-value]');
    if (!button) return;
    applyPickerValue(button.dataset.value || '');
  });

  pickerSheet.addEventListener('click', (event) => {
    if (event.target === pickerSheet) {
      closePicker();
    }
  });

  titleInput.addEventListener('input', syncAddUI);
  colorInput.addEventListener('input', syncAddUI);
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
    currentFilter = 'new';
    renderVisibleItems();
  });

  filterVerifiedBtn.addEventListener('click', () => {
    currentFilter = 'verified';
    renderVisibleItems();
  });

  if (detailCloseBtn) {
    detailCloseBtn.addEventListener('click', closeDetailModal);
  }

  if (detailBackdrop) {
    detailBackdrop.addEventListener('click', closeDetailModal);
  }

  if (detailStillBtn) {
    detailStillBtn.addEventListener('click', () => {
      console.log('still there clicked', activeDetailItem);
    });
  }

  if (detailGoneBtn) {
    detailGoneBtn.addEventListener('click', () => {
      console.log('gone clicked', activeDetailItem);
    });
  }

  if (detailReportBtn) {
    detailReportBtn.addEventListener('click', () => {
      console.log('report clicked', activeDetailItem);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !pickerSheet.hidden) {
      closePicker();
      return;
    }

    if (event.key === 'Escape' && !addModal.hidden) {
      closeAddModal();
      return;
    }

    if (event.key === 'Escape' && detailModal && !detailModal.hidden) {
      closeDetailModal();
    }
  });
}

async function init() {
  initMap();
  attachEvents();
  resetAddForm();

  const signedIn = await ensureAnonymousSession();
  if (!signedIn) return;

  await loadItems();
}

init();