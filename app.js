const sb = window.supabaseClient;

const userPill = document.getElementById('user-pill');
const form = document.getElementById('item-form');
const formStatus = document.getElementById('form-status');
const objectSuggestions = document.getElementById('object-suggestions');

const locateBtn = document.getElementById('locate-btn');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const locationStatus = document.getElementById('location-status');

const photoInput = document.getElementById('photo');
const photoPreviewWrap = document.getElementById('photo-preview-wrap');
const photoPreview = document.getElementById('photo-preview');

const openAddBtn = document.getElementById('open-add-btn');
const closeAddBtn = document.getElementById('close-add-btn');
const addModal = document.getElementById('add-modal');
const modalBackdrop = document.getElementById('modal-backdrop');

const mapSearchInput = document.getElementById('map-search');
const filterAllBtn = document.getElementById('filter-all-btn');
const filterNewBtn = document.getElementById('filter-new-btn');
const filterVerifiedBtn = document.getElementById('filter-verified-btn');

let currentUser = null;
let map = null;
let itemsLayer = null;
let draftMarker = null;
let userMarker = null;
let markersById = new Map();
let activeItemId = null;
let allItems = [];
let currentFilter = 'all';
let currentSearch = '';

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

function escapeHtml(str = '') {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderObjectSuggestions() {
  objectSuggestions.innerHTML = OBJECT_LIST
    .map((item) => `<option value="${escapeHtml(item)}"></option>`)
    .join('');
}

async function ensureAnonymousSession() {
  const { data: userData, error: getUserError } = await sb.auth.getUser();

  if (getUserError) {
    console.error(getUserError);
    userPill.textContent = 'Auth error';
    return;
  }

  if (userData?.user) {
    currentUser = userData.user;
    renderUser();
    return;
  }

  const { data, error } = await sb.auth.signInAnonymously();

  if (error) {
    console.error(error);
    userPill.textContent = 'Auth error';
    return;
  }

  currentUser = data.user;
  renderUser();
}

function renderUser() {
  if (!currentUser) {
    userPill.textContent = 'Not connected';
    return;
  }

  userPill.textContent = `anon ${currentUser.id.slice(0, 8)}`;
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

  map.on('click', (event) => {
    const { lat, lng } = event.latlng;
    setDraftLocation(lat, lng, 'Location set from map.');
  });

  setTimeout(() => map.invalidateSize(), 0);
}

function setDraftLocation(lat, lng, message = 'Location selected.') {
  latInput.value = Number(lat).toFixed(6);
  lngInput.value = Number(lng).toFixed(6);
  locationStatus.textContent = message;

  const titleValue = (document.getElementById('title').value || 'new item').trim();

  if (!draftMarker) {
    draftMarker = L.marker([lat, lng], {
      icon: createLabeledIcon(titleValue, ' is-draft')
    }).addTo(map);
  } else {
    draftMarker.setLatLng([lat, lng]);
    draftMarker.setIcon(createLabeledIcon(titleValue, ' is-draft'));
  }
}

function refreshDraftMarkerLabel() {
  if (!draftMarker) return;

  const titleValue = (document.getElementById('title').value || 'new item').trim();
  draftMarker.setIcon(createLabeledIcon(titleValue, ' is-draft'));
}

function clearDraftLocation() {
  latInput.value = '';
  lngInput.value = '';
  locationStatus.textContent = 'No location selected.';
  if (draftMarker) {
    map.removeLayer(draftMarker);
    draftMarker = null;
  }
}

async function useCurrentLocation() {
  if (!navigator.geolocation) {
    formStatus.textContent = 'Geolocation is not supported in this browser.';
    return;
  }

  formStatus.textContent = 'Getting location…';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setDraftLocation(lat, lng, 'Using your current location.');
      formStatus.textContent = 'Location added.';

      if (!userMarker) {
        userMarker = L.marker([lat, lng], {
          icon: createLabeledIcon('you', ' is-user')
        }).addTo(map);
      } else {
        userMarker.setLatLng([lat, lng]);
      }

      map.setView([lat, lng], 15);
    },
    (error) => {
      console.error(error);
      formStatus.textContent = `Location failed: ${error.message}`;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
}

function markerPopupHtml(item) {
  return `
    <strong>${escapeHtml(item.title || '')}</strong>
    ${item.color ? `<br>${escapeHtml(item.color)}` : ''}
    ${item.condition ? `<br>${escapeHtml(item.condition)}` : ''}
    ${item.image_url ? `<br><br><img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title || '')}" style="width:180px;max-width:100%;border-radius:12px;">` : ''}
  `;
}

function applyFilters(items) {
  let filtered = [...items];

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter((item) => {
      return [
        item.title || '',
        item.color || '',
        item.condition || ''
      ].some((value) => value.toLowerCase().includes(q));
    });
  }

  if (currentFilter === 'new') {
    const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
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

    marker.bindPopup(markerPopupHtml(item));

    marker.on('click', () => {
      activeItemId = item.id;
    });

    marker.addTo(itemsLayer);
    markersById.set(item.id, marker);
    bounds.push([item.lat, item.lng]);
  });

  if (bounds.length) {
    const latLngBounds = L.latLngBounds(bounds);
    map.fitBounds(latLngBounds, { padding: [60, 120], maxZoom: 16 });
  } else if (draftMarker) {
    map.setView(draftMarker.getLatLng(), 15);
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }
}

function focusItemOnMap(itemId) {
  const marker = markersById.get(itemId);
  activeItemId = itemId;

  if (marker) {
    map.setView(marker.getLatLng(), 16);
    marker.openPopup();
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
    console.error(error);
    return;
  }

  allItems = (data || []).map((item) => ({
    ...item,
    lat: item.lat == null ? null : Number(item.lat),
    lng: item.lng == null ? null : Number(item.lng)
  }));

  renderVisibleItems();
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

function handlePhotoPreview() {
  const file = photoInput.files?.[0];

  if (!file) {
    photoPreviewWrap.hidden = true;
    photoPreview.removeAttribute('src');
    return;
  }

  const previewUrl = URL.createObjectURL(file);
  photoPreview.src = previewUrl;
  photoPreviewWrap.hidden = false;
}

function openAddModal() {
  addModal.hidden = false;
  setTimeout(() => map.invalidateSize(), 50);
}

function closeAddModal() {
  addModal.hidden = true;
  formStatus.textContent = '';
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!currentUser) {
    formStatus.textContent = 'No user session yet.';
    return;
  }

  const formData = new FormData(form);

  const title = (formData.get('title') || '').toString().trim().toLowerCase();
  const color = (formData.get('color') || '').toString().trim();
  const condition = (formData.get('condition') || '').toString().trim();
  const photoFile = formData.get('photo');

  const lat = formData.get('lat') ? Number(formData.get('lat')) : null;
  const lng = formData.get('lng') ? Number(formData.get('lng')) : null;

  if (!title) {
    formStatus.textContent = 'Please enter what it is.';
    return;
  }

  if (!condition) {
    formStatus.textContent = 'Please choose a condition.';
    return;
  }

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
    color: color || null,
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

  form.reset();
  photoPreviewWrap.hidden = true;
  photoPreview.removeAttribute('src');
  clearDraftLocation();
  formStatus.textContent = 'Posted.';
  activeItemId = null;
  closeAddModal();
  await loadItems();
}

function attachEvents() {
  form.addEventListener('submit', handleSubmit);
  locateBtn.addEventListener('click', useCurrentLocation);
  photoInput.addEventListener('change', handlePhotoPreview);

  openAddBtn.addEventListener('click', openAddModal);
  closeAddBtn.addEventListener('click', closeAddModal);
  modalBackdrop.addEventListener('click', closeAddModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !addModal.hidden) {
      closeAddModal();
    }
  });

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

  document.getElementById('title').addEventListener('input', refreshDraftMarkerLabel);
}

async function init() {
  renderObjectSuggestions();
  initMap();
  attachEvents();
  await ensureAnonymousSession();
  await loadItems();
}

init();