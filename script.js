document.addEventListener('DOMContentLoaded', () => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

    let activities = JSON.parse(localStorage.getItem('schedule_activities')) || [];
    let currentTheme = localStorage.getItem('schedule_theme') || 'pink';
    let customBannerImage = localStorage.getItem('schedule_banner_image') || '';
    let activeDayFilter = 'all';
    let searchQuery = '';

    // Elementos DOM
    const scheduleGrid = document.getElementById('schedule-grid');
    const activityModal = document.getElementById('activity-modal');
    const themeModal = document.getElementById('theme-modal');
    const activityForm = document.getElementById('activity-form');
    const btnNewActivity = document.getElementById('btn-new-activity');
    const btnTheme = document.getElementById('btn-theme');
    const closeModalBtns = document.querySelectorAll('.close-modal, #close-theme-modal');
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const bgImageInput = document.getElementById('bg-image-input');
    const heroBanner = document.getElementById('hero-banner');
    const removeBannerBtn = document.getElementById('remove-banner');
    const deleteActivityBtn = document.getElementById('delete-activity');

    // Aplicar tema inicial y banner guardado
    setTheme(currentTheme);
    if (customBannerImage) setBannerImage(customBannerImage);

    // Renderizar Cuadrícula
    function renderGrid() {
        scheduleGrid.innerHTML = '';

        // Celda esquina superior izquierda vacía
        const cornerCell = document.createElement('div');
        cornerCell.className = 'grid-header-cell';
        cornerCell.innerHTML = '<i class="fa-solid fa-clock"></i>';
        scheduleGrid.appendChild(cornerCell);

        // Cabeceras de días
        days.forEach(day => {
            if (activeDayFilter === 'all' || activeDayFilter === day) {
                const headerCell = document.createElement('div');
                headerCell.className = 'grid-header-cell';
                headerCell.textContent = day;
                scheduleGrid.appendChild(headerCell);
            }
        });

        // Filas por hora
        hours.forEach(hour => {
            const timeCell = document.createElement('div');
            timeCell.className = 'time-cell';
            timeCell.textContent = hour;
            scheduleGrid.appendChild(timeCell);

            days.forEach(day => {
                if (activeDayFilter === 'all' || activeDayFilter === day) {
                    const slotCell = document.createElement('div');
                    slotCell.className = 'slot-cell';
                    slotCell.dataset.day = day;
                    slotCell.dataset.hour = hour;

                    // Buscar actividad en este día y hora
                    const activity = activities.find(act => act.day === day && act.time === hour);
                    
                    if (activity) {
                        // Filtrar por búsqueda si existe
                        const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                              activity.desc.toLowerCase().includes(searchQuery.toLowerCase());

                        if (matchesSearch || searchQuery === '') {
                            const actCard = document.createElement('div');
                            actCard.className = 'activity-card';
                            actCard.style.backgroundColor = activity.color || '#722F37';
                            actCard.innerHTML = `
                                <div class="activity-title">${activity.title}</div>
                                <div class="activity-desc">${activity.desc}</div>
                            `;
                            slotCell.appendChild(actCard);
                        }
                    }

                    // Evento para abrir modal al hacer clic en celda
                    slotCell.addEventListener('click', () => {
                        const existingActivity = activities.find(act => act.day === day && act.time === hour);
                        if (existingActivity) {
                            openEditModal(existingActivity);
                        } else {
                            openCreateModal(day, hour);
                        }
                    });

                    scheduleGrid.appendChild(slotCell);
                }
            });
        });
    }

    // Ajustar columnas de la grilla según filtro
    function updateGridColumns() {
        const visibleDaysCount = activeDayFilter === 'all' ? 7 : 1;
        scheduleGrid.style.gridTemplateColumns = `80px repeat(${visibleDaysCount}, 1fr)`;
    }

    // Modales
    function openCreateModal(day = 'Lunes', hour = '08:00') {
        document.getElementById('modal-title').textContent = 'Nueva Actividad';
        document.getElementById('activity-id').value = '';
        document.getElementById('act-title').value = '';
        document.getElementById('act-day').value = day;
        document.getElementById('act-time').value = hour;
        document.getElementById('act-desc').value = '';
        deleteActivityBtn.style.display = 'none';
        activityModal.classList.add('active');
    }

    function openEditModal(activity) {
        document.getElementById('modal-title').textContent = 'Editar Actividad';
        document.getElementById('activity-id').value = activity.id;
        document.getElementById('act-title').value = activity.title;
        document.getElementById('act-day').value = activity.day;
        document.getElementById('act-time').value = activity.time;
        document.getElementById('act-desc').value = activity.desc;
        
        // Marcar color
        const colorRadios = document.querySelectorAll('input[name="act-color"]');
        colorRadios.forEach(radio => {
            if (radio.value === activity.color) radio.checked = true;
        });

        deleteActivityBtn.style.display = 'inline-flex';
        activityModal.classList.add('active');
    }

    btnNewActivity.addEventListener('click', () => openCreateModal());
    btnTheme.addEventListener('click', () => themeModal.classList.add('active'));
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            activityModal.classList.remove('active');
            themeModal.classList.remove('active');
        });
    });

    // Guardar Actividad (Crear / Editar)
    activityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('activity-id').value;
        const title = document.getElementById('act-title').value;
        const day = document.getElementById('act-day').value;
        const time = document.getElementById('act-time').value;
        const desc = document.getElementById('act-desc').value;
        const color = document.querySelector('input[name="act-color"]:checked').value;

        if (id) {
            activities = activities.map(act => act.id == id ? { id: Number(id), title, day, time, desc, color } : act);
        } else {
            const newAct = { id: Date.now(), title, day, time, desc, color };
            activities.push(newAct);
        }

        saveAndRender();
        activityModal.classList.remove('active');
    });

    // Eliminar Actividad
    deleteActivityBtn.addEventListener('click', () => {
        const id = document.getElementById('activity-id').value;
        if (id) {
            activities = activities.filter(act => act.id != id);
            saveAndRender();
            activityModal.classList.remove('active');
        }
    });

    // Búsqueda y Filtros
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderGrid();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeDayFilter = btn.dataset.day;
            updateGridColumns();
            renderGrid();
        });
    });

    // Cargar Imagen de Banner
    bgImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(uploadEvent) {
                const imageUrl = uploadEvent.target.result;
                customBannerImage = imageUrl;
                setBannerImage(imageUrl);
                localStorage.setItem('schedule_banner_image', imageUrl);
            }
            reader.readAsDataURL(file);
        }
    });

    function setBannerImage(url) {
        heroBanner.style.backgroundImage = `url(${url})`;
        heroBanner.querySelector('.banner-placeholder').style.display = 'none';
        removeBannerBtn.style.display = 'flex';
    }

    removeBannerBtn.addEventListener('click', () => {
        customBannerImage = '';
        heroBanner.style.backgroundImage = 'none';
        heroBanner.querySelector('.banner-placeholder').style.display = 'flex';
        removeBannerBtn.style.display = 'none';
        localStorage.removeItem('schedule_banner_image');
    });

    // Selector de Temas
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.dataset.theme;
            setTheme(theme);
            localStorage.setItem('schedule_theme', theme);
            themeModal.classList.remove('active');
        });
    });

    function setTheme(theme) {
        if (theme === 'pink') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    function saveAndRender() {
        localStorage.setItem('schedule_activities', JSON.stringify(activities));
        renderGrid();
    }

    // Inicializar renderizado
    updateGridColumns();
    renderGrid();
});