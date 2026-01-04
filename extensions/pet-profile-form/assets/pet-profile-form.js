(function() {
  const container = document.querySelector('.pp-container');
  if (!container) return;

  const customerId = container.dataset.customerId;
  const isDesignMode = container.dataset.designMode === 'true';
  
  // View Elements
  const welcomeView = document.getElementById('pp-welcome-view');
  const summaryView = document.getElementById('pp-summary-view');
  const managementView = document.getElementById('pp-management-view');
  
  const startBtn = document.getElementById('pp-start-btn');
  const manageBtn = document.getElementById('pp-manage-btn');
  const closeManagementBtn = document.getElementById('pp-close-management-btn');
  
  const activePetNameEl = document.getElementById('pp-active-pet-name');
  const activePetDetailsEl = document.getElementById('pp-active-pet-details');
  const skeletonLoader = document.getElementById('pp-skeleton-loader');

  // List & Form Elements
  const listContainer = document.getElementById('pet-profile-list');
  const form = document.getElementById('pet-profile-form');
  const formTitle = document.getElementById('form-title');
  const formIntent = document.getElementById('form-intent');
  const formPetId = document.getElementById('form-pet-id');
  const formSubmitBtn = document.getElementById('form-submit-btn');
  const formCancelBtn = document.getElementById('form-cancel-btn');
  
  const petNameInput = document.getElementById('pet-name');
  const petBreedInput = document.getElementById('pet-breed');
  const petBirthdayInput = document.getElementById('pet-birthday');

  const proxyUrl = '/apps/pet-matcher-proxy/pet-profiles';

  let allProfiles = [];
  let activePetId = null;

  // View Toggling
  function toggleView(viewName) {
     // Remove skeleton if present
     if (skeletonLoader) {
       skeletonLoader.style.display = 'none';
     }

     // Hide all views first
     [welcomeView, summaryView, managementView].forEach(view => {
       if(view) {
         view.classList.remove('pp-view--visible');
         view.style.display = 'none';
       }
     });

     let targetView;
     switch(viewName) {
       case 'welcome': targetView = welcomeView; break;
       case 'summary': targetView = summaryView; break;
       case 'management': targetView = managementView; break;
     }
     
     if (targetView) {
        targetView.style.display = 'block';
        requestAnimationFrame(() => {
          targetView.classList.add('pp-view--visible');
          
          if(viewName === 'management') {
             resetForm();
          }
        });
     }
  }

  if (startBtn) {
    startBtn.addEventListener('click', () => toggleView('management'));
  }

  if (manageBtn) {
    manageBtn.addEventListener('click', () => toggleView('management'));
  }
  
  if (closeManagementBtn) {
    closeManagementBtn.addEventListener('click', () => {
       if (allProfiles.length > 0) {
         toggleView('summary');
       } else {
         toggleView('welcome');
       }
    });
  }

  // Toast Notification System
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('pp-toast-container');
    const toast = document.createElement('div');
    toast.className = `pp-toast pp-toast--${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('pp-toast--visible');

    setTimeout(() => {
      toast.classList.remove('pp-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function updateSummary(profiles, activeId) {
     if (!activePetNameEl) return;

     if (profiles.length === 0) {
       activePetNameEl.textContent = "No pets added yet";
       activePetDetailsEl.textContent = "Add a pet to get started";
       return;
     }

     const activeProfile = profiles.find(p => p.id === activeId) || profiles[0];
     
     if (activeProfile) {
       activePetNameEl.textContent = activeProfile.name;
       activePetDetailsEl.textContent = activeProfile.breed;
     } else {
       activePetNameEl.textContent = "Select a pet";
       activePetDetailsEl.textContent = "";
     }
  }

  async function fetchProfiles() {
    if (!customerId) {
      if (isDesignMode) {
        if (activePetNameEl) activePetNameEl.textContent = "Example Pet";
        listContainer.innerHTML = '<div class="pp-empty-state">Profiles will be displayed here for logged-in customers.</div>';
        toggleView('welcome'); // Force show welcome view in editor
      }
      return;
    }
    try {
      const response = await fetch(`${proxyUrl}?logged_in_customer_id=${customerId}`);
      const data = await response.json();
      allProfiles = data.profiles || [];
      activePetId = data.activePetId || null;
      
      updateSummary(allProfiles, activePetId);
      renderProfiles(allProfiles);
      
      if (allProfiles.length === 0) {
        toggleView('welcome');
      } else {
        toggleView('summary');
      }
    } catch (e) {
      if (activePetNameEl) activePetNameEl.textContent = "Error loading pets";
      listContainer.innerHTML = '<div class="pp-error-state">Error loading profiles. Please try again.</div>';
    }
  }

  function renderProfiles(profiles) {
    if (profiles.length === 0) {
      listContainer.innerHTML = `
        <div class="pp-empty-state">
          <p>No pets found.</p>
          <p class="pp-empty-sub">Add your first pet below to get started!</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = profiles.map((profile, index) => {
      const birthdayStr = profile.birthday ? new Date(profile.birthday).toLocaleDateString() : 'N/A';
      const isActive = profile.id === activePetId;
      const activeClass = isActive ? 'pp-pet-card--active' : '';
      const delay = index * 0.05; // Stagger delay
      
      return `
        <div class="pp-pet-card ${activeClass}" style="animation-delay: ${delay}s">
          <div class="pp-pet-card__content">
            <div class="pp-pet-card__header">
              <h4 class="pp-pet-name">${profile.name}</h4>
              ${isActive ? '<span class="pp-badge pp-badge--active">Active</span>' : ''}
            </div>
            <div class="pp-pet-info">
              <span class="pp-pet-breed">${profile.breed}</span>
              <span class="pp-pet-meta">• Born: ${birthdayStr}</span>
            </div>
          </div>
          <div class="pp-pet-card__actions">
            ${!isActive ? `<button onclick="setActivePet('${profile.id}')" class="pp-action-btn pp-action-btn--select" title="Select as Active">Select</button>` : ''}
            <button onclick="editPet('${profile.id}')" class="pp-action-btn pp-action-btn--edit" title="Edit">Edit</button>
            <button onclick="deletePet('${profile.id}')" class="pp-action-btn pp-action-btn--delete" title="Delete">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.setActivePet = async (id) => {
      const formData = new FormData();
      formData.append('intent', 'set_active');
      formData.append('petId', id);

      try {
          const res = await fetch(`${proxyUrl}?logged_in_customer_id=${customerId}`, {
              method: 'POST',
              body: formData
          });
          if (res.ok) {
              showToast('Active pet updated');
              fetchProfiles();
          } else {
              showToast('Failed to set active pet', 'error');
          }
      } catch (e) {
          showToast('Error setting active pet', 'error');
      }
  };

  window.editPet = (id) => {
    const profile = allProfiles.find(p => p.id === id);
    if (!profile) return;

    formTitle.textContent = 'Edit Pet Profile';
    formIntent.value = 'update';
    formPetId.value = id;
    formSubmitBtn.textContent = 'Update Pet';
    formCancelBtn.style.display = 'inline-block';

    petNameInput.value = profile.name;
    petBreedInput.value = profile.breed;
    
    if (profile.birthday) {
      petBirthdayInput.value = profile.birthday.split('T')[0];
    } else {
      petBirthdayInput.value = '';
    }

    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  window.resetForm = () => {
    formTitle.textContent = 'Add a New Pet';
    formIntent.value = 'create';
    formPetId.value = '';
    formSubmitBtn.textContent = 'Save Pet';
    formCancelBtn.style.display = 'none';
    form.reset();
  };

  if(formCancelBtn) {
    formCancelBtn.addEventListener('click', resetForm);
  }

  window.deletePet = async (id) => {
    if (!confirm('Are you sure you want to delete this pet profile?')) return;
    
    const formData = new FormData();
    formData.append('intent', 'delete');
    formData.append('id', id);

    try {
      const res = await fetch(`${proxyUrl}?logged_in_customer_id=${customerId}`, {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        showToast('Pet profile deleted');
        fetchProfiles(); 
      } else {
        showToast('Failed to delete profile', 'error');
      }
    } catch(e) {
      showToast('Error deleting profile', 'error');
    }
  };

  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Button Loading State
      const originalBtnText = formSubmitBtn.textContent;
      formSubmitBtn.disabled = true;
      formSubmitBtn.textContent = 'Saving...';

      const fd = new FormData(form);
      const intent = fd.get('intent');
      
      const profileData = {
        name: fd.get('name'),
        breed: fd.get('breed'),
        birthday: fd.get('birthday') || null,
        attributes: {}
      };

      const submitData = new FormData();
      submitData.append('intent', intent);
      if (intent === 'update') {
        submitData.append('id', fd.get('id'));
      }
      submitData.append('data', JSON.stringify(profileData));

      try {
        const res = await fetch(`${proxyUrl}?logged_in_customer_id=${customerId}`, {
          method: 'POST',
          body: submitData
        });
        
        if (!res.ok) {
          const err = await res.json();
          showToast('Error: ' + (err.error || 'Failed to save pet'), 'error');
          return;
        }

        showToast(intent === 'create' ? 'Pet added successfully!' : 'Pet updated successfully!');
        resetForm();
        fetchProfiles();
      } catch (err) {
        showToast('An unexpected error occurred.', 'error');
      } finally {
        formSubmitBtn.disabled = false;
        formSubmitBtn.textContent = originalBtnText;
      }
    });
  }

  fetchProfiles();
})();
