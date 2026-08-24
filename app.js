// ===== Category Definitions =====
const CATEGORIES = [
    { id: 'vanilla', name: 'Vanilla', icon: 'tier_icons/vanilla.svg' },
    { id: 'uhc', name: 'UHC', icon: 'tier_icons/uhc.svg' },
    { id: 'pot', name: 'Pot', icon: 'tier_icons/pot.svg' },
    { id: 'nethop', name: 'NethOP', icon: 'tier_icons/nethop.svg' },
    { id: 'smp', name: 'SMP', icon: 'tier_icons/smp.svg' },
    { id: 'sword', name: 'Sword', icon: 'tier_icons/sword.svg' },
    { id: 'axe', name: 'Axe', icon: 'tier_icons/axe.svg' },
    { id: 'mace', name: 'Mace', icon: 'tier_icons/mace.svg' }
];

// ===== Title Definitions =====
const TITLES = {
    grandmaster: { name: 'Combat Grandmaster', class: 'grandmaster' },
    master: { name: 'Combat Master', class: 'master' },
    ace: { name: 'Combat Ace', class: 'ace' },
    expert: { name: 'Combat Expert', class: 'expert' },
    adept: { name: 'Combat Adept', class: 'adept' }
};

// ===== Tier Point Values =====
const TIER_POINTS = {
    'HT1': 100, 'HT2': 85, 'HT3': 70, 'HT4': 55, 'HT5': 40,
    'LT1': 30, 'LT2': 20, 'LT3': 15, 'LT4': 10, 'LT5': 5, '-': 0
};

// ===== Firebase & Player Data =====
const DB_URL = "https://twld-tiers-default-rtdb.firebaseio.com/players.json";

const DEFAULT_PLAYERS = [
    {
        name: 'Aer0hxx',
        title: 'grandmaster',
        points: 755,
        region: 'EU',
        tiers: { vanilla: 'LT3', uhc: 'LT4', pot: 'HT5', nethop: 'HT4', smp: 'LT4', sword: 'LT3', axe: 'HT4', mace: 'LT3' }
    },
    {
        name: 'Supgreat',
        title: 'adept',
        points: 230,
        region: 'EU',
        tiers: { uhc: 'HT5', axe: 'LT4' }
    },
    {
        name: 'Sozuqadam',
        title: 'adept',
        points: 220,
        region: 'EU',
        tiers: { uhc: 'LT5', nethop: 'LT4', sword: 'HT5', axe: 'LT4', mace: 'LT5' }
    },
    {
        name: 'Teentytryt1646',
        title: 'adept',
        points: 190,
        region: 'EU',
        tiers: { axe: 'HT4' }
    }
];

let PLAYERS = [];

// ===== State =====
let currentCategory = 'overall';
let searchQuery = '';

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(DB_URL);
        const data = await response.json();
        if (data && Array.isArray(data)) {
            PLAYERS = data;
        } else {
            PLAYERS = DEFAULT_PLAYERS;
            // İlk kez açılıyorsa veritabanını varsayılan listeyle doldur
            fetch(DB_URL, { method: 'PUT', body: JSON.stringify(PLAYERS) });
        }
    } catch (error) {
        console.error("Firebase'den veri çekilemedi:", error);
        PLAYERS = DEFAULT_PLAYERS;
    }

    setTimeout(() => {
        document.getElementById('loadingState').style.display = 'none';
        renderView();
    }, 300);

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderView();
    });

    const mobileSearchInput = document.getElementById('mobileSearchInput');
    mobileSearchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        searchInput.value = e.target.value;
        renderView();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== mobileSearchInput) {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            searchInput.blur();
            mobileSearchInput.blur();
            document.getElementById('mobileMenu')?.classList.remove('open');
            document.getElementById('infoModal')?.classList.remove('open');
        }
    });
});

