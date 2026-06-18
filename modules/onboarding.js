import { StorageAPI } from './storage.js';
import { showModal } from './modal.js';

export async function initOnboarding() {
    const overlay = document.getElementById('onboarding-overlay');
    const form = document.getElementById('onboarding-form');
    const headerAvatar = document.getElementById('header-avatar-initials');
    const profileContainer = document.getElementById('profile-details-container');
    const editBtn = document.getElementById('edit-profile-btn');
    const headerProfile = document.getElementById('header-user-profile');

    if (!overlay || !form) return;

    // Load Profile
    let userProfile = await StorageAPI.get('settings', 'userProfile');

    if (!userProfile) {
        // First time user! Show overlay.
        overlay.classList.add('active');
    } else {
        // Load details
        updateProfileUI(userProfile.value);
    }

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const profileData = {
            name: document.getElementById('ob-name').value.trim(),
            college: document.getElementById('ob-college').value.trim(),
            branch: document.getElementById('ob-branch').value.trim(),
            currentYear: document.getElementById('ob-year').value.trim(),
            gradYear: document.getElementById('ob-grad-year').value.trim()
        };

        // Save to IndexedDB
        await StorageAPI.save('settings', { key: 'userProfile', value: profileData });
        
        // Hide overlay & Update UI
        overlay.classList.remove('active');
        updateProfileUI(profileData);
        
        // If we are editing, we don't need to alert, but for first time it's nice
        // Actually, just let it vanish smoothly.
    });

    if (editBtn) {
        editBtn.addEventListener('click', async () => {
            const data = await StorageAPI.get('settings', 'userProfile');
            const profile = data ? data.value : {};
            
            const result = await showModal('Edit Profile', [
                { id: 'name', label: 'Full Name', type: 'text', value: profile.name || '', required: true },
                { id: 'college', label: 'University / College', type: 'text', value: profile.college || '', required: true },
                { id: 'branch', label: 'Branch / Major', type: 'text', value: profile.branch || '', required: true },
                { id: 'currentYear', label: 'Current Year', type: 'number', value: profile.currentYear || '1', min: '1', max: '6' },
                { id: 'gradYear', label: 'Graduation Year', type: 'number', value: profile.gradYear || new Date().getFullYear(), min: '2020', max: '2030' }
            ]);

            if (result) {
                await StorageAPI.save('settings', { key: 'userProfile', value: result });
                updateProfileUI(result);
            }
        });
    }

    // Handle Header Avatar Click (Navigate to Settings)
    if (headerProfile) {
        headerProfile.addEventListener('click', () => {
            const settingsNav = document.querySelector('.nav-item[data-target="settings"]');
            if (settingsNav) settingsNav.click();
        });
    }

    function updateProfileUI(data) {
        // 2. Update Settings Section
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="profile-detail-item">
                    <span class="profile-detail-label">Name</span>
                    <span class="profile-detail-value">${data.name}</span>
                </div>
                <div class="profile-detail-item">
                    <span class="profile-detail-label">University / College</span>
                    <span class="profile-detail-value">${data.college}</span>
                </div>
                <div class="profile-detail-item">
                    <span class="profile-detail-label">Branch / Major</span>
                    <span class="profile-detail-value">${data.branch}</span>
                </div>
                <div class="profile-detail-item">
                    <span class="profile-detail-label">Current Year</span>
                    <span class="profile-detail-value">Year ${data.currentYear}</span>
                </div>
                <div class="profile-detail-item">
                    <span class="profile-detail-label">Class Of</span>
                    <span class="profile-detail-value">${data.gradYear}</span>
                </div>
            `;
        }
    }
}
