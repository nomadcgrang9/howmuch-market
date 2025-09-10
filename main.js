// English Marketplace - Educational Application for Elementary Students
// 영어 마켓플레이스 - 초등학생을 위한 교육용 애플리케이션

// GitHub Pages 호환을 위한 API 설정
const API_BASE_URL = 'https://api.gensparksite.com';

// Game State and Variables
let currentUser = null;
let allUsers = [];
let allItems = [];
let currentTab = 'profile';
let drawingCanvas = null;
let drawingContext = null;
let isDrawing = false;
let drawingHistory = [];
let canvasStates = [];
let currentStateIndex = -1;

// Audio Context for sound effects
let audioContext = null;
let soundEffects = {};

// Initialize audio context when user interacts
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSoundEffects();
    }
}

// Create sound effects
function createSoundEffects() {
    if (!audioContext) return;
    
    // Success sound (higher pitch)
    soundEffects.success = createBeepSound(800, 0.2, 'sine');
    
    // Purchase sound (medium pitch)
    soundEffects.purchase = createBeepSound(600, 0.3, 'square');
    
    // Error sound (lower pitch)
    soundEffects.error = createBeepSound(300, 0.4, 'triangle');
    
    // Level up sound (ascending notes)
    soundEffects.levelUp = createLevelUpSound();
}

function createBeepSound(frequency, duration, waveType = 'sine') {
    return function() {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = waveType;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    };
}

function createLevelUpSound() {
    return function() {
        if (!audioContext) return;
        
        const notes = [523.25, 659.25, 783.99]; // C, E, G
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, index * 100);
        });
    };
}

// Play sound effect
function playSound(soundName) {
    if (soundEffects[soundName]) {
        soundEffects[soundName]();
    }
}

// Level and Badge System
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
const BADGE_REQUIREMENTS = {
    'first_sale': { name: 'First Sale', description: 'Make your first sale', icon: '🎯' },
    'big_spender': { name: 'Big Spender', description: 'Spend 500+ points', icon: '💰' },
    'top_seller': { name: 'Top Seller', description: 'Earn 1000+ from sales', icon: '👑' },
    'artist': { name: 'Artist', description: 'Create a custom item', icon: '🎨' },
    'collector': { name: 'Collector', description: 'Own 10+ items', icon: '📦' },
    'social_butterfly': { name: 'Social Butterfly', description: 'Trade with 5+ different users', icon: '🦋' },
    'bargain_hunter': { name: 'Bargain Hunter', description: 'Buy 5+ items under 50 points', icon: '🔍' },
    'entrepreneur': { name: 'Entrepreneur', description: 'Sell 20+ items', icon: '🚀' },
    'millionaire': { name: 'Millionaire', description: 'Accumulate 10000+ total earnings', icon: '💎' },
    'speed_trader': { name: 'Speed Trader', description: 'Complete 5 transactions in one day', icon: '⚡' }
};

// Item Categories and Rarities
const ITEM_CATEGORIES = {
    'toys': { name: 'Toys', icon: '🧸', color: '#FF6B6B' },
    'books': { name: 'Books', icon: '📚', color: '#4ECDC4' },
    'games': { name: 'Games', icon: '🎮', color: '#45B7D1' },
    'art': { name: 'Art & Crafts', icon: '🎨', color: '#96CEB4' },
    'electronics': { name: 'Electronics', icon: '📱', color: '#FFEAA7' },
    'sports': { name: 'Sports', icon: '⚽', color: '#DDA0DD' },
    'music': { name: 'Music', icon: '🎵', color: '#98D8C8' },
    'food': { name: 'Snacks', icon: '🍪', color: '#F7DC6F' },
    'custom': { name: 'Custom Items', icon: '✨', color: '#BB8FCE' }
};

const RARITY_LEVELS = {
    'common': { name: 'Common', color: '#95A5A6', multiplier: 1 },
    'uncommon': { name: 'Uncommon', color: '#3498DB', multiplier: 1.2 },
    'rare': { name: 'Rare', color: '#9B59B6', multiplier: 1.5 },
    'epic': { name: 'Epic', color: '#E67E22', multiplier: 2 },
    'legendary': { name: 'Legendary', color: '#F1C40F', multiplier: 3 }
};