// ===== Tier grouping for column view =====
const TIER_GROUPS = [
    { label: 'Tier 1', tiers: ['HT1'], headerClass: 'tier-1-header', trophy: 'tier_icons/overall.svg' },
    { label: 'Tier 2', tiers: ['HT2', 'HT3'], headerClass: 'tier-2-header', trophy: 'tier_icons/overall.svg' },
    { label: 'Tier 3', tiers: ['HT4', 'HT5'], headerClass: 'tier-3-header', trophy: 'tier_icons/overall.svg' },
    { label: 'Tier 4', tiers: ['LT1', 'LT2', 'LT3'], headerClass: 'tier-4-header', trophy: null },
    { label: 'Tier 5', tiers: ['LT4', 'LT5'], headerClass: 'tier-5-header', trophy: null }
];

// ===== Main Render — switches between ranking table and tier columns =====
function renderView() {
    const container = document.getElementById('playerList');
    const noResults = document.getElementById('noResults');

    // Hide table headers for tier column view
    const desktopHeader = document.querySelector('.table-header.desktop-only');
    const mobileHeader = document.querySelector('.table-header.mobile-only');

    if (currentCategory !== 'overall' && currentCategory !== 'ltm') {
        // Kit-specific: show tier columns
        if (desktopHeader) desktopHeader.style.display = 'none';
        if (mobileHeader) mobileHeader.style.display = 'none';
        renderTierColumns(container, noResults);
    } else {
        // Overall/LTMs: show ranking table
        if (desktopHeader) desktopHeader.style.display = '';
        if (mobileHeader) mobileHeader.style.display = '';
        renderPlayers(container, noResults);
    }
}

// ===== Render Tier Columns (Kit-specific view) =====
function renderTierColumns(container, noResults) {
    let players = [...PLAYERS];

    if (searchQuery) {
        players = players.filter(p => p.name.toLowerCase().includes(searchQuery));
    }

    if (players.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    noResults.style.display = 'none';

    const columnsHTML = TIER_GROUPS.map(group => {
        const groupPlayers = players.filter(p => {
            const tier = p.tiers[currentCategory] || '-';
            return group.tiers.includes(tier);
        });

        const trophyHTML = group.trophy
            ? `<img src="${group.trophy}" alt="">`
            : '';

        const playersHTML = groupPlayers.length > 0
            ? groupPlayers.map((p, i) => {
                const title = TITLES[p.title];
                const avatarUrl = `https://mc-heads.net/body/${p.name}/36`;
                return `
                    <div class="tier-player" style="animation-delay: ${i * 0.03}s">
                        <span class="tier-player-dot ${title.class}"></span>
                        <img class="tier-player-avatar" src="${avatarUrl}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">
                        <span class="tier-player-name">${p.name}</span>
                    </div>
                `;
            }).join('')
            : '<div class="tier-empty">No players</div>';

        return `
            <div class="tier-column">
                <div class="tier-column-header ${group.headerClass}">
                    ${trophyHTML}
                    ${group.label}
                </div>
                <div class="tier-column-list">
                    ${playersHTML}
                </div>
            </div>
        `;
    }).join('');

    container.className = 'tier-columns';
    container.innerHTML = columnsHTML;
}

// ===== Render Players (Overall ranking table) =====
function renderPlayers(container, noResults) {
    container.className = 'player-list';

    let sortedPlayers = [...PLAYERS];

    if (currentCategory !== 'overall' && currentCategory !== 'ltm') {
        sortedPlayers.sort((a, b) => {
            const tierA = TIER_POINTS[a.tiers[currentCategory] || '-'] || 0;
            const tierB = TIER_POINTS[b.tiers[currentCategory] || '-'] || 0;
            if (tierB !== tierA) return tierB - tierA;
            return b.points - a.points;
        });
    } else {
        sortedPlayers.sort((a, b) => b.points - a.points);
    }

    if (searchQuery) {
        sortedPlayers = sortedPlayers.filter(p =>
            p.name.toLowerCase().includes(searchQuery)
        );
    }

    if (sortedPlayers.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    container.innerHTML = sortedPlayers.map((player, index) => {
        const rank = index + 1;
        const title = TITLES[player.title];
        const avatarUrl = `https://mc-heads.net/body/${player.name}/64`;
        const rankClass = rank <= 3 ? ` rank-${rank}` : '';

        const tierBadgesHTML = CATEGORIES.map(cat => {
            const tier = player.tiers[cat.id] || '-';
            const tierClass = tier !== '-' ? `tier-${tier.toLowerCase()}` : 'tier-none';
            const highlighted = currentCategory === cat.id ? ' highlighted' : '';
            return `
                <div class="tier-badge-item${highlighted}">
                    <div class="tier-icon-circle">
                        <img src="${cat.icon}" width="18" height="18" alt="${cat.name}">
                    </div>
                    <span class="tier-badge ${tierClass}">${tier}</span>
                </div>
            `;
        }).join('');

        const rowRankClass = rank <= 3 ? ` row-rank-${rank}` : '';

        return `
            <div class="player-row${rowRankClass}" style="animation-delay: ${index * 0.04}s">
                <div class="rank-number${rankClass}">${rank}.</div>
                <div class="player-info">
                    <img class="player-avatar" src="${avatarUrl}" alt="${player.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%231e293b%22 width=%2240%22 height=%2240%22/><text x=%2220%22 y=%2226%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2214%22>?</text></svg>'">
                    <div class="player-details">
                        <span class="player-name">${player.name}</span>
                        <span class="player-title">
                            <span class="title-dot ${title.class}"></span>
                            ${title.name}
                            <span style="color: var(--text-disabled)">(${player.points} points)</span>
                        </span>
                    </div>
                </div>
                <span class="region-badge region-${player.region.toLowerCase()}">${player.region}</span>
                <div class="tier-badges">
                    ${tierBadgesHTML}
                </div>
            </div>
        `;
    }).join('');
}

// ===== Tab Switching with smooth transition =====
function switchTab(e, category) {
    e.preventDefault();
    currentCategory = category;

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        const underline = tab.querySelector('.tab-underline');
        if (underline) underline.remove();
    });

    const activeTab = e.currentTarget;
    activeTab.classList.add('active');

    const underline = document.createElement('span');
    underline.className = 'tab-underline';
    activeTab.appendChild(underline);

    // Smooth scroll tab into view
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    // Smooth fade transition
    const playerList = document.getElementById('playerList');
    playerList.classList.add('fading');

    setTimeout(() => {
        renderView();
        playerList.classList.remove('fading');
    }, 200);
}

// ===== Mobile Menu =====
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}

// ===== Info Modal =====
function toggleInfoModal() {
    document.getElementById('infoModal').classList.toggle('open');
}

function closeInfoModal(e) {
    if (e.target === e.currentTarget) {
        document.getElementById('infoModal').classList.remove('open');
    }
}

// ===== Copy Server IP =====
function copyIP() {
    navigator.clipboard.writeText('play.twld.net').then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '✓';
        btn.style.opacity = '1';
        btn.style.color = '#22c55e';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.opacity = '';
            btn.style.color = '';
        }, 1500);
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = 'play.twld.net';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// ===== LANDING & ADMIN LOGIC =====

function enterAsPlayer() {
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('mainSite').style.display = 'block';
    renderView();
}

function showAdminLogin() {
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('adminLoginScreen').style.display = 'flex';
}

function backToLanding() {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('mainSite').style.display = 'none';
    document.getElementById('landingScreen').style.display = 'flex';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function adminLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;

    if (user === 'Aer0hx' && pass === '110219231213.fsdi!') {
        document.getElementById('adminLoginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('adminUsername').innerText = user;
        renderAdminTable();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function adminLogout() {
    document.getElementById('adminPanel').style.display = 'none';
    backToLanding();
}

// ===== ADMIN CRUD OPERATIONS =====

function renderAdminTable() {
    const tbody = document.getElementById('adminPlayerList');
    tbody.innerHTML = PLAYERS.map((p, index) => {
        const titleName = TITLES[p.title] ? TITLES[p.title].name : p.title;
        return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="admin-player-cell">
                        <img class="admin-avatar" src="https://mc-heads.net/avatar/${p.name}/32" alt="">
                        ${p.name}
                    </div>
                </td>
                <td>${titleName}</td>
                <td>${p.points}</td>
                <td>${p.region}</td>
                <td>${p.tiers.vanilla || '-'}</td>
                <td>${p.tiers.uhc || '-'}</td>
                <td>${p.tiers.pot || '-'}</td>
                <td>${p.tiers.nethop || '-'}</td>
                <td>${p.tiers.smp || '-'}</td>
                <td>${p.tiers.sword || '-'}</td>
                <td>${p.tiers.axe || '-'}</td>
                <td>${p.tiers.mace || '-'}</td>
                <td>
                    <div class="admin-actions">
                        <button class="admin-edit-btn" onclick="editPlayer(${index})">Düzenle</button>
                        <button class="admin-delete-btn" onclick="deletePlayer(${index})">Sil</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openAddPlayerModal() {
    document.getElementById('playerModalTitle').innerText = 'Oyuncu Ekle';
    document.getElementById('editIndex').value = '-1';
    document.getElementById('pName').value = '';
    document.getElementById('pPoints').value = '800';
    document.getElementById('pTitle').value = 'grandmaster';
    document.getElementById('pRegion').value = 'NA';
    
    // Reset tiers
    const tiers = ['Vanilla', 'Uhc', 'Pot', 'Nethop', 'Smp', 'Sword', 'Axe', 'Mace'];
    tiers.forEach(t => document.getElementById('p' + t).value = '-');
    
    document.getElementById('playerModal').classList.add('open');
}

function editPlayer(index) {
    const p = PLAYERS[index];
    document.getElementById('playerModalTitle').innerText = 'Oyuncu Düzenle';
    document.getElementById('editIndex').value = index;
    document.getElementById('pName').value = p.name;
    document.getElementById('pPoints').value = p.points;
    document.getElementById('pTitle').value = p.title;
    document.getElementById('pRegion').value = p.region;
    
    document.getElementById('pVanilla').value = p.tiers.vanilla || '-';
    document.getElementById('pUhc').value = p.tiers.uhc || '-';
    document.getElementById('pPot').value = p.tiers.pot || '-';
    document.getElementById('pNethop').value = p.tiers.nethop || '-';
    document.getElementById('pSmp').value = p.tiers.smp || '-';
    document.getElementById('pSword').value = p.tiers.sword || '-';
    document.getElementById('pAxe').value = p.tiers.axe || '-';
    document.getElementById('pMace').value = p.tiers.mace || '-';
    
    document.getElementById('playerModal').classList.add('open');
}

function savePlayer(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('editIndex').value);
    
    const newPlayer = {
        name: document.getElementById('pName').value,
        title: document.getElementById('pTitle').value,
        points: parseInt(document.getElementById('pPoints').value) || 0,
        region: document.getElementById('pRegion').value,
        tiers: {
            vanilla: document.getElementById('pVanilla').value,
            uhc: document.getElementById('pUhc').value,
            pot: document.getElementById('pPot').value,
            nethop: document.getElementById('pNethop').value,
            smp: document.getElementById('pSmp').value,
            sword: document.getElementById('pSword').value,
            axe: document.getElementById('pAxe').value,
            mace: document.getElementById('pMace').value
        }
    };
    
    // Clean up empty tiers
    for (let key in newPlayer.tiers) {
        if (newPlayer.tiers[key] === '-') delete newPlayer.tiers[key];
    }

    if (index === -1) {
        PLAYERS.push(newPlayer); // Add new
    } else {
        PLAYERS[index] = newPlayer; // Update existing
    }
    
    // Save to Firebase
    fetch(DB_URL, { method: 'PUT', body: JSON.stringify(PLAYERS) });
    
    closePlayerModalDirect();
    renderAdminTable();
    renderView(); // Update main site too
}

function deletePlayer(index) {
    if (confirm(PLAYERS[index].name + ' adlı oyuncuyu silmek istediğinize emin misiniz?')) {
        PLAYERS.splice(index, 1);
        // Save to Firebase
        fetch(DB_URL, { method: 'PUT', body: JSON.stringify(PLAYERS) });
        renderAdminTable();
        renderView(); // Update main site
    }
}

function closePlayerModalDirect() {
    document.getElementById('playerModal').classList.remove('open');
}

function closePlayerModal(e) {
    if (e.target === e.currentTarget) {
        closePlayerModalDirect();
    }
}
