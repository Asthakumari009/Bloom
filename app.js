document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing app...");
    initializeApp();
});

function initializeApp() {
    console.log("initializeApp started.");

    // --- 1. CONFIGURATION ---
    const firebaseConfig = {
        apiKey: "AIzaSyBM1NmAkbitESATrLoDEejieWBq7DYnMUM", // Replace with your actual Firebase API key
        authDomain: "notionclonedashboard.firebaseapp.com",
        projectId: "notionclonedashboard",
        storageBucket: "notionclonedashboard.appspot.com",
        messagingSenderId: "759664241290",
        appId: "1:759664241290:web:6013f297f6df262f329b73"
    };

    // Initialize Firebase, ensuring it's only done once
    let auth, db;
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully.");
        }
        auth = firebase.auth();
        db = firebase.firestore();
        // Expose for debugging and for template files to use
        window.firebaseAuth = auth;
        window.firebaseDb = db;
    } catch (error) {
        console.error("CRITICAL: Firebase SDK initialization failed:", error);
        alert("Failed to connect to backend services. The app cannot start.");
        return;
    }
    
    // --- ROBUST GLOBAL SAVE FUNCTION FOR TEMPLATES ---
    window.saveTemplateData = async (pageId, dataToSave) => {
        if (!window.firebaseAuth || !window.firebaseAuth.currentUser || !pageId) {
            console.error("Save failed: User not logged in or pageId missing.");
            return;
        }
        const userId = window.firebaseAuth.currentUser.uid;
        const docRef = window.firebaseDb.collection('users').doc(userId).collection('templatePages').doc(pageId);
        try {
            await docRef.update({ data: dataToSave }); 
            console.log(`Template data updated successfully for pageId: ${pageId}`);
        } catch (error) {
            console.warn("Update failed, likely a new page. Attempting to set data instead. Error:", error.message);
            try {
                await docRef.set({ data: dataToSave }, { merge: true });
                console.log(`Template data SET successfully for pageId: ${pageId}`);
            } catch (setError) {
                 console.error("CRITICAL: Both update and set failed for template data:", setError);
            }
        }
    };


    // --- 2. DOM ELEMENT SELECTION ---
    const getEl = (id) => document.getElementById(id);

    const appLoader = getEl('app-loader');
    const welcomeSplash = getEl('welcome-splash');
    const toastNotification = getEl('toast-notification');
    const toastMessage = getEl('toast-message');
    const toastIcon = getEl('toast-icon');
    const allNavItems = document.querySelectorAll('.nav-item');
    const allPages = document.querySelectorAll('.page');
    const sidebar = getEl('sidebar');
    const sidebarGreeting = getEl('sidebar-greeting');
    const mainGreeting = getEl('main-greeting');
    const logoutButton = getEl('logout-button');
    const authNavLinks = getEl('auth-nav-links');
    const loginForm = getEl('login-form');
    const registerForm = getEl('register-form');
    const themeDynamicIslandSwitcher = getEl('theme-dynamic-island-switcher');
    const gettingStartedBtn = getEl('getting-started-btn');
    const dashboardPagesContainer = getEl('dashboard-pages-container');
    const pageEditor = getEl('page-editor');
    const pageEditorContent = getEl('page-editor-content');
    const gettingStartedModal = getEl('getting-started-modal');
    const templateSelectModal = getEl('template-select-modal');
    const deleteConfirmModal = getEl('delete-confirm-modal');
    const confirmDeleteBtn = getEl('confirm-delete-btn');
    const deletePageName = getEl('delete-page-name');
    const filterMenu = getEl('filter-menu');
    const sortMenu = getEl('sort-menu');
    const propertySelectMenu = getEl('property-select-menu');
    const inboxNotificationsContainer = getEl('inbox-notifications-container');
    const inboxEmptyState = getEl('inbox-empty-state');
    const notificationDot = getEl('notification-dot');
    const clearAllNotificationsBtn = getEl('clear-all-notifications-btn');
    const changePasswordBtn = getEl('change-password-btn');
    const deleteAccountBtn = getEl('delete-account-btn');
    const languageSelect = getEl('language-select');
    const clearCacheBtn = getEl('clear-cache-btn');
    const changePasswordModal = getEl('change-password-modal');
    const reauthenticateForm = getEl('reauthenticate-form');
    const deleteAccountConfirmModal = getEl('delete-account-confirm-modal');
    const confirmDeleteAccountForm = getEl('confirm-delete-account-form');
    
    const quoteText = getEl('quote-text');
    const quoteAuthor = getEl('quote-author');

    const propertyHeaderMenu = document.createElement('div');
    propertyHeaderMenu.id = 'property-header-menu';
    propertyHeaderMenu.className = 'dropdown-menu';
    document.body.appendChild(propertyHeaderMenu);

    // --- 3. GLOBAL STATE & DEFINITIONS ---
    let currentUser = null;
    let userPages = []; 
    let activePageData = null; 
    let userNotifications = [];
    let dismissedNotificationIds = {};
    let currentFilters = {};
    let currentSort = { key: null, direction: 'asc' };
    let toastTimeout;
    let typewriterInterval;
    let quoteChangeInterval;

    const quotes = [ { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }, { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }, { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }, { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle Onassis" }, { text: "The best way to predict the future is to create it.", author: "Peter Drucker" }, { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" }, { text: "The mind is everything. What you think you become.", author: "Buddha" }, { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" }, { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" }, { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" }, { text: "The secret of getting ahead is getting started.", author: "Mark Twain" }, { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }, { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" }, { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" }, { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" }, { text: "Dream big and dare to fail.", author: "Norman Vaughan" }, { text: "Don't limit your challenges. Challenge your limits.", author: "Jerry Dunn" }, { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" }, { text: "Success doesn’t come from what you do occasionally. It comes from what you do consistently.", author: "Marie Forleo" }, { text: "Act as if what you do makes a difference. It does.", author: "William James" }, { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" }, { text: "If you’re going through hell, keep going.", author: "Winston Churchill" }, { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" }, { text: "You don’t have to be great to start, but you have to start to be great.", author: "Zig Ziglar" }, { text: "Small steps every day add up to big results.", author: "Unknown" }, { text: "Don’t be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" }, { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" }, { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" }, { text: "Everything you’ve ever wanted is on the other side of fear.", author: "George Addair" } ];
    const propertyTypes = [ { type: 'Text', icon: '📄' }, { type: 'Number', icon: '#' }, { type: 'Select', icon: '🔽' }, { type: 'Status', icon: '🔆' }, { type: 'Date', icon: '📅' }, { type: 'Checkbox', icon: '✅' }, { type: 'URL', icon: '🔗' }, { type: 'Email', icon: '📧' }, ];
    const advancedPropertyTypes = [ { type: 'Formula', icon: '∑' }, { type: 'Relation', icon: '↗️' }, { type: 'Rollup', icon: '🔍' }, { type: 'Created time', icon: '🕒' }, { type: 'Last edited time', icon: '🕒' } ];

    // --- 4. CORE APP LOGIC & HELPERS ---
    const showLoader = (show = true, message = 'Loading...') => { if (!appLoader) return; appLoader.querySelector('p').textContent = message; appLoader.classList.toggle('visible', show); };
    const showToast = (message, type = 'success') => { if (!toastNotification || !toastMessage || !toastIcon) return; clearTimeout(toastTimeout); toastMessage.textContent = message; toastNotification.className = 'toast-notification ' + type; toastIcon.textContent = type === 'success' ? '✅' : '❌'; toastNotification.classList.add('show'); toastTimeout = setTimeout(() => toastNotification.classList.remove('show'), 4000); };
    const showModal = (modal, show = true) => modal && modal.classList.toggle('visible', show);
    const debounce = (func, delay) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), delay); }; };
    const setGreetings = (name = 'Guest') => { const hour = new Date().getHours(); const timeOfDayGreeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"; if (mainGreeting) mainGreeting.textContent = `${timeOfDayGreeting}, ${name}! 👋`; if (sidebarGreeting) sidebarGreeting.textContent = `👋 Hi, ${name}`; };
    const showPage = (pageId) => { allPages.forEach(p => p.classList.toggle('active', p.id === pageId)); allNavItems.forEach(item => item.classList.toggle('active', item.dataset.target === pageId)); };
    const showDropdown = (buttonEl, menuEl) => { document.querySelectorAll('.dropdown-menu').forEach(m => { if (m !== menuEl) m.classList.remove('visible'); }); const rect = buttonEl.getBoundingClientRect(); let top = rect.bottom + 5; let left = rect.right - menuEl.offsetWidth; if (left < 10) left = 10; if (top + menuEl.offsetHeight > window.innerHeight - 10) { top = rect.top - menuEl.offsetHeight - 5; } menuEl.style.left = `${left}px`; menuEl.style.top = `${top}px`; menuEl.classList.toggle('visible'); };
    const updateNotificationDot = () => { if (!notificationDot) return; const unreadCount = userNotifications.length; notificationDot.classList.toggle('visible', unreadCount > 0); notificationDot.textContent = unreadCount > 99 ? '99+' : unreadCount; };
    const applyTheme = (theme) => { document.body.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); if (currentUser && db) { db.collection('users').doc(currentUser.uid).update({ theme }).catch(err => console.error("Error saving theme:", err)); } };
    const sanitizeDataForFirestore = (data) => { if (data === null || data === undefined) return data; if (Array.isArray(data)) return data.map(item => sanitizeDataForFirestore(item)); if (typeof data === 'object' && data.constructor === Object) { const sanitizedObject = {}; for (const key in data) { if (data.hasOwnProperty(key)) { if (key === 'id' && typeof data[key] === 'number') { sanitizedObject[key] = String(data[key]); } else { sanitizedObject[key] = sanitizeDataForFirestore(data[key]); } } } return sanitizedObject; } return data; };
    const displayRandomQuote = () => { if (!quoteText || !quoteAuthor) return; clearInterval(typewriterInterval); quoteText.textContent = ''; quoteAuthor.textContent = ''; quoteAuthor.classList.remove('visible'); const randomIndex = Math.floor(Math.random() * quotes.length); const { text, author } = quotes[randomIndex]; let i = 0; const speed = 30; quoteText.style.borderRight = '.15em solid var(--quote-card-text)'; quoteText.style.animation = 'blinkCaret 1s step-end infinite'; function typeWriter() { if (i < text.length) { quoteText.textContent += text.charAt(i); i++; typewriterInterval = setTimeout(typeWriter, speed); } else { quoteAuthor.textContent = `- ${author}`; quoteAuthor.classList.add('visible'); quoteText.style.borderRight = 'none'; quoteText.style.animation = 'none'; } } typeWriter(); };
    const startAutoQuoteChange = () => { if (quoteChangeInterval) clearInterval(quoteChangeInterval); displayRandomQuote(); quoteChangeInterval = setInterval(displayRandomQuote, 15000); };
    const stopAutoQuoteChange = () => { if (quoteChangeInterval) clearInterval(quoteChangeInterval); if (typewriterInterval) clearInterval(typewriterInterval); if (quoteText) { quoteText.textContent = "Loading a dash of inspiration..."; quoteText.style.borderRight = 'none'; quoteText.style.animation = 'none'; } if (quoteAuthor) { quoteAuthor.textContent = ""; quoteAuthor.classList.remove('visible'); } };

    // --- 5. DATA MANAGEMENT ---
    const migrateLocalStorageToFirestore = async () => { if (!currentUser) return; const userDocRef = db.collection('users').doc(currentUser.uid); const userDoc = await userDocRef.get(); if (userDoc.exists && userDoc.data().localStorageMigrated) { return; } console.log("Starting one-time migration of Local Storage to Firestore..."); showLoader(true, 'Upgrading your account...'); try { const theme = localStorage.getItem('theme') || 'dark'; const dismissedNotifications = JSON.parse(localStorage.getItem(`dismissedNotifications_${currentUser.uid}`) || '{}'); const externalDashboards = JSON.parse(localStorage.getItem('externalDashboards') || '[]'); const batch = db.batch(); if (externalDashboards.length > 0) { for (const pageMeta of externalDashboards) { const pageId = pageMeta.id; let dataKeyPrefix = ''; if (pageMeta.type === 'shopping_cart') dataKeyPrefix = 'shopping_cart_data_'; else if (pageMeta.type === 'template_dashboard') dataKeyPrefix = 'dashboard_data_'; else if (pageMeta.type === 'pro_tracker') dataKeyPrefix = 'tracker_data_'; else if (pageMeta.type === 'workspace') dataKeyPrefix = 'workspace_data_'; else if (pageMeta.type === 'yearly-vision') dataKeyPrefix = `yearlyVisionBoardData_`; const pageContentJSON = localStorage.getItem(dataKeyPrefix + pageId); let pageContent = pageContentJSON ? JSON.parse(pageContentJSON) : {}; pageContent = sanitizeDataForFirestore(pageContent); const newDocRef = db.collection('users').doc(currentUser.uid).collection('templatePages').doc(pageId); const firestoreDoc = { ...pageMeta, createdAt: new Date().toISOString(), data: pageContent }; batch.set(newDocRef, firestoreDoc); } } batch.update(userDocRef, { localStorageMigrated: true, theme, dismissedNotifications }); await batch.commit(); externalDashboards.forEach(pageMeta => { let dataKeyPrefix = ''; if (pageMeta.type === 'shopping_cart') dataKeyPrefix = 'shopping_cart_data_'; else if (pageMeta.type === 'template_dashboard') dataKeyPrefix = 'dashboard_data_'; else if (pageMeta.type === 'pro_tracker') dataKeyPrefix = 'tracker_data_'; else if (pageMeta.type === 'workspace') dataKeyPrefix = 'workspace_data_'; else if (pageMeta.type === 'yearly-vision') dataKeyPrefix = `yearlyVisionBoardData_`; localStorage.removeItem(dataKeyPrefix + pageId); }); localStorage.removeItem('externalDashboards'); localStorage.removeItem(`dismissedNotifications_${currentUser.uid}`); localStorage.removeItem('theme'); showToast("Your account has been upgraded successfully!", "success"); } catch (error) { console.error("CRITICAL: Failed during data migration:", error); showToast("There was an error upgrading your account.", "error"); } finally { showLoader(false); } };
    const fetchUserPages = async () => { if (!currentUser) { userPages = []; return; } try { const nativePagesPromise = db.collection('users').doc(currentUser.uid).collection('pages').orderBy('createdAt', 'desc').get(); const templatePagesPromise = db.collection('users').doc(currentUser.uid).collection('templatePages').orderBy('createdAt', 'desc').get(); const [nativePagesSnapshot, templatePagesSnapshot] = await Promise.all([nativePagesPromise, templatePagesPromise]); const nativePages = nativePagesSnapshot.docs.map(doc => ({ id: doc.id, pageType: 'native', ...doc.data() })); const templatePages = templatePagesSnapshot.docs.map(doc => ({ id: doc.id, pageType: 'template', ...doc.data() })); userPages = [...nativePages, ...templatePages]; console.log(`Fetched ${userPages.length} total pages.`); } catch (error) { console.error("Error fetching pages:", error); showToast("Failed to load your pages.", "error"); userPages = []; } };
    const saveActivePageData = async (rerender = false) => { if (!currentUser || !activePageData || !activePageData.id) return; try { const pageToSave = JSON.parse(JSON.stringify(activePageData)); await db.collection('users').doc(currentUser.uid).collection('pages').doc(pageToSave.id).set(pageToSave, { merge: true }); const index = userPages.findIndex(p => p.id === pageToSave.id); if (index > -1) userPages[index] = { ...userPages[index], ...pageToSave }; if (rerender) renderPageEditor(); generateNotifications(); } catch (error) { console.error("Error saving page:", error); showToast('Failed to save page.', 'error'); } };
    const createNewPage = async (type) => { if (!currentUser) { showToast("Please log in to create pages.", "error"); return; } const defaultName = `New ${type.charAt(0).toUpperCase() + type.slice(1)}`; const pageName = prompt("Enter a name for your new page:", defaultName); if (!pageName || pageName.trim() === "") { showToast("Page creation cancelled.", "info"); return; } let structure; if (type === 'list') { structure = [{ name: 'Item', type: 'Text', fixed: true }, { name: 'Done', type: 'Checkbox' }]; } else if (type === 'table') { structure = [{ name: 'Name', type: 'Text', fixed: true }, { name: 'Status', type: 'Status', options: ['Todo', 'In Progress', 'Done'] }, { name: 'Date', type: 'Date' }]; } else { return; } const newPage = { name: pageName.trim(), type, structure, data: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() }; try { const docRef = await db.collection('users').doc(currentUser.uid).collection('pages').add(newPage); newPage.id = docRef.id; userPages.unshift({ ...newPage, pageType: 'native', createdAt: { toDate: () => new Date() } }); activePageData = newPage; renderPageEditor(); showPage('page-editor'); generateNotifications(); showToast('New page created!', 'success'); } catch (error) { console.error("Error creating new page:", error); showToast('Could not create page.', 'error'); } };
    const deletePage = async (pageId) => { const pageToDelete = userPages.find(p => p.id === pageId); if (!pageToDelete) return; if (deletePageName) deletePageName.textContent = pageToDelete.name; showModal(deleteConfirmModal, true); confirmDeleteBtn.onclick = async () => { showModal(deleteConfirmModal, false); if (!currentUser) return; try { await db.collection('users').doc(currentUser.uid).collection('pages').doc(pageId).delete(); userPages = userPages.filter(p => p.id !== pageId); if (activePageData && activePageData.id === pageId) activePageData = null; renderDashboard(); generateNotifications(); showToast('Page deleted successfully.', 'success'); } catch (error) { console.error("Error deleting page:", error); showToast('Error deleting page.', 'error'); } }; };
    const deleteTemplatePage = async (pageId) => { const pageToDelete = userPages.find(p => p.id === pageId); if (!pageToDelete) return; if (deletePageName) deletePageName.textContent = pageToDelete.name; showModal(deleteConfirmModal, true); confirmDeleteBtn.onclick = async () => { showModal(deleteConfirmModal, false); if (!currentUser) return; try { await db.collection('users').doc(currentUser.uid).collection('templatePages').doc(pageId).delete(); userPages = userPages.filter(p => p.id !== pageId); renderDashboard(); generateNotifications(); showToast('Template deleted successfully.', 'success'); } catch (error) { console.error("Error deleting template page:", error); showToast('Error deleting template.', 'error'); } }; };

    // --- 6. RENDERING ---
    const renderDashboard = () => { if (!dashboardPagesContainer) return; dashboardPagesContainer.innerHTML = ''; startAutoQuoteChange(); if (userPages.length === 0) { dashboardPagesContainer.innerHTML = `<div class="empty-state"><h3>You haven't created anything yet.</h3><p>Click ‘Getting Started’ to begin!</p></div>`; return; } const cardsHTML = userPages.map((page, index) => { const description = page.pageType === 'native' ? `${page.data?.length || 0} items` : `${page.type.replace(/_/g, ' ').replace('yearly-vision', 'Vision Board')} Template`; return ` <div class="page-card new-item-animation" style="--animation-order: ${index}" data-page-id="${page.id}" data-page-type="${page.pageType}"> <h3 data-page-id="${page.id}" contenteditable="true">${page.name || 'Untitled'}</h3> <p>${description}</p> <button class="card-action-delete-btn" title="Delete Page" data-page-id="${page.id}" data-page-type="${page.pageType}"> <i class="fas fa-trash-alt"></i> </button> </div>`; }).join(''); dashboardPagesContainer.innerHTML += cardsHTML; generateNotifications(); };
    const renderPageEditor = () => { stopAutoQuoteChange(); if (!pageEditorContent || !activePageData) return; currentFilters = {}; currentSort = { key: null, direction: 'asc' }; const toolbarHTML = ` <div class="table-toolbar"> <div class="toolbar-group"> <button class="toolbar-btn primary" id="add-row-btn"><span>+</span> New</button> <div class="search-bar"><span class="search-icon">🔍</span><input type="text" id="search-input" placeholder="Search in this view..."></div> </div> <div class="toolbar-group"> <div class="dropdown-container"><button class="toolbar-btn" id="filter-btn">Filter</button></div> <div class="dropdown-container"><button class="toolbar-btn" id="sort-btn">Sort</button></div> <div class="dropdown-container"><button class="toolbar-btn" id="add-new-property-btn"><span>+</span> New Property</button></div> <button class="toolbar-btn" id="fullscreen-btn" title="Toggle Full-width">↔</button> </div> </div>`; const viewHTML = (activePageData.type === 'list') ? `<div class="list-view"></div>` : `<div class="view-container-wrapper"><table class="dynamic-table"><thead></thead><tbody></tbody></table></div>`; pageEditorContent.innerHTML = `<h1 class="guide-title" contenteditable="true">${activePageData.name}</h1> ${toolbarHTML} ${viewHTML}`; populateDropdowns(); applyFiltersAndSort(); };
    const populateDropdowns = () => { if (!activePageData || !activePageData.structure) return; const { structure } = activePageData; let filterHTML = '<h4>Filter by</h4>'; const statusProp = structure.find(p => p.type === 'Status'); if (statusProp) { const options = statusProp.options || ['Todo', 'In Progress', 'Done']; filterHTML += `<div class="filter-group"><label>${statusProp.name}</label><select id="status-filter"><option value="">All</option>${options.map(o => `<option value="${o}">${o}</option>`).join('')}</select></div>`; } const checkboxProp = structure.find(p => p.type === 'Checkbox'); if (checkboxProp) { filterHTML += `<div class="filter-group"><label>${checkboxProp.name}</label><select id="checkbox-filter"><option value="">All</option><option value="checked">Checked</option><option value="unchecked">Unchecked</option></select></div>`; } if (filterMenu) filterMenu.innerHTML = filterHTML.includes('filter-group') ? filterHTML : '<h4>No properties to filter by</h4>'; if (sortMenu) sortMenu.innerHTML = '<h4>Sort by</h4>' + structure.map(p => `<div class="dropdown-item" data-sort-key="${p.name}">${p.name}</div>`).join(''); };
    const renderTableView = (dataToRender) => { if (!activePageData || !activePageData.structure) return; const { structure } = activePageData; const table = pageEditorContent.querySelector('.dynamic-table'); if (!table) return; const headerHTML = `<tr>${structure.filter(p => !p.hidden).map(p => `<th data-prop-name="${p.name}"><div class="header-cell" ${p.fixed ? 'data-fixed="true"' : ''}><span class="prop-name-display">${p.name}</span>${p.fixed ? '' : `<button class="prop-menu-btn" data-prop-name="${p.name}">⋮</button>`}</div></th>`).join('')}<th></th></tr>`; const bodyHTML = (dataToRender || []).map((row, index) => `<tr class="new-item-animation" style="--animation-order: ${index}" data-row-id="${row.id}">${structure.filter(p => !p.hidden).map(p => `<td data-prop-name="${p.name}">${renderCell(row, p)}</td>`).join('')}<td><button class="delete-row-btn" title="Delete row">🗑️</button></td></tr>`).join(''); table.querySelector('thead').innerHTML = headerHTML; table.querySelector('tbody').innerHTML = bodyHTML; };
    const renderListView = (dataToRender) => { if (!activePageData || !activePageData.structure) return; const { structure } = activePageData; const listView = pageEditorContent.querySelector('.list-view'); if (!listView) return; const doneProp = structure.find(p => p.type === 'Checkbox'); const titleProp = structure.find(p => p.type === 'Text') || structure[0]; listView.innerHTML = (dataToRender || []).map((row, index) => { const isDone = doneProp ? !!row[doneProp.name] : false; return `<div class="list-item new-item-animation" style="--animation-order: ${index}" data-row-id="${row.id}"> ${doneProp ? `<input type="checkbox" class="list-item-checkbox inline-checkbox" data-prop-name="${doneProp.name}" ${isDone ? 'checked' : ''}>` : ''} <div class="list-item-content"> <div class="list-item-title ${isDone ? 'completed' : ''}" data-prop-name="${titleProp?.name}" contenteditable="true">${row[titleProp?.name] || ''}</div> <div class="list-item-meta">${structure.filter(p => !p.hidden && p !== titleProp && p !== doneProp).map(p => renderCell(row, p, true)).join('')}</div> </div> <button class="delete-row-btn" title="Delete row">🗑️</button> </div>`; }).join(''); };
    const renderCell = (row, prop) => { const value = row[prop.name] || ''; if (prop.type === 'Status') { const statusClass = value ? String(value).toLowerCase().replace(/\s+/g, '-') : 'empty'; return `<div class="status-tag ${statusClass}" data-prop-name="${prop.name}"><span class="status-dot"></span>${value || 'Set Status'}</div>`; } if (prop.type === 'Checkbox') return `<div style="text-align: center;"><input type="checkbox" class="inline-checkbox" data-prop-name="${prop.name}" ${value ? 'checked' : ''}></div>`; if (prop.type === 'Date') return `<input type="date" class="cell-date" data-prop-name="${prop.name}" value="${value}">`; return `<div class="cell-content" data-prop-name="${prop.name}" contenteditable="true">${value}</div>`; };
    const renderPropertySelectMenu = () => { const basicProps = propertyTypes.map(p => `<div class="property-option" data-type="${p.type}"><span class="prop-icon">${p.icon}</span> <span>${p.type}</span></div>`).join(''); const advancedProps = advancedPropertyTypes.map(p => `<div class="property-option" data-type="${p.type}"><span class="prop-icon">${p.icon}</span> <span>${p.type}</span></div>`).join(''); propertySelectMenu.innerHTML = `<div class="property-select-grid">${basicProps}</div><div class="property-group"><div class="property-group-title">Advanced</div><div class="property-select-grid">${advancedProps}</div></div>`; };
    const applyFiltersAndSort = () => { if (!activePageData || !activePageData.data) return; let processedData = [...activePageData.data]; const searchTerm = pageEditorContent.querySelector('#search-input')?.value.toLowerCase().trim() || ''; if (searchTerm) { const visibleProps = activePageData.structure.filter(p => !p.hidden).map(p => p.name); processedData = processedData.filter(row => visibleProps.some(propName => String(row[propName]).toLowerCase().includes(searchTerm))); } if (activePageData.type === 'list') renderListView(processedData); else renderTableView(processedData); };

    // --- 7. EVENT HANDLERS ---
    const initEventListeners = () => {
        if (themeDynamicIslandSwitcher) themeDynamicIslandSwitcher.addEventListener('click', () => applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
        if (logoutButton) logoutButton.addEventListener('click', () => auth.signOut().catch(error => console.error("Logout error:", error)));
        if (loginForm) loginForm.addEventListener('submit', handleAuth);
        if (registerForm) registerForm.addEventListener('submit', handleAuth);
        if (gettingStartedBtn) gettingStartedBtn.addEventListener('click', () => showModal(gettingStartedModal, true));
        
        allNavItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const targetPageId = e.currentTarget.dataset.target;
                
                if (targetPageId !== 'page-editor') {
                    activePageData = null;
                }
                
                showPage(targetPageId);

                if (targetPageId === 'dashboard' || targetPageId === 'inbox') {
                    showLoader(true, 'Refreshing...');
                    await fetchUserPages();
                    showLoader(false);
                }

                if (targetPageId === 'dashboard') {
                    renderDashboard();
                    startAutoQuoteChange();
                } else {
                    stopAutoQuoteChange();
                    if (targetPageId === 'inbox') {
                        generateNotifications();
                    }
                }
            });
        });

        if (dashboardPagesContainer) {
            dashboardPagesContainer.addEventListener('click', handleDashboardClick);
            dashboardPagesContainer.addEventListener('focusout', (e) => { if (e.target.matches('.page-card h3[contenteditable="true"]')) handleDashboardCardRename(e.target); });
            dashboardPagesContainer.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.page-card h3[contenteditable="true"]')) { e.preventDefault(); e.target.blur(); } });
        }

        if (pageEditorContent) {
            pageEditorContent.addEventListener('click', handlePageEditorClick);
            const debouncedFilter = debounce(applyFiltersAndSort, 300);
            pageEditorContent.addEventListener('input', (e) => { if (e.target.matches('#search-input')) debouncedFilter(); });
            pageEditorContent.addEventListener('focusout', (e) => handleCellEdit(e.target));
            pageEditorContent.addEventListener('change', handleMasterChange);
            pageEditorContent.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('[contenteditable]')) { e.preventDefault(); e.target.blur(); } });
        }

        if (gettingStartedModal) gettingStartedModal.addEventListener('click', handleGettingStartedClick);
        if (templateSelectModal) templateSelectModal.addEventListener('click', handleGettingStartedClick);
        document.querySelectorAll('.modal-close, .modal-bg').forEach(el => el.addEventListener('click', (e) => { if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-bg')) showModal(el.closest('.modal'), false); }));
        document.addEventListener('click', (e) => { if (!e.target.closest('.dropdown-container') && !e.target.closest('.dropdown-menu') && !e.target.closest('.prop-menu-btn')) document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('visible')); });
        if (propertySelectMenu) propertySelectMenu.addEventListener('click', handlePropertyMenuClick);
        if (propertyHeaderMenu) propertyHeaderMenu.addEventListener('click', handlePropertyMenuClick);
        if (inboxNotificationsContainer) inboxNotificationsContainer.addEventListener('click', (e) => { if (e.target.closest('.notification-dismiss-btn')) dismissNotification(e.target.closest('.notification-dismiss-btn').dataset.notificationId); });
        if (clearAllNotificationsBtn) clearAllNotificationsBtn.addEventListener('click', clearAllNotifications);
        if (changePasswordBtn) changePasswordBtn.addEventListener('click', () => showModal(changePasswordModal, true));
        if (reauthenticateForm) reauthenticateForm.addEventListener('submit', handleChangePassword);
        if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', () => showModal(deleteAccountConfirmModal, true));
        if (confirmDeleteAccountForm) confirmDeleteAccountForm.addEventListener('submit', handleDeleteAccount);
        if (languageSelect) languageSelect.addEventListener('change', handleLanguageChange);
        if (clearCacheBtn) clearCacheBtn.addEventListener('click', handleClearCache);
    };

    const handleAuth = (e) => { e.preventDefault(); const form = e.target; const submitButton = form.querySelector('button[type="submit"]'); const originalButtonText = submitButton.textContent; submitButton.textContent = 'Processing...'; submitButton.disabled = true; const isRegister = form.id === 'register-form'; const email = form.querySelector('input[type="email"]').value.trim(); const password = form.querySelector('input[type="password"]').value; const username = isRegister ? form.querySelector('#register-username').value.trim() : ''; let authPromise = isRegister ? auth.createUserWithEmailAndPassword(email, password).then(cred => cred.user.updateProfile({ displayName: username }).then(() => cred)) : auth.signInWithEmailAndPassword(email, password); authPromise.then(() => showToast(isRegister ? 'Account created!' : 'Login successful!', 'success')).catch(err => showToast(err.message, 'error')).finally(() => { submitButton.textContent = originalButtonText; submitButton.disabled = false; }); };
    const handleDashboardClick = (e) => { const card = e.target.closest('.page-card'); if (!card) return; const pageId = card.dataset.pageId; const pageType = card.dataset.pageType; if (e.target.closest('.card-action-delete-btn')) { e.stopPropagation(); if (pageType === 'native') deletePage(pageId); else deleteTemplatePage(pageId); return; } const page = userPages.find(p => p.id === pageId); if (!page) { showToast("Could not find page data.", "error"); return; } if (page.pageType === 'native') { activePageData = JSON.parse(JSON.stringify(page)); showPage('page-editor'); renderPageEditor(); } else { stopAutoQuoteChange(); window.location.href = `${page.templateFile}?id=${page.id}`; } };
    const handleDashboardCardRename = async (target) => { const newName = target.textContent.trim(); const pageId = target.dataset.pageId; const pageType = target.closest('.page-card')?.dataset.pageType; const originalPage = userPages.find(p => p.id === pageId); if (!originalPage || !newName || originalPage.name === newName) { if (!newName) target.textContent = originalPage.name; return; } try { const dataUpdate = { name: newName }; if (pageType === 'template') { dataUpdate['data.title'] = newName; dataUpdate['data.mainTitle'] = newName; } const collectionName = pageType === 'native' ? 'pages' : 'templatePages'; await db.collection('users').doc(currentUser.uid).collection(collectionName).doc(pageId).update(dataUpdate); originalPage.name = newName; if (originalPage.data) { originalPage.data.title = newName; originalPage.data.mainTitle = newName; } showToast('Page renamed.', 'success'); } catch (error) { console.error("Error renaming page:", error); showToast('Failed to rename page.', 'error'); target.textContent = originalPage.name; } };
    const handleGettingStartedClick = async (e) => { const createBtn = e.target.closest('button[data-type]'); const templateLink = e.target.closest('a[data-template-id]'); if (createBtn) { showModal(gettingStartedModal, false); const type = createBtn.dataset.type; if (type === 'template') { showModal(templateSelectModal, true); } else { createNewPage(type); } } else if (templateLink) { e.preventDefault(); if (!currentUser) { showToast("Please log in to create a template.", "error"); return; } const templateType = templateLink.dataset.templateId; const templateFile = templateLink.dataset.templateFile; const defaultName = templateLink.querySelector('.template-card-title').textContent; const pageName = prompt("Enter a name for your new template:", defaultName); if (!pageName || pageName.trim() === "") return; showLoader(true, 'Creating your template...'); try { const newDocRef = db.collection('users').doc(currentUser.uid).collection('templatePages').doc(); const newPageId = newDocRef.id; const newTemplatePage = { id: newPageId, name: pageName.trim(), type: templateType, templateFile, createdAt: new Date().toISOString(), data: { title: pageName.trim(), mainTitle: pageName.trim() } }; await newDocRef.set(newTemplatePage); userPages.unshift({ ...newTemplatePage, pageType: 'template' }); renderDashboard(); showToast("Template created successfully!", "success"); stopAutoQuoteChange(); window.location.href = `${templateFile}?id=${newPageId}`; } catch (error) { console.error("Error creating new template instance:", error); showToast("Could not create new template.", "error"); } finally { showLoader(false); } } };
    const handleCellEdit = (target) => { if (!target || !activePageData) return; const rowId = target.closest('[data-row-id]')?.dataset.rowId; const propName = target.dataset.propName || target.closest('[data-prop-name]')?.dataset.propName; if (rowId && propName) { const row = activePageData.data.find(r => r.id === rowId); if (!row) return; let newValue = target.matches('input[type="checkbox"]') ? target.checked : target.value?.trim() ?? target.textContent.trim(); if (String(row[propName]) !== String(newValue)) { row[propName] = newValue; saveActivePageData(); } } else if (target.matches('.prop-name-display[contenteditable="true"]')) { target.removeAttribute('contenteditable'); const oldPropName = target.closest('.header-cell').dataset.propName; const newPropName = target.textContent.trim(); if (oldPropName !== newPropName && newPropName) { if (activePageData.structure.some(p => p.name === newPropName)) { showToast(`A property named "${newPropName}" already exists.`, 'error'); target.textContent = oldPropName; return; } const prop = activePageData.structure.find(p => p.name === oldPropName); if (prop) prop.name = newPropName; activePageData.data.forEach(row => { if (Object.prototype.hasOwnProperty.call(row, oldPropName)) { row[newPropName] = row[oldPropName]; delete row[oldPropName]; } }); saveActivePageData(true); showToast(`Property renamed to "${newPropName}".`, 'success'); } else { target.textContent = oldPropName; } } else if (target.matches('.guide-title')) { const newName = target.textContent.trim(); if (activePageData.name !== newName && newName) { activePageData.name = newName; saveActivePageData(); } } };
    const handleMasterChange = (e) => { const target = e.target; if (target.matches('.list-item-checkbox')) target.closest('.list-item').querySelector('.list-item-title').classList.toggle('completed', target.checked); handleCellEdit(target); };
    const handlePropertyMenuClick = (e) => { const propMenuItem = e.target.closest('.dropdown-item, .property-option'); if (!propMenuItem) return; if (propertyHeaderMenu) propertyHeaderMenu.classList.remove('visible'); if (propertySelectMenu) propertySelectMenu.classList.remove('visible'); const action = propMenuItem.dataset.action; const propName = propMenuItem.dataset.propName; const type = propMenuItem.dataset.type; if (action === 'rename-property') { const propNameDisplay = pageEditorContent.querySelector(`.header-cell[data-prop-name="${propName}"] .prop-name-display`); if (propNameDisplay) { propNameDisplay.setAttribute('contenteditable', 'true'); propNameDisplay.focus(); document.execCommand('selectAll', false, null); } } else if (action === 'delete-property') { deletePropertyColumn(propName); } else if (type) { addProperty(type); } };
    const handleChangePassword = async (e) => { e.preventDefault(); if (!currentUser) { showToast("You must be logged in.", "error"); return; } const { 'current-password-reauth': currentPassword, 'new-password-input': newPassword, 'confirm-new-password-input': confirmNewPassword } = e.target.elements; if (newPassword.value !== confirmNewPassword.value) { showToast("New passwords do not match.", "error"); return; } if (newPassword.value.length < 6) { showToast("New password must be at least 6 characters.", "error"); return; } showLoader(true, 'Updating password...'); try { const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword.value); await currentUser.reauthenticateWithCredential(credential); await currentUser.updatePassword(newPassword.value); showToast("Password updated successfully!", "success"); showModal(changePasswordModal, false); e.target.reset(); } catch (error) { let msg = "Failed to change password. Please try again."; if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Current password is incorrect."; showToast(msg, "error"); } finally { showLoader(false); } };
    const handleDeleteAccount = async (e) => { e.preventDefault(); if (!currentUser) { showToast("You must be logged in.", "error"); return; } const currentPassword = e.target.elements['current-password-delete'].value; showLoader(true, 'Deleting account and all your data...'); try { const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword); await currentUser.reauthenticateWithCredential(credential); const userIdToDelete = currentUser.uid; const pagesRef = db.collection('users').doc(userIdToDelete).collection('pages'); const templatePagesRef = db.collection('users').doc(userIdToDelete).collection('templatePages'); const pagesSnapshot = await pagesRef.get(); const templatePagesSnapshot = await templatePagesRef.get(); const batch = db.batch(); pagesSnapshot.docs.forEach(doc => batch.delete(doc.ref)); templatePagesSnapshot.docs.forEach(doc => batch.delete(doc.ref)); await batch.commit(); await db.collection('users').doc(userIdToDelete).delete(); await currentUser.delete(); showToast("Your account has been permanently deleted.", "success"); showModal(deleteAccountConfirmModal, false); e.target.reset(); } catch (error) { let msg = "Failed to delete account. Please try again."; if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Incorrect password."; showToast(msg, "error"); } finally { showLoader(false); } };
    const handleLanguageChange = async (e) => { if (!currentUser) { showToast("Please log in to save your preference.", "error"); return; } const selectedLanguage = e.target.value; showLoader(true, 'Saving preference...'); try { await db.collection('users').doc(currentUser.uid).update({ language: selectedLanguage }); showToast(`Language set to ${e.target.options[e.target.selectedIndex].text}.`, "success"); } catch (error) { showToast("Failed to save language preference.", "error"); } finally { showLoader(false); } };
    const handleClearCache = () => { if (confirm("Are you sure? This will clear local app data and log you out. Your saved pages are safe in the cloud.")) { Object.keys(localStorage).forEach(key => localStorage.removeItem(key)); location.reload(); } };
    const handlePageEditorClick = (e) => { const target = e.target; if (target.closest('#add-row-btn')) addNewTaskInline(); else if (target.closest('.delete-row-btn')) { const rowId = target.closest('[data-row-id]').dataset.rowId; activePageData.data = activePageData.data.filter(row => row.id !== rowId); applyFiltersAndSort(); saveActivePageData(); } else if (target.closest('#filter-btn')) showDropdown(target.closest('#filter-btn'), filterMenu); else if (target.closest('#sort-btn')) showDropdown(target.closest('#sort-btn'), sortMenu); else if (target.closest('#add-new-property-btn')) { renderPropertySelectMenu(); showDropdown(target.closest('#add-new-property-btn'), propertySelectMenu); } else if (target.closest('#fullscreen-btn')) pageEditor.classList.toggle('full-width'); else if (target.closest('#sort-menu .dropdown-item')) { const key = target.dataset.sortKey; currentSort.key = key; currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc'; applyFiltersAndSort(); } else if (target.closest('.status-tag')) { const rowId = target.closest('[data-row-id]').dataset.rowId; const propName = target.dataset.propName; const row = activePageData.data.find(r => r.id === rowId); const prop = activePageData.structure.find(s => s.name === propName); const currentIndex = prop.options.indexOf(row[propName]); row[propName] = prop.options[(currentIndex + 1) % prop.options.length]; applyFiltersAndSort(); saveActivePageData(); } else if (target.closest('.prop-menu-btn')) { const propName = target.closest('.prop-menu-btn').dataset.propName; const prop = activePageData.structure.find(p => p.name === propName); if (prop && propertyHeaderMenu) { propertyHeaderMenu.innerHTML = `<div class="dropdown-item danger" data-action="delete-property" data-prop-name="${propName}">Delete property</div>`; showDropdown(target.closest('.prop-menu-btn'), propertyHeaderMenu); } } };

    // --- 8. DYNAMIC ACTIONS ---
    const addNewTaskInline = () => { const newRow = { id: db.collection('users').doc().id, createdAt: new Date().toISOString() }; activePageData.structure.forEach(prop => { newRow[prop.name] = ''; }); activePageData.data.unshift(newRow); applyFiltersAndSort(); saveActivePageData(); };
    const deletePropertyColumn = (propName) => { activePageData.structure = activePageData.structure.filter(p => p.name !== propName); activePageData.data.forEach(row => delete row[propName]); saveActivePageData(true); showToast(`Property "${propName}" deleted.`, 'success'); };
    const addProperty = (type) => { let newPropName = type; let counter = 1; while(activePageData.structure.some(p => p.name === newPropName)) { newPropName = `${type} ${counter++}`; } const newProp = { name: newPropName, type }; if (type === 'Status') newProp.options = ['Todo', 'In Progress', 'Done']; activePageData.structure.push(newProp); saveActivePageData(true); };

    // --- 9. NOTIFICATIONS (CORRECTED) ---
    const generateNotifications = () => {
        if (!currentUser) return;
        let newNotifications = [];
        
        userPages.forEach(page => {
            if (!page.data) return;
            
            if (page.pageType === 'native' && page.structure) {
                const isTaskDone = (row) => (page.structure.find(p => p.type === 'Status')?.name && row[page.structure.find(p => p.type === 'Status').name] === 'Done') || (page.structure.find(p => p.type === 'Checkbox')?.name && row[page.structure.find(p => p.type === 'Checkbox').name] === true);
                page.data.forEach(row => {
                    if (!isTaskDone(row)) {
                        const itemName = row['Name'] || row['Item'] || 'Untitled Task';
                        const dateProp = page.structure.find(p => p.type === 'Date');
                        const dueDate = dateProp ? row[dateProp.name] : null;
                        if (dueDate) {
                            const today = new Date(); today.setHours(0, 0, 0, 0);
                            const itemDate = new Date(dueDate); itemDate.setHours(23, 59, 59, 999);
                            const diffDays = Math.ceil((itemDate - today) / (1000 * 60 * 60 * 24));
                            if (diffDays < 1) newNotifications.push({ id: `native-overdue-${page.id}-${row.id}`, message: `"${itemName}" is due or overdue.`, meta: `In: ${page.name}`, type: 'due_date', icon: '🚨', date: itemDate.toISOString() });
                        } else {
                            newNotifications.push({ id: `native-pending-${page.id}-${row.id}`, message: `You have a pending task: "${itemName}".`, meta: `In: ${page.name}`, type: 'pending_item', icon: '📝', date: row.createdAt?.toDate ? row.createdAt.toDate().toISOString() : new Date().toISOString() });
                        }
                    }
                });
            } else if (page.pageType === 'template') {
                switch (page.templateFile) {
                    case 'tracker.html': 
                         (page.data?.courses || []).forEach(course => 
                            (course.assignments || []).forEach(task => { 
                                if (task.grade === null || task.grade === '') {
                                    newNotifications.push({ id: `template-tracker-${page.id}-${task.id}`, message: `Ungraded assignment: "${task.title}".`, meta: `In: ${page.name}`, type: 'pending_item', icon: '🎒', date: new Date().toISOString() });
                                }
                            })
                        ); 
                        break;
                    case 'dashboard.html': 
                        (page.data?.tasks?.items || []).forEach(task => { 
                            if (!task.completed) {
                                newNotifications.push({ id: `template-dashboard-${page.id}-${task.id}`, message: `To-do in Student Dashboard: "${task.text}".`, meta: `In: ${page.name}`, type: 'pending_item', icon: '🎓', date: new Date().toISOString() });
                            }
                        }); 
                        break;
                    case 'shopping-cart.html': 
                        (page.data?.items || []).forEach(item => { 
                            if (!item.purchased) {
                                newNotifications.push({ id: `template-shopping-${page.id}-${item.id}`, message: `Unchecked shopping item: "${item.name}".`, meta: `In: ${page.name}`, type: 'pending_item', icon: '🛒', date: new Date().toISOString() });
                            }
                        }); 
                        break;
                }
            }
        });
        userNotifications = newNotifications.filter(n => !dismissedNotificationIds[n.id]);
        userNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
        updateNotificationDot();
        renderInbox();
    };
    
    const renderInbox = () => { if (!inboxNotificationsContainer || !inboxEmptyState) return; inboxNotificationsContainer.innerHTML = ''; if (userNotifications.length === 0) { inboxEmptyState.style.display = 'flex'; if (clearAllNotificationsBtn) clearAllNotificationsBtn.style.display = 'none'; } else { inboxEmptyState.style.display = 'none'; if (clearAllNotificationsBtn) clearAllNotificationsBtn.style.display = 'inline-flex'; userNotifications.forEach(n => { const item = document.createElement('div'); item.className = `notification-item type-${n.type}`; item.dataset.notificationId = n.id; item.innerHTML = `<span class="notification-icon">${n.icon || '🔔'}</span><div class="notification-content"><p class="notification-message">${n.message}</p><p class="notification-meta">${n.meta} - ${new Date(n.date).toLocaleDateString()}</p></div><button class="notification-dismiss-btn" data-notification-id="${n.id}" title="Dismiss">×</button>`; inboxNotificationsContainer.appendChild(item); }); } };
    const dismissNotification = (id) => { const el = inboxNotificationsContainer.querySelector(`[data-notification-id="${id}"]`); if (el) { el.classList.add('dismissed'); if (currentUser) { dismissedNotificationIds[id] = true; db.collection('users').doc(currentUser.uid).update({ [`dismissedNotifications.${id}`]: true }); } setTimeout(() => { userNotifications = userNotifications.filter(n => n.id !== id); renderInbox(); updateNotificationDot(); }, 400); } };
    
    const clearAllNotifications = () => {
        if (userNotifications.length === 0) { showToast("No notifications to clear.", "info"); return; }
        if (currentUser) {
            const updates = {};
            // Dismiss all *currently visible* notifications. New ones will appear later.
            userNotifications.forEach(n => {
                dismissedNotificationIds[n.id] = true;
                updates[`dismissedNotifications.${n.id}`] = true;
            });
            db.collection('users').doc(currentUser.uid).update(updates);
        }
        
        inboxNotificationsContainer.querySelectorAll('.notification-item').forEach(item => item.classList.add('dismissed'));
        setTimeout(() => {
            userNotifications = [];
            renderInbox();
            updateNotificationDot();
            showToast("All notifications cleared.", "success");
        }, 400);
    };

    // --- 10. APP INITIALIZATION & AUTH ---
    const handleUser = async (user) => { if (user) { showLoader(true, 'Setting up your workspace...'); currentUser = user; try { const userDocRef = db.collection('users').doc(user.uid); const userDoc = await userDocRef.get(); let userData = {}; if (!userDoc.exists) { userData = { displayName: user.displayName || 'New User', email: user.email, createdAt: firebase.firestore.FieldValue.serverTimestamp(), language: 'en', theme: 'dark', dismissedNotifications: {} }; await userDocRef.set(userData); } else { userData = userDoc.data(); } setGreetings(userData.displayName || user.displayName); applyTheme(userData.theme || 'dark'); dismissedNotificationIds = userData.dismissedNotifications || {}; if(languageSelect) languageSelect.value = userData.language || 'en'; await migrateLocalStorageToFirestore(); await fetchUserPages(); if (logoutButton) logoutButton.style.display = 'flex'; if (authNavLinks) authNavLinks.style.display = 'none'; renderDashboard(); showPage('dashboard'); } catch (error) { console.error("Critical error during user setup:", error); showToast("Error loading your data. Please refresh.", "error"); } finally { showLoader(false); } } else { currentUser = null; userPages = []; setGreetings('Guest'); if (logoutButton) logoutButton.style.display = 'none'; if (authNavLinks) authNavLinks.style.display = 'block'; stopAutoQuoteChange(); renderDashboard(); showPage('login'); } updateNotificationDot(); };
    auth.onAuthStateChanged((user) => { showLoader(false); const splashShown = sessionStorage.getItem('bloomSplashShown') === 'true'; if (welcomeSplash && !splashShown) { welcomeSplash.classList.add('show-splash'); sessionStorage.setItem('bloomSplashShown', 'true'); setTimeout(() => { welcomeSplash.classList.remove('show-splash'); setTimeout(() => { if (welcomeSplash) welcomeSplash.style.display = 'none'; handleUser(user); }, 550); }, 2000); } else { if (welcomeSplash) welcomeSplash.style.display = 'none'; handleUser(user); } });

    initEventListeners();
}