document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const localityFilter = document.getElementById('localityFilter');
  const btnGeoLocation = document.getElementById('btnGeoLocation');
  const workersList = document.getElementById('workersList');
  const workerCount = document.getElementById('workerCount');

  let localitiesData = [];

  initFilters();
  fetchWorkers();

  categoryFilter.addEventListener('change', fetchWorkers);
  localityFilter.addEventListener('change', fetchWorkers);

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchWorkers, 300);
  });

  if (btnGeoLocation) {
    btnGeoLocation.addEventListener('click', handleAutoDetectLocation);
  }

  async function initFilters() {
    try {
      const [catRes, locRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/localities')
      ]);

      const catData = await catRes.json();
      const locData = await locRes.json();

      if (catData.success && Array.isArray(catData.data)) {
        catData.data.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          categoryFilter.appendChild(opt);
        });
      }

      if (locData.success && Array.isArray(locData.data)) {
        localitiesData = locData.data;
        localitiesData.forEach(l => {
          const opt = document.createElement('option');
          opt.value = l.id;
          opt.textContent = `${l.name} (${l.pincode})`;
          localityFilter.appendChild(opt);
        });
      }
    } catch (err) {
      console.error('Filter dropdown error:', err);
    }
  }

  async function handleAutoDetectLocation() {
    if (!navigator.geolocation) {
      alert('Browser GPS support nahi karta.');
      return;
    }

    btnGeoLocation.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Detecting...';

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          const areaText = `${data.address?.suburb || ''} ${data.address?.neighbourhood || ''} ${data.address?.city || ''} ${data.address?.postcode || ''}`.toLowerCase();

          const match = localitiesData.find(l => areaText.includes(l.name.toLowerCase()) || (l.pincode && areaText.includes(l.pincode)));
          if (match) {
            localityFilter.value = match.id;
            fetchWorkers();
            btnGeoLocation.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${match.name}`;
          } else {
            btnGeoLocation.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Auto-Detect';
            alert('Aapka area list me nahi mila, kripya manual select karein.');
          }
        } catch {
          btnGeoLocation.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Auto-Detect';
        }
      },
      () => {
        btnGeoLocation.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Auto-Detect';
        alert('Location permission allow karein.');
      },
      { timeout: 5000 }
    );
  }

  async function fetchWorkers() {
    try {
      workersList.innerHTML = '<div class="loading-state">Workers load ho rahe hain...</div>';

      const params = new URLSearchParams();
      if (categoryFilter.value) params.append('category_id', categoryFilter.value);
      if (localityFilter.value) params.append('locality_id', localityFilter.value);
      if (searchInput.value.trim()) params.append('search', searchInput.value.trim());

      const res = await fetch(`/api/workers?${params.toString()}`);
      const result = await res.json();

      if (!result.success || !result.data || result.data.length === 0) {
        workersList.innerHTML = '<div class="empty-state">Koi karigar nahi mila.</div>';
        workerCount.textContent = '0 Workers Found';
        return;
      }

      workerCount.textContent = `${result.data.length} Workers Available`;
      renderWorkers(result.data);
    } catch (err) {
      console.error('Fetch error:', err);
      workersList.innerHTML = '<div class="empty-state">Data load nahi hua. Server ya Console check karein.</div>';
    }
  }

  function renderWorkers(workers) {
    workersList.innerHTML = workers.map(worker => {
      const ratingStr = worker.avg_rating 
        ? `<span style="color:#f59e0b; font-weight:700;"><i class="fa-solid fa-star"></i> ${worker.avg_rating}</span> <span style="font-size:0.75rem; color:#6b7280;">(${worker.review_count || 0})</span>`
        : `<span style="font-size:0.78rem; color:#9ca3af;">Naya Karigar</span>`;

      const avatarHtml = worker.profile_photo 
        ? `<img src="${worker.profile_photo}" alt="${worker.full_name}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid #10b981;">`
        : `<div style="width:48px; height:48px; border-radius:50%; background:#ecfdf5; color:#047857; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem; border:1px solid #a7f3d0;">${(worker.full_name || 'K').charAt(0).toUpperCase()}</div>`;

      return `
        <div class="worker-card">
          <div>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
              ${avatarHtml}
              <div>
                <a href="profile.html?id=${worker.id}" style="text-decoration:none; color:inherit;">
                  <div class="worker-name" style="cursor:pointer; text-decoration:underline dotted;">${worker.full_name}</div>
                </a>
                <span class="worker-category">${worker.category_name}</span>
                ${worker.is_verified ? '<span class="worker-badge-verified" style="margin-left:4px;"><i class="fa-solid fa-circle-check"></i></span>' : ''}
              </div>
            </div>

            <div style="margin-bottom:8px;">${ratingStr}</div>

            <div class="worker-details">
              <span><i class="fa-solid fa-location-dot"></i> ${worker.locality_name} (${worker.pincode})</span>
              <span><i class="fa-solid fa-briefcase"></i> ${worker.experience_years} saal experience</span>
              <span><i class="fa-solid fa-indian-rupee-sign"></i> Daily Rate: <b class="rate-badge">₹${worker.daily_rate}</b></span>
            </div>
          </div>

          <div class="card-actions" style="margin-top:14px;">
            <a href="tel:${worker.phone_number}" class="btn-action btn-call"><i class="fa-solid fa-phone"></i> Call</a>
            <button onclick="sendWA('${worker.phone_number}', '${worker.full_name}')" class="btn-action btn-whatsapp" style="border:none; cursor:pointer;"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>
          </div>
        </div>
      `;
    }).join('');
  }
});

window.sendWA = (phone, name) => {
  const clean = phone.replace(/\D/g, '');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const url = `https://wa.me/91${clean}?text=${encodeURIComponent(`Namaste ${name}, mujhe kaam ke liye baat karni hai.\n\n📍 Location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`)}`;
        window.open(url, '_blank');
      },
      () => {
        window.open(`https://wa.me/91${clean}?text=${encodeURIComponent(`Namaste ${name}, mujhe kaam ke liye baat karni hai.`)}`, '_blank');
      },
      { timeout: 3000 }
    );
  } else {
    window.open(`https://wa.me/91${clean}?text=${encodeURIComponent(`Namaste ${name}, mujhe kaam ke liye baat karni hai.`)}`, '_blank');
  }
};