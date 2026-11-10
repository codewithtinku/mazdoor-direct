document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('workerRegisterForm');
  const alertBox = document.getElementById('alertBox');
  const categorySelect = document.getElementById('category_id');
  const localitySelect = document.getElementById('locality_id');

  // Load Categories & Localities
  Promise.all([fetch('/api/categories'), fetch('/api/localities')])
    .then(([catRes, locRes]) => Promise.all([catRes.json(), locRes.json()]))
    .then(([catData, locData]) => {
      if (catData.success) {
        catData.data.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.name;
          categorySelect.appendChild(opt);
        });
      }
      if (locData.success) {
        locData.data.forEach(l => {
          const opt = document.createElement('option');
          opt.value = l.id;
          opt.textContent = `${l.name} (${l.pincode})`;
          localitySelect.appendChild(opt);
        });
      }
    });

  // Submit Handler using FormData
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const formData = new FormData(form);

    try {
      const res = await fetch('/api/workers/register', {
        method: 'POST',
        body: formData // Automatically sets multipart/form-data
      });

      const result = await res.json();
      if (result.success) {
        showAlert('Registration safal raha! Aapki profile add ho gayi.', 'success');
        form.reset();
        setTimeout(() => window.location.href = 'index.html', 1500);
      } else {
        showAlert(result.message || 'Kuch galat ho gaya.', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Server se connect nahi ho saka.', 'error');
    }
  });

  function showAlert(msg, type) {
    alertBox.textContent = msg;
    alertBox.className = `alert-msg alert-${type}`;
    alertBox.style.display = 'block';
  }
});