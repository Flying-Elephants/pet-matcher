document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.pp-container');
  if (!container) return;

  const customerId = container.dataset.customerId;
  const isDesignMode = container.dataset.designMode === 'true';

  // State
  let profiles = [];
  let settings = { types: [] };
  let activePetId = null;

  // DOM Elements
  const modal = {
    trigger: document.getElementById('pp-floating-trigger'),
    overlay: document.getElementById('pp-modal-overlay')
  };

  const views = {
    skeleton: document.getElementById('pp-skeleton-loader'),
    welcome: document.getElementById('pp-welcome-view'),
    summary: document.getElementById('pp-summary-view'),
    management: document.getElementById('pp-management-view')
  };

  const elements = {
    activePetName: document.getElementById('pp-active-pet-name'),
    activePetDetails: document.getElementById('pp-active-pet-details'),
    startBtn: document.getElementById('pp-start-btn'),
    manageBtn: document.getElementById('pp-manage-btn'),
    closeManageBtn: document.getElementById('pp-close-management-btn'),
    petList: document.getElementById('pet-profile-list'),
    form: document.getElementById('pet-profile-form'),
    formTitle: document.getElementById('form-title'),
    formSubmitBtn: document.getElementById('form-submit-btn'),
    formCancelBtn: document.getElementById('form-cancel-btn'),
    toastContainer: document.getElementById('pp-toast-container'),
    petTypeSelect: document.getElementById('pet-type'),
    petBreedSelect: document.getElementById('pet-breed')
  };

  // --- Modal Logic ---

  function openModal() {
    modal.overlay.style.display = 'flex';
    document.body.classList.add('pp-modal-open');
    if (customerId) {
      if (profiles.length === 0) {
        fetchProfiles();
      } else {
        // If we have profiles, show management view immediately for better UX in modal
        showManagementView();
      }
    }
  }

  function closeModal() {
    modal.overlay.style.display = 'none';
    document.body.classList.remove('pp-modal-open');
  }

  if (modal.trigger) {
    modal.trigger.addEventListener('click', openModal);
  }

  if (modal.overlay) {
    modal.overlay.addEventListener('click', (e) => {
      if (e.target === modal.overlay) closeModal();
    });
  }

  // --- Initialization ---

  if (isDesignMode) {
    showView('welcome');
    // In design mode, keep modal open or handle accordingly
    if(modal.overlay) modal.overlay.style.display = 'flex';
  }

  if (customerId) {
    fetchProfiles();
  }

  // --- Event Listeners ---

  if (elements.startBtn) {
      elements.startBtn.addEventListener('click', () => {
          showManagementView(true);
      });
  }

  if (elements.manageBtn) elements.manageBtn.addEventListener('click', () => showManagementView());
  if (elements.closeManageBtn) elements.closeManageBtn.addEventListener('click', closeManagementView);
  if (elements.formCancelBtn) elements.formCancelBtn.addEventListener('click', resetForm);
  
  if (elements.form) {
    elements.form.addEventListener('submit', handleFormSubmit);
  }

  if (elements.petTypeSelect) {
    elements.petTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        updateBreedOptions(selectedType);
    });
  }

  // --- API Interactions ---

  async function fetchProfiles() {
    try {
      const response = await fetch(`/apps/pet-matcher-proxy/pet-profiles?logged_in_customer_id=${customerId}`);
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response from server");
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (data.error) throw new Error(data.error);

      profiles = data.profiles || [];
      activePetId = data.activePetId;
      settings = data.settings || { types: [] };

      populateTypeOptions();
      render();
    } catch (error) {
      console.error('Error fetching pet profiles:', error);
      showToast('Failed to load profiles. Please try again.', 'error');
    }
  }

  // --- Rendering Logic ---

  function render() {
    if (views.skeleton) views.skeleton.style.display = 'none';

    if (profiles.length === 0) {
      showView('welcome');
    } else {
      updateSummaryView();
      showView('summary');
    }
  }

  function updateSummaryView() {
    const activePet = profiles.find(p => p.id === activePetId) || profiles[0];
    if (activePet) {
      elements.activePetName.textContent = activePet.name;
      elements.activePetDetails.textContent = `${activePet.breed} • ${activePet.type || 'Dog'}`;
    }
  }

  function populateTypeOptions() {
      if (!elements.petTypeSelect) return;
      elements.petTypeSelect.innerHTML = '<option value="" disabled selected>Select a pet type</option>';
      settings.types.forEach(type => {
          const option = document.createElement('option');
          option.value = type.label;
          option.textContent = type.label;
          elements.petTypeSelect.appendChild(option);
      });
  }

  function updateBreedOptions(selectedTypeLabel, selectedBreed = null) {
      if (!elements.petBreedSelect) return;
      const typeConfig = settings.types.find(t => t.label === selectedTypeLabel);
      elements.petBreedSelect.innerHTML = '<option value="" disabled selected>Select a breed</option>';
      elements.petBreedSelect.disabled = !typeConfig;
      if (typeConfig && typeConfig.breeds) {
          typeConfig.breeds.forEach(breed => {
              const option = document.createElement('option');
              option.value = breed;
              option.textContent = breed;
              if (breed === selectedBreed) option.selected = true;
              elements.petBreedSelect.appendChild(option);
          });
      }
  }

  function renderPetList() {
    elements.petList.innerHTML = '';
    profiles.forEach(pet => {
      const card = document.createElement('div');
      card.className = `pp-pet-card ${pet.id === activePetId ? 'pp-active' : ''}`;
      const isActive = pet.id === activePetId;
      card.innerHTML = `
        <div class="pp-card-content">
          <div class="pp-card-icon">🐾</div>
          <div class="pp-card-info">
            <div class="pp-pet-name">${pet.name}</div>
            <div class="pp-pet-breed">${pet.breed}</div>
          </div>
        </div>
        <div class="pp-card-actions">
           ${!isActive ? `<button type="button" class="pp-action-btn pp-select-btn" data-id="${pet.id}">Select</button>` : '<span class="pp-badge">Active</span>'}
           <button type="button" class="pp-action-btn pp-edit-btn" data-id="${pet.id}">Edit</button>
           <button type="button" class="pp-action-btn pp-delete-btn" data-id="${pet.id}">Delete</button>
        </div>
      `;
      elements.petList.appendChild(card);
    });

    document.querySelectorAll('.pp-select-btn').forEach(btn => {
      btn.addEventListener('click', (e) => setActivePet(e.target.dataset.id));
    });
    document.querySelectorAll('.pp-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => editPet(e.target.dataset.id));
    });
    document.querySelectorAll('.pp-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deletePet(e.target.dataset.id));
    });
  }

  // --- View Management ---

  function showView(viewName) {
    Object.values(views).forEach(el => {
        if(el) {
            el.style.display = 'none';
            el.classList.remove('pp-view--visible');
        }
    });
    const target = views[viewName];
    if (target) {
        target.style.display = 'block';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                target.classList.add('pp-view--visible');
            });
        });
    }
  }

  function showManagementView(autoFocusForm = false) {
    renderPetList();
    showView('management');
    if (autoFocusForm) {
        const nameInput = document.getElementById('pet-name');
        if(nameInput) nameInput.focus();
    }
  }

  function closeManagementView() {
    resetForm();
    render();
  }

  // --- Form Handling ---

  function resetForm() {
    elements.form.reset();
    document.getElementById('form-intent').value = 'create';
    document.getElementById('form-pet-id').value = '';
    elements.formTitle.textContent = 'Add a New Pet';
    elements.formSubmitBtn.textContent = 'Save Pet';
    elements.formCancelBtn.style.display = 'none';
    if (elements.petBreedSelect) {
        elements.petBreedSelect.innerHTML = '<option value="" disabled selected>Select a breed</option>';
        elements.petBreedSelect.disabled = true;
    }
  }

  function editPet(id) {
    const pet = profiles.find(p => p.id === id);
    if (!pet) return;
    document.getElementById('form-intent').value = 'update';
    document.getElementById('form-pet-id').value = pet.id;
    document.getElementById('pet-name').value = pet.name;
    if (elements.petTypeSelect) {
        elements.petTypeSelect.value = pet.type || 'Dog';
    }
    updateBreedOptions(pet.type || 'Dog', pet.breed);
    if (pet.birthday) {
        document.getElementById('pet-birthday').value = pet.birthday.split('T')[0];
    }
    elements.formTitle.textContent = 'Edit Pet';
    elements.formSubmitBtn.textContent = 'Update Pet';
    elements.formCancelBtn.style.display = 'inline-block';
    elements.form.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(elements.form);
    const data = Object.fromEntries(formData.entries());
    if(!data.type || !data.breed) {
        showToast('Please select both a pet type and a breed.', 'error');
        return;
    }
    const payload = {
        name: data.name,
        type: data.type,
        breed: data.breed,
        birthday: data.birthday || null
    };
    const intent = formData.get('intent');
    const id = formData.get('id');
    elements.formSubmitBtn.disabled = true;
    elements.formSubmitBtn.textContent = 'Saving...';
    try {
        const formDataToSend = new FormData();
        formDataToSend.append('intent', intent);
        if (id) formDataToSend.append('id', id);
        formDataToSend.append('data', JSON.stringify(payload));
        const response = await fetch(`/apps/pet-matcher-proxy/pet-profiles?logged_in_customer_id=${customerId}`, {
            method: 'POST',
            body: formDataToSend
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        await fetchProfiles();
        resetForm();
        showToast(`Pet ${intent === 'create' ? 'added' : 'updated'} successfully!`);
    } catch (error) {
        showToast(error.message || 'Something went wrong.', 'error');
    } finally {
        elements.formSubmitBtn.disabled = false;
        elements.formSubmitBtn.textContent = intent === 'create' ? 'Save Pet' : 'Update Pet';
    }
  }

  async function setActivePet(id) {
    try {
        const formData = new FormData();
        formData.append('intent', 'set_active');
        formData.append('petId', id);
        const response = await fetch(`/apps/pet-matcher-proxy/pet-profiles?logged_in_customer_id=${customerId}`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        activePetId = id;
        renderPetList();
        showToast('Active pet updated!');
    } catch (error) {
        showToast(error.message, 'error');
    }
  }

  async function deletePet(id) {
      if(!confirm('Are you sure you want to delete this pet profile?')) return;
      try {
        const formData = new FormData();
        formData.append('intent', 'delete');
        formData.append('id', id);
        const response = await fetch(`/apps/pet-matcher-proxy/pet-profiles?logged_in_customer_id=${customerId}`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        await fetchProfiles();
        showToast('Pet profile deleted.');
      } catch (error) {
        showToast(error.message, 'error');
      }
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `pp-toast pp-toast--${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