// Predefined items for the marketplace
const INITIAL_ITEMS = [
    // Toys
    { name: 'Teddy Bear', category: 'toys', price: 150, rarity: 'common', description: 'Soft and cuddly teddy bear' },
    { name: 'LEGO Castle Set', category: 'toys', price: 450, rarity: 'rare', description: 'Medieval castle building set' },
    { name: 'Action Figure', category: 'toys', price: 120, rarity: 'common', description: 'Superhero action figure' },
    { name: 'Rubik\'s Cube', category: 'toys', price: 80, rarity: 'uncommon', description: '3x3 puzzle cube' },
    { name: 'Remote Control Car', category: 'toys', price: 300, rarity: 'epic', description: 'Fast RC racing car' },
    
    // Books
    { name: 'Harry Potter Book', category: 'books', price: 200, rarity: 'uncommon', description: 'Magic adventure novel' },
    { name: 'Comic Book', category: 'books', price: 50, rarity: 'common', description: 'Superhero comic issue' },
    { name: 'Science Encyclopedia', category: 'books', price: 350, rarity: 'rare', description: 'Complete science reference' },
    { name: 'Manga Volume', category: 'books', price: 75, rarity: 'common', description: 'Japanese manga book' },
    { name: 'Rare First Edition', category: 'books', price: 800, rarity: 'legendary', description: 'Collector\'s first edition' },
    
    // Games
    { name: 'Board Game', category: 'games', price: 180, rarity: 'uncommon', description: 'Family strategy game' },
    { name: 'Card Deck', category: 'games', price: 30, rarity: 'common', description: 'Standard playing cards' },
    { name: 'Video Game', category: 'games', price: 400, rarity: 'rare', description: 'Popular adventure game' },
    { name: 'Puzzle 1000pc', category: 'games', price: 120, rarity: 'uncommon', description: '1000 piece jigsaw puzzle' },
    { name: 'Limited Gaming Console', category: 'games', price: 1200, rarity: 'legendary', description: 'Rare limited edition console' },
    
    // Art & Crafts
    { name: 'Colored Pencils', category: 'art', price: 45, rarity: 'common', description: '24-color pencil set' },
    { name: 'Paint Set', category: 'art', price: 85, rarity: 'uncommon', description: 'Acrylic paint collection' },
    { name: 'Sketchbook', category: 'art', price: 60, rarity: 'common', description: 'Professional drawing pad' },
    { name: 'Art Easel', category: 'art', price: 250, rarity: 'rare', description: 'Wooden artist easel' },
    { name: 'Master Art Kit', category: 'art', price: 600, rarity: 'epic', description: 'Professional art supplies' },
    
    // Electronics
    { name: 'Headphones', category: 'electronics', price: 160, rarity: 'uncommon', description: 'Wireless bluetooth headphones' },
    { name: 'Calculator', category: 'electronics', price: 40, rarity: 'common', description: 'Scientific calculator' },
    { name: 'Digital Camera', category: 'electronics', price: 500, rarity: 'epic', description: 'High-quality digital camera' },
    { name: 'Smart Watch', category: 'electronics', price: 350, rarity: 'rare', description: 'Fitness tracking watch' },
    { name: 'Gaming Laptop', category: 'electronics', price: 1500, rarity: 'legendary', description: 'High-performance gaming laptop' },
    
    // Sports
    { name: 'Soccer Ball', category: 'sports', price: 70, rarity: 'common', description: 'Official size soccer ball' },
    { name: 'Basketball', category: 'sports', price: 65, rarity: 'common', description: 'Indoor/outdoor basketball' },
    { name: 'Tennis Racket', category: 'sports', price: 180, rarity: 'uncommon', description: 'Lightweight tennis racket' },
    { name: 'Skateboard', category: 'sports', price: 220, rarity: 'rare', description: 'Complete skateboard setup' },
    { name: 'Professional Bike', category: 'sports', price: 800, rarity: 'epic', description: 'Mountain bike pro edition' }
];

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('English Marketplace Application Starting...');
    
    // Initialize audio on first user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('keydown', initAudioContext, { once: true });
    
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        showLoading(true);
        console.log('Initializing application...');
        
        // Initialize canvas for custom item creation
        initializeCanvas();
        
        // Load existing data
        await loadAllUsers();
        await loadAllItems();
        
        // Set up event listeners
        setupEventListeners();
        
        // Show login screen
        showLoginScreen();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showErrorMessage('Failed to start the application. Please refresh the page.');
    } finally {
        showLoading(false);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Item creation form
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', handleCreateItem);
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }
    
    // Rarity filter
    const rarityFilter = document.getElementById('rarityFilter');
    if (rarityFilter) {
        rarityFilter.addEventListener('change', handleRarityFilter);
    }
    
    // Sort options
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
}

// Show/hide loading spinner
function showLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'flex' : 'none';
    }
}

// Show error message
function showErrorMessage(message) {
    // Create error modal or use alert for now
    alert('Error: ' + message);
}

// Show success message
function showSuccessMessage(message) {
    // Create success modal or use alert for now
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="success-icon">✅</span>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.remove();
    }, 3000);
    
    playSound('success');
}

// Login functionality
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username').trim();
    
    if (!username) {
        showErrorMessage('Please enter a username');
        return;
    }
    
    try {
        showLoading(true);
        
        // Check if user exists
        let user = allUsers.find(u => u.username === username);
        
        if (!user) {
            // Create new user
            user = await createNewUser(username);
            allUsers.push(user);
            showSuccessMessage(`Welcome to the marketplace, ${username}! 🎉`);
        } else {
            showSuccessMessage(`Welcome back, ${username}! 👋`);
        }
        
        currentUser = user;
        
        // Hide login screen and show main app
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Load user interface
        await loadUserInterface();
        
        playSound('success');
        
    } catch (error) {
        console.error('Login failed:', error);
        showErrorMessage('Login failed. Please try again.');
        playSound('error');
    } finally {
        showLoading(false);
    }
}

// Create new user
async function createNewUser(username) {
    const newUser = {
        username: username,
        points: 1000, // Starting points for purchases
        sales_earnings: 0, // Separate earnings from sales
        level: 1,
        badges: [],
        items_owned: [],
        items_sold: [],
        transactions: [],
        join_date: new Date().toISOString(),
        total_spent: 0,
        total_earned: 0,
        avatar: generateAvatar(username)
    };
    
    // Save to database
    const savedUser = await createRecord('users', newUser);
    return savedUser;
}

// Generate simple avatar
function generateAvatar(username) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const color = colors[username.length % colors.length];
    return {
        backgroundColor: color,
        initials: username.substring(0, 2).toUpperCase()
    };
}

// Load user interface after login
async function loadUserInterface() {
    updateUserProfile();
    switchTab('profile');
    populateCreateItemForm();
    await refreshMarketplace();
}

// Update user profile display
function updateUserProfile() {
    if (!currentUser) return;
    
    const profileSection = document.getElementById('profileSection');
    const level = calculateLevel(currentUser.sales_earnings);
    const nextLevelXP = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const currentXP = currentUser.sales_earnings;
    const progressPercent = level < LEVEL_THRESHOLDS.length - 1 
        ? ((currentXP - LEVEL_THRESHOLDS[level - 1]) / (nextLevelXP - LEVEL_THRESHOLDS[level - 1])) * 100
        : 100;
    
    profileSection.innerHTML = `
        <div class="profile-header">
            <div class="avatar" style="background-color: ${currentUser.avatar.backgroundColor}">
                ${currentUser.avatar.initials}
            </div>
            <div class="profile-info">
                <h2>${currentUser.username}</h2>
                <div class="level-badge">Level ${level}</div>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-info">
                    <div class="stat-value">${currentUser.points}</div>
                    <div class="stat-label">Purchase Points</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">💎</div>
                <div class="stat-info">
                    <div class="stat-value">${currentUser.sales_earnings}</div>
                    <div class="stat-label">Sales Earnings</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-info">
                    <div class="stat-value">${currentUser.items_owned.length}</div>
                    <div class="stat-label">Items Owned</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-info">
                    <div class="stat-value">${currentUser.badges.length}</div>
                    <div class="stat-label">Badges Earned</div>
                </div>
            </div>
        </div>
        
        <div class="level-progress">
            <div class="progress-header">
                <span>Level ${level} Progress</span>
                <span>${currentXP}/${nextLevelXP} XP</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        </div>
        
        <div class="badges-section">
            <h3>Badges Collection 🏆</h3>
            <div class="badges-grid">
                ${Object.entries(BADGE_REQUIREMENTS).map(([badgeId, badge]) => `
                    <div class="badge-item ${currentUser.badges.includes(badgeId) ? 'earned' : 'locked'}">
                        <div class="badge-icon">${badge.icon}</div>
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-desc">${badge.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="items-owned-section">
            <h3>My Items 📦</h3>
            <div class="owned-items-grid">
                ${currentUser.items_owned.length > 0 
                    ? currentUser.items_owned.map(itemId => {
                        const item = allItems.find(i => i.id === itemId);
                        return item ? createItemCard(item, true) : '';
                    }).join('')
                    : '<p class="no-items">You don\'t own any items yet. Visit the marketplace to buy some!</p>'
                }
            </div>
        </div>
    `;
}

// Calculate level based on sales earnings
function calculateLevel(earnings) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (earnings >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

// Switch between tabs
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Show appropriate section
    document.querySelectorAll('.tab-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(tabName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
        currentTab = tabName;
        
        // Load tab-specific content
        if (tabName === 'marketplace') {
            refreshMarketplace();
        } else if (tabName === 'profile') {
            updateUserProfile();
        }
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

// Populate create item form
function populateCreateItemForm() {
    const categorySelect = document.getElementById('itemCategory');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select Category</option>' +
            Object.entries(ITEM_CATEGORIES).map(([key, category]) => 
                `<option value="${key}">${category.icon} ${category.name}</option>`
            ).join('');
    }
    
    const raritySelect = document.getElementById('itemRarity');
    if (raritySelect) {
        raritySelect.innerHTML = Object.entries(RARITY_LEVELS).map(([key, rarity]) => 
            `<option value="${key}">${rarity.name}</option>`
        ).join('');
    }
}

// Handle create item form submission
async function handleCreateItem(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showErrorMessage('Please log in first');
        return;
    }
    
    const formData = new FormData(e.target);
    const itemData = {
        name: formData.get('itemName').trim(),
        category: formData.get('itemCategory'),
        price: parseInt(formData.get('itemPrice')),
        rarity: formData.get('itemRarity'),
        description: formData.get('itemDescription').trim(),
        seller_id: currentUser.id,
        seller_username: currentUser.username,
        created_at: new Date().toISOString(),
        is_sold: false,
        custom_image: null
    };
    
    // Validation
    if (!itemData.name || !itemData.category || !itemData.price || !itemData.description) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    if (itemData.price < 1 || itemData.price > 10000) {
        showErrorMessage('Price must be between 1 and 10000 points');
        return;
    }
    
    try {
        showLoading(true);
        
        // Check if custom drawing exists
        if (itemData.category === 'custom' && drawingCanvas) {
            itemData.custom_image = drawingCanvas.toDataURL();
        }
        
        // Apply rarity price multiplier
        const rarityMultiplier = RARITY_LEVELS[itemData.rarity].multiplier;
        itemData.price = Math.round(itemData.price * rarityMultiplier);
        
        // Create item in database
        const newItem = await createRecord('items', itemData);
        allItems.push(newItem);
        
        // Add to current user's owned items
        currentUser.items_owned.push(newItem.id);
        await updateRecord('users', currentUser.id, currentUser);
        
        // Check for artist badge
        checkAndAwardBadge('artist');
        
        // Clear form
        e.target.reset();
        clearCanvas();
        
        // Refresh marketplace and profile
        await refreshMarketplace();
        updateUserProfile();
        
        showSuccessMessage(`Item "${itemData.name}" created successfully! 🎨`);
        
        playSound('success');
        
    } catch (error) {
        console.error('Failed to create item:', error);
        showErrorMessage('Failed to create item. Please try again.');
        playSound('error');
    } finally {
        showLoading(false);
    }
}

// Refresh marketplace display
async function refreshMarketplace() {
    try {
        const marketplaceGrid = document.getElementById('marketplaceGrid');
        const availableItems = allItems.filter(item => !item.is_sold);
        
        if (availableItems.length === 0) {
            marketplaceGrid.innerHTML = '<div class="no-items-message">No items available in the marketplace yet. Be the first to create one!</div>';
            return;
        }
        
        // Apply current filters and sorting
        let filteredItems = filterAndSortItems(availableItems);
        
        marketplaceGrid.innerHTML = filteredItems.map(item => createItemCard(item, false)).join('');
        
        // Update marketplace filters
        updateMarketplaceFilters();
        
    } catch (error) {
        console.error('Failed to refresh marketplace:', error);
    }
}

// Filter and sort items based on current settings
function filterAndSortItems(items) {
    let filtered = [...items];
    
    // Search filter
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.seller_username.toLowerCase().includes(searchTerm)
        );
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter')?.value;
    if (categoryFilter) {
        filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Rarity filter
    const rarityFilter = document.getElementById('rarityFilter')?.value;
    if (rarityFilter) {
        filtered = filtered.filter(item => item.rarity === rarityFilter);
    }
    
    // Sort
    const sortOption = document.getElementById('sortSelect')?.value || 'newest';
    switch (sortOption) {
        case 'price_low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price_high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rarity':
            const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            filtered.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
            break;
        case 'newest':
        default:
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }
    
    return filtered;
}

// Update marketplace filters dropdowns
function updateMarketplaceFilters() {
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.children.length <= 1) {
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            Object.entries(ITEM_CATEGORIES).map(([key, category]) => 
                `<option value="${key}">${category.icon} ${category.name}</option>`
            ).join('');
    }
    
    // Rarity filter
    const rarityFilter = document.getElementById('rarityFilter');
    if (rarityFilter && rarityFilter.children.length <= 1) {
        rarityFilter.innerHTML = '<option value="">All Rarities</option>' +
            Object.entries(RARITY_LEVELS).map(([key, rarity]) => 
                `<option value="${key}">${rarity.name}</option>`
            ).join('');
    }
}

// Create item card HTML
function createItemCard(item, isOwned = false) {
    const category = ITEM_CATEGORIES[item.category];
    const rarity = RARITY_LEVELS[item.rarity];
    const canBuy = currentUser && currentUser.points >= item.price && item.seller_id !== currentUser.id && !isOwned;
    const isOwnItem = currentUser && item.seller_id === currentUser.id;
    
    return `
        <div class="item-card ${item.rarity}" data-item-id="${item.id}">
            <div class="item-header">
                <div class="item-category" style="background-color: ${category.color}">
                    ${category.icon}
                </div>
                <div class="item-rarity ${item.rarity}">
                    ${rarity.name}
                </div>
            </div>
            
            ${item.custom_image ? 
                `<div class="item-image">
                    <img src="${item.custom_image}" alt="${item.name}" />
                </div>` : 
                `<div class="item-image placeholder">
                    <span class="category-icon">${category.icon}</span>
                </div>`
            }
            
            <div class="item-info">
                <h3 class="item-name">${item.name}</h3>
                <p class="item-description">${item.description}</p>
                <div class="item-seller">By: ${item.seller_username}</div>
                
                <div class="item-footer">
                    <div class="item-price">${item.price} ⭐</div>
                    <div class="item-actions">
                        ${isOwned ? 
                            `<button class="sell-btn" onclick="sellItem('${item.id}')">
                                💰 Sell
                            </button>` :
                            canBuy ? 
                                `<button class="buy-btn" onclick="buyItem('${item.id}')">
                                    🛒 Buy
                                </button>` :
                                isOwnItem ?
                                    '<span class="own-item">Your Item</span>' :
                                    '<span class="cannot-afford">Cannot Afford</span>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Buy item function
async function buyItem(itemId) {
    if (!currentUser) {
        showErrorMessage('Please log in first');
        return;
    }
    
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
        showErrorMessage('Item not found');
        return;
    }
    
    if (currentUser.points < item.price) {
        showErrorMessage('Not enough points to buy this item');
        playSound('error');
        return;
    }
    
    if (item.seller_id === currentUser.id) {
        showErrorMessage('You cannot buy your own item');
        return;
    }
    
    if (item.is_sold) {
        showErrorMessage('This item has already been sold');
        return;
    }
    
    try {
        showLoading(true);
        
        // Find seller
        const seller = allUsers.find(u => u.id === item.seller_id);
        if (!seller) {
            throw new Error('Seller not found');
        }
        
        // Update buyer
        currentUser.points -= item.price;
        currentUser.items_owned.push(item.id);
        currentUser.total_spent += item.price;
        
        // Update seller
        seller.sales_earnings += item.price;
        seller.total_earned += item.price;
        
        // Mark item as sold
        item.is_sold = true;
        item.buyer_id = currentUser.id;
        item.buyer_username = currentUser.username;
        item.sold_at = new Date().toISOString();
        
        // Create transaction record
        const transaction = {
            item_id: item.id,
            item_name: item.name,
            buyer_id: currentUser.id,
            buyer_username: currentUser.username,
            seller_id: seller.id,
            seller_username: seller.username,
            price: item.price,
            transaction_date: new Date().toISOString()
        };
        
        // Update database
        await Promise.all([
            updateRecord('users', currentUser.id, currentUser),
            updateRecord('users', seller.id, seller),
            updateRecord('items', item.id, item),
            createRecord('transactions', transaction)
        ]);
        
        // Check for badges
        checkAndAwardBadge('big_spender');
        checkAndAwardBadge('collector');
        checkAndAwardBadge('bargain_hunter');
        
        // Check seller badges
        if (seller.id !== currentUser.id) {
            checkAndAwardSellerBadges(seller);
        }
        
        // Refresh display
        await refreshMarketplace();
        updateUserProfile();
        
        showSuccessMessage(`Successfully purchased "${item.name}" for ${item.price} points! 🛒`);
        playSound('purchase');
        
    } catch (error) {
        console.error('Failed to buy item:', error);
        showErrorMessage('Failed to purchase item. Please try again.');
        playSound('error');
    } finally {
        showLoading(false);
    }
}

// Sell item function (for owned items)
async function sellItem(itemId) {
    if (!currentUser) {
        showErrorMessage('Please log in first');
        return;
    }
    
    const item = allItems.find(i => i.id === itemId);
    if (!item) {
        showErrorMessage('Item not found');
        return;
    }
    
    if (!currentUser.items_owned.includes(itemId)) {
        showErrorMessage('You do not own this item');
        return;
    }
    
    const sellPrice = Math.floor(item.price * 0.7); // 70% of original price
    
    const confirm = window.confirm(`Sell "${item.name}" for ${sellPrice} points?`);
    if (!confirm) return;
    
    try {
        showLoading(true);
        
        // Remove from owned items
        currentUser.items_owned = currentUser.items_owned.filter(id => id !== itemId);
        
        // Add points
        currentUser.points += sellPrice;
        currentUser.sales_earnings += sellPrice;
        currentUser.total_earned += sellPrice;
        
        // Update item
        item.is_sold = true;
        item.buyer_id = 'marketplace';
        item.buyer_username = 'Marketplace';
        item.sold_at = new Date().toISOString();
        
        // Update database
        await Promise.all([
            updateRecord('users', currentUser.id, currentUser),
            updateRecord('items', item.id, item)
        ]);
        
        // Check for badges
        checkAndAwardBadge('first_sale');
        checkAndAwardBadge('top_seller');
        checkAndAwardBadge('entrepreneur');
        
        // Refresh display
        updateUserProfile();
        
        showSuccessMessage(`Successfully sold "${item.name}" for ${sellPrice} points! 💰`);
        playSound('success');
        
    } catch (error) {
        console.error('Failed to sell item:', error);
        showErrorMessage('Failed to sell item. Please try again.');
        playSound('error');
    } finally {
        showLoading(false);
    }
}

// Check and award badge
function checkAndAwardBadge(badgeId) {
    if (!currentUser || currentUser.badges.includes(badgeId)) {
        return false;
    }
    
    let earned = false;
    
    switch (badgeId) {
        case 'first_sale':
            earned = currentUser.sales_earnings > 0;
            break;
        case 'big_spender':
            earned = currentUser.total_spent >= 500;
            break;
        case 'top_seller':
            earned = currentUser.sales_earnings >= 1000;
            break;
        case 'artist':
            earned = allItems.some(item => item.seller_id === currentUser.id && item.category === 'custom');
            break;
        case 'collector':
            earned = currentUser.items_owned.length >= 10;
            break;
        case 'bargain_hunter':
            const cheapPurchases = allItems.filter(item => 
                item.buyer_id === currentUser.id && item.price < 50
            ).length;
            earned = cheapPurchases >= 5;
            break;
        case 'entrepreneur':
            const itemsSold = allItems.filter(item => 
                item.seller_id === currentUser.id && item.is_sold
            ).length;
            earned = itemsSold >= 20;
            break;
        case 'millionaire':
            earned = currentUser.total_earned >= 10000;
            break;
    }
    
    if (earned) {
        currentUser.badges.push(badgeId);
        updateRecord('users', currentUser.id, currentUser);
        
        const badge = BADGE_REQUIREMENTS[badgeId];
        showSuccessMessage(`🏆 Badge Earned: ${badge.name}! ${badge.description}`);
        playSound('levelUp');
        
        return true;
    }
    
    return false;
}

// Check and award seller badges for other users
function checkAndAwardSellerBadges(seller) {
    const originalBadgeCount = seller.badges.length;
    
    // Check first sale
    if (!seller.badges.includes('first_sale') && seller.sales_earnings > 0) {
        seller.badges.push('first_sale');
    }
    
    // Check top seller
    if (!seller.badges.includes('top_seller') && seller.sales_earnings >= 1000) {
        seller.badges.push('top_seller');
    }
    
    // Check entrepreneur
    if (!seller.badges.includes('entrepreneur')) {
        const itemsSold = allItems.filter(item => 
            item.seller_id === seller.id && item.is_sold
        ).length;
        if (itemsSold >= 20) {
            seller.badges.push('entrepreneur');
        }
    }
    
    // Check millionaire
    if (!seller.badges.includes('millionaire') && seller.total_earned >= 10000) {
        seller.badges.push('millionaire');
    }
    
    // If badges were awarded, update the seller
    if (seller.badges.length > originalBadgeCount) {
        updateRecord('users', seller.id, seller);
    }
}

// Handle search input
function handleSearch(e) {
    refreshMarketplace();
}

// Handle category filter
function handleCategoryFilter(e) {
    refreshMarketplace();
}

// Handle rarity filter
function handleRarityFilter(e) {
    refreshMarketplace();
}

// Handle sort selection
function handleSort(e) {
    refreshMarketplace();
}

// Canvas initialization for custom item creation
function initializeCanvas() {
    drawingCanvas = document.getElementById('drawingCanvas');
    if (!drawingCanvas) return;
    
    drawingContext = drawingCanvas.getContext('2d');
    
    // Set canvas size
    drawingCanvas.width = 300;
    drawingCanvas.height = 300;
    
    // Set default styles
    drawingContext.strokeStyle = '#333';
    drawingContext.lineWidth = 2;
    drawingContext.lineCap = 'round';
    
    // Clear canvas with white background
    clearCanvas();
    
    // Add event listeners
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    drawingCanvas.addEventListener('touchstart', handleTouch);
    drawingCanvas.addEventListener('touchmove', handleTouch);
    drawingCanvas.addEventListener('touchend', stopDrawing);
    
    // Drawing tools
    setupDrawingTools();
}

// Setup drawing tools
function setupDrawingTools() {
    // Color picker
    const colorPicker = document.getElementById('colorPicker');
    if (colorPicker) {
        colorPicker.addEventListener('change', (e) => {
            drawingContext.strokeStyle = e.target.value;
        });
    }
    
    // Brush size
    const brushSize = document.getElementById('brushSize');
    if (brushSize) {
        brushSize.addEventListener('change', (e) => {
            drawingContext.lineWidth = e.target.value;
        });
    }
    
    // Clear button
    const clearBtn = document.getElementById('clearCanvas');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
    }
    
    // Undo button
    const undoBtn = document.getElementById('undoCanvas');
    if (undoBtn) {
        undoBtn.addEventListener('click', undoDrawing);
    }
}

// Clear canvas
function clearCanvas() {
    if (!drawingContext) return;
    
    drawingContext.fillStyle = '#ffffff';
    drawingContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    // Reset drawing state
    canvasStates = [];
    currentStateIndex = -1;
    saveCanvasState();
}

// Save canvas state for undo functionality
function saveCanvasState() {
    if (!drawingCanvas) return;
    
    currentStateIndex++;
    if (currentStateIndex < canvasStates.length) {
        canvasStates.length = currentStateIndex;
    }
    canvasStates.push(drawingCanvas.toDataURL());
}

// Undo drawing
function undoDrawing() {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        const img = new Image();
        img.onload = function() {
            drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            drawingContext.drawImage(img, 0, 0);
        };
        img.src = canvasStates[currentStateIndex];
    }
}

// Start drawing
function startDrawing(e) {
    if (!drawingContext) return;
    
    isDrawing = true;
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingContext.beginPath();
    drawingContext.moveTo(x, y);
}

// Draw
function draw(e) {
    if (!isDrawing || !drawingContext) return;
    
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawingContext.lineTo(x, y);
    drawingContext.stroke();
}

// Stop drawing
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        saveCanvasState();
    }
}

// Handle touch events
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawingCanvas.dispatchEvent(mouseEvent);
}

