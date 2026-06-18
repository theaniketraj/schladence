export function showModal(title, fields) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'custom-modal-card';

        const header = document.createElement('h3');
        header.textContent = title;
        header.style.marginBottom = '1.5rem';
        header.style.fontSize = '1.25rem';
        header.style.color = 'var(--text-primary)';

        const form = document.createElement('form');
        form.className = 'custom-modal-form';

        fields.forEach(f => {
            const group = document.createElement('div');
            group.className = 'form-group';

            if (f.label) {
                const label = document.createElement('label');
                label.textContent = f.label;
                group.appendChild(label);
            }

            let input;
            if (f.type === 'select') {
                input = document.createElement('select');
                f.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    if (opt.selected) option.selected = true;
                    input.appendChild(option);
                });
            } else if (f.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = f.rows || 3;
                if (f.value) input.value = f.value;
            } else {
                input = document.createElement('input');
                input.type = f.type || 'text';
                if (f.min !== undefined) input.min = f.min;
                if (f.max !== undefined) input.max = f.max;
                if (f.value !== undefined) input.value = f.value;
            }

            input.id = f.id;
            input.required = f.required !== false;
            if (f.placeholder) input.placeholder = f.placeholder;

            group.appendChild(input);
            form.appendChild(group);
        });

        const actions = document.createElement('div');
        actions.className = 'custom-modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn';
        cancelBtn.textContent = 'Cancel';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = 'Save';

        actions.appendChild(cancelBtn);
        actions.appendChild(submitBtn);
        form.appendChild(actions);

        modal.appendChild(header);
        modal.appendChild(form);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Trigger reflow
        overlay.offsetHeight;
        overlay.classList.add('active');

        const firstInput = form.querySelector('input, select, textarea');
        if (firstInput) firstInput.focus();

        function cleanup() {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    overlay.remove();
                }
            }, 300);
        }

        // Click outside to cancel
        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(null);
            }
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const result = {};
            fields.forEach(f => {
                result[f.id] = document.getElementById(f.id).value;
            });
            cleanup();
            resolve(result);
        });
    });
}

export function showConfirm(message, confirmText = 'Yes, Delete', type = 'danger') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'custom-modal-card';
        modal.style.maxWidth = '350px';
        modal.style.textAlign = 'center';

        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
        icon.style.fontSize = '3rem';
        icon.style.color = type === 'danger' ? 'var(--danger)' : 'var(--accent-primary)';
        icon.style.marginBottom = '1rem';

        const text = document.createElement('p');
        text.textContent = message;
        text.style.color = 'var(--text-primary)';
        text.style.fontSize = '1.125rem';
        text.style.fontWeight = '500';
        text.style.marginBottom = '2rem';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '1rem';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn';
        cancelBtn.style.flex = '1';
        cancelBtn.textContent = 'Cancel';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = type === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
        confirmBtn.style.flex = '1';
        if (type === 'danger') confirmBtn.style.backgroundColor = 'var(--danger)';
        if (type === 'danger') confirmBtn.style.color = 'white';
        confirmBtn.textContent = confirmText;

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);

        modal.appendChild(icon);
        modal.appendChild(text);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.offsetHeight;
        overlay.classList.add('active');

        function cleanup() {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    overlay.remove();
                }
            }, 300);
        }

        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve(false);
            }
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(false);
        });

        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve(true);
        });
    });
}

export function showAlert(message, buttonText = 'OK', type = 'info') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'custom-modal-card';
        modal.style.maxWidth = '350px';
        modal.style.textAlign = 'center';

        const icon = document.createElement('div');
        if (type === 'success') {
            icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            icon.style.color = 'var(--success)';
        } else {
            icon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
            icon.style.color = 'var(--accent-primary)';
        }
        icon.style.fontSize = '3rem';
        icon.style.marginBottom = '1rem';

        const text = document.createElement('p');
        text.textContent = message;
        text.style.color = 'var(--text-primary)';
        text.style.fontSize = '1.125rem';
        text.style.fontWeight = '500';
        text.style.marginBottom = '2rem';

        const actions = document.createElement('div');
        actions.style.display = 'flex';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary';
        confirmBtn.style.flex = '1';
        if (type === 'success') confirmBtn.style.backgroundColor = 'var(--success)';
        confirmBtn.textContent = buttonText;

        actions.appendChild(confirmBtn);

        modal.appendChild(icon);
        modal.appendChild(text);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.offsetHeight;
        overlay.classList.add('active');

        function cleanup() {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    overlay.remove();
                }
            }, 300);
        }

        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) {
                cleanup();
                resolve();
            }
        });

        confirmBtn.addEventListener('click', () => {
            cleanup();
            resolve();
        });
    });
}
