document.addEventListener('DOMContentLoaded', () => {
    // 1. Core Navigation Routing
    window.navigate = function(screenId) {
        const screens = document.querySelectorAll('.app-screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        
        const target = document.getElementById(`screen-${screenId}`);
        if(target) {
            target.classList.remove('hidden');
            target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            localStorage.setItem('currentScreen', screenId);
            
            // Auto close menus on navigate
            closeSidebar();
            closeNotifications();
        }
    };

    // DOM Elements
    const sidebar = document.getElementById('global-sidebar');
    const sidebarOverlay = document.getElementById('global-sidebar-overlay');
    const notificationsDropdown = document.getElementById('global-notifications-dropdown');

    const toggleSidebar = () => {
        if(sidebar && sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
            setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10);
        } else {
            closeSidebar();
        }
    };

    const closeSidebar = () => {
        if(sidebar) sidebar.classList.add('-translate-x-full');
        if(sidebarOverlay) {
            sidebarOverlay.classList.add('opacity-0');
            setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
        }
    };

    const toggleNotifications = () => {
        if(notificationsDropdown && notificationsDropdown.classList.contains('hidden')) {
            notificationsDropdown.classList.remove('hidden');
            setTimeout(() => {
                notificationsDropdown.classList.remove('scale-95', 'opacity-0');
                notificationsDropdown.classList.add('scale-100', 'opacity-100');
            }, 10);
        } else {
            closeNotifications();
        }
    };

    const closeNotifications = () => {
        if(notificationsDropdown) {
            notificationsDropdown.classList.remove('scale-100', 'opacity-100');
            notificationsDropdown.classList.add('scale-95', 'opacity-0');
            setTimeout(() => notificationsDropdown.classList.add('hidden'), 200);
        }
    };

    // Sidebar overlay click
    if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    const closeBtn = document.getElementById('close-sidebar');
    if(closeBtn) closeBtn.addEventListener('click', closeSidebar);

    // Sidebar generic routing links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if(target) navigate(target);
        });
    });

    // Filter Logic for Discover Page
    const initFilters = () => {
        const pills = document.querySelectorAll('.filter-pill');
        if(!pills.length) return;
        
        const filterContent = (filterType) => {
            const items = document.querySelectorAll('.discover-item');
            items.forEach(item => {
                const textContent = item.textContent.toLowerCase();
                const htmlContent = item.innerHTML.toLowerCase();
                const hasMenContext = textContent.includes('barber') || htmlContent.includes('barber') || textContent.includes('fade') || textContent.includes('grooming') || textContent.includes('men') || textContent.includes('beard') || textContent.includes('taper') || textContent.includes('executive');
                
                if (filterType === 'all') {
                    item.classList.remove('hidden-item');
                    // Remove charcoal accents logically if they were added
                    const badges = item.querySelectorAll('.bg-stone-900\\/90');
                    badges.forEach(b => {
                        b.classList.replace('bg-stone-900/90', 'bg-primary-container');
                        b.classList.remove('text-white');
                    });
                } else if (filterType === 'women') {
                    if(hasMenContext) {
                        item.classList.add('hidden-item');
                    } else {
                        item.classList.remove('hidden-item');
                    }
                } else if (filterType === 'men') {
                    if(hasMenContext) {
                        item.classList.remove('hidden-item');
                        // Add charcoal accents implicitly via class swap for luxury men's feel
                        const badges = item.querySelectorAll('.bg-primary-container');
                        badges.forEach(b => {
                            b.classList.replace('bg-primary-container', 'bg-stone-900/90');
                            b.classList.add('text-white');
                        });
                    } else {
                        item.classList.add('hidden-item');
                    }
                }
            });
        };

        pills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.preventDefault();
                // Reset active states
                pills.forEach(p => {
                    p.classList.remove('bg-stone-800', 'text-white');
                    p.classList.add('bg-surface-container-high', 'text-stone-500');
                });
                // Set current active
                pill.classList.remove('bg-surface-container-high', 'text-stone-500');
                pill.classList.add('bg-stone-800', 'text-white');
                
                const filter = pill.getAttribute('data-filter');
                filterContent(filter);
            });
        });
    };

    initFilters();

    // 2. Global Event Delegation for Deep Links
    document.body.addEventListener('click', (e) => {
        const span = e.target.closest('span');
        const btn = e.target.closest('button');
        const img = e.target.closest('img');
        const a = e.target.closest('a');

        // Allow main nav links
        if (a && a.id && a.id.startsWith('nav-btn')) return;

        // Hamburger Menu Capture (3 horizontal lines)
        if (span && span.textContent.trim().toLowerCase() === 'menu') {
            e.preventDefault();
            toggleSidebar();
            return;
        }

        // Notification Bell Capture (notifications)
        if (span && span.textContent.trim().toLowerCase() === 'notifications') {
            e.preventDefault();
            toggleNotifications();
            return;
        }

        // Search Bar Fallback functionality (Ensure click focus)
        const searchInput = e.target.closest('input[type="search"]') || e.target.closest('input[placeholder*="Search"]');
        if(searchInput) {
            searchInput.focus();
            // Don't prevent default, allow typing.
        }

        // A. Barber Section mapping 
        if (span && span.textContent.trim().toLowerCase() === 'barber') {
            e.preventDefault();
            navigate('men_s_styling_gallery');
            return;
        }

        // B. AI Style Assistant mapping 
        const isAIText = (el) => el && (
            el.textContent.toLowerCase().includes('ai style assistant') ||
            el.textContent.toLowerCase().includes('try ai stylist') ||
            el.textContent.toLowerCase().includes('ai stylist') ||
            el.textContent.toLowerCase().includes('try ai')
        );
        if (isAIText(span) || isAIText(btn) || isAIText(a)) {
            e.preventDefault();
            navigate('ai_style_assistant_unisex_update');
            return;
        }

        // C. Standard avatar images
        if (img && img.closest('.w-10.h-10.rounded-full')) {
            e.preventDefault();
            navigate('user_profile_settings');
            return;
        }

        // D. Catch Generic back arrows globally safely
        if (span && span.textContent.trim() === 'arrow_back') {
            const btnContainer = span.closest('button') || span.closest('a');
            if (btnContainer) {
                e.preventDefault();
                // Simple go back logic: hardcode to discover or home based on screen
                const currentId = localStorage.getItem('currentScreen');
                if(currentId === 'ai_style_assistant_unisex_update' || currentId === 'men_s_styling_gallery') {
                    navigate('glamathome_home_screen');
                } else if(currentId === 'glamathome_home_screen') {
                    // Stay home
                } else {
                    navigate('glamathome_home_screen');
                }
                return;
            }
        }
    });

    // 3. Restore last active screen or default to home screen
    const startScreen = localStorage.getItem('currentScreen') || 'glamathome_home_screen';
    if (document.getElementById(`screen-${startScreen}`)) {
        navigate(startScreen);
    } else {
        navigate('glamathome_home_screen');
    }
});