// Load initial items into marketplace
async function loadInitialItems() {
    try {
        // Check if items already exist
        if (allItems.length > 0) {
            return;
        }
        
        console.log('Loading initial items...');
        
        // Create system user for initial items
        let systemUser = allUsers.find(u => u.username === 'System');
        if (!systemUser) {
            systemUser = await createNewUser('System');
            systemUser.username = 'System';
            systemUser.points = 999999;
            await updateRecord('users', systemUser.id, systemUser);
            allUsers.push(systemUser);
        }
        
        // Add initial items
        for (const itemData of INITIAL_ITEMS) {
            const item = {
                ...itemData,
                seller_id: systemUser.id,
                seller_username: 'System',
                created_at: new Date().toISOString(),
                is_sold: false
            };
            
            const savedItem = await createRecord('items', item);
            allItems.push(savedItem);
        }
        
        console.log(`Loaded ${INITIAL_ITEMS.length} initial items`);
        
    } catch (error) {
        console.error('Failed to load initial items:', error);
    }
}

// API Helper Functions - GitHub Pages 호환 버전
async function fetchTableData(tableName) {
    try {
        const response = await fetch(`${API_BASE_URL}/tables/${tableName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
    }
}

async function createRecord(tableName, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/tables/${tableName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error creating ${tableName} record:`, error);
        throw error;
    }
}

async function updateRecord(tableName, recordId, data) {
    try {
        const response = await fetch(`${API_BASE_URL}/tables/${tableName}/${recordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error updating ${tableName} record:`, error);
        throw error;
    }
}

// Load all users from database
async function loadAllUsers() {
    try {
        console.log('Loading users...');
        allUsers = await fetchTableData('users');
        console.log(`Loaded ${allUsers.length} users`);
    } catch (error) {
        console.error('Failed to load users:', error);
        allUsers = [];
    }
}

// Load all items from database
async function loadAllItems() {
    try {
        console.log('Loading items...');
        allItems = await fetchTableData('items');
        console.log(`Loaded ${allItems.length} items`);
        
        // Load initial items if none exist
        if (allItems.length === 0) {
            await loadInitialItems();
        }
    } catch (error) {
        console.error('Failed to load items:', error);
        allItems = [];
    }
}

// Error handling wrapper
function withErrorHandling(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error('Error in', fn.name, ':', error);
            showErrorMessage('An error occurred. Please try again.');
            playSound('error');
            throw error;
        }
    };
}

// Logout functionality
function logout() {
    const confirmLogout = confirm('Are you sure you want to log out?');
    if (confirmLogout) {
        currentUser = null;
        showLoginScreen();
        
        // Clear any temporary data
        if (drawingCanvas) {
            clearCanvas();
        }
        
        showSuccessMessage('Successfully logged out! 👋');
    }
}

// Add logout button functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add logout button to navigation if it exists
    const nav = document.querySelector('.nav-tabs');
    if (nav) {
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = '🚪 Logout';
        logoutBtn.className = 'logout-btn';
        logoutBtn.onclick = logout;
        nav.appendChild(logoutBtn);
    }
});

// Performance monitoring
function monitorPerformance() {
    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('app-init-start');
        
        window.addEventListener('load', () => {
            performance.mark('app-init-end');
            performance.measure('app-init', 'app-init-start', 'app-init-end');
            
            const measure = performance.getEntriesByName('app-init')[0];
            console.log(`App initialization took ${measure.duration.toFixed(2)}ms`);
        });
    }
}

// Initialize performance monitoring
monitorPerformance();

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showErrorMessage('Something went wrong. Please refresh the page if the problem continues.');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorMessage('A network error occurred. Please check your connection and try again.');
});

console.log('English Marketplace JavaScript loaded successfully! 🚀');
