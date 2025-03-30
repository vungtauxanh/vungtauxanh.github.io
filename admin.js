const masterApiUrl = 'https://script.google.com/macros/s/AKfycbz5OeqNxEmWUgny-3u0z6gpZWYHeL2hA1q478YfM-fwATtTnSxqFu_VZBCLBnJBB4c/exec';
let adminUserId = '';
let adminToken = '';

async function fetchUsers() {
    try {
        const response = await fetch(`${masterApiUrl}?userId=${adminUserId}&token=${adminToken}&action=getUsers`, {
            method: 'GET',
            redirect: 'follow'
        });
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        const tbody = document.querySelector('#user-table tbody');
        tbody.innerHTML = '';
        data.slice(1).forEach((row, index) => {
            const status = row[5] || 'active'; // Giả sử cột 6 lưu trạng thái
            const tr = document.createElement('tr');
            tr.dataset.status = status;
            tr.innerHTML = `
                <td data-label="User ID">${row[0]}</td>
                <td data-label="Email">${row[1]}</td>
                <td data-label="Sheet ID">${row[2]}</td>
                <td data-label="API URL">${row[3]}</td>
                <td data-label="Token">${row[4]}</td>
                <td data-label="Trạng thái">${status}</td>
                <td data-label="Hành động">
                    <button class="edit-btn" onclick="editUser(${index + 2})">Sửa</button>
                    <button class="delete-btn" onclick="deleteUser(${index + 2})">Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        showNotification(`Không thể tải danh sách user: ${error.message}`);
    }
}

async function addUser(userData) {
    try {
        await fetch(`${masterApiUrl}?userId=${adminUserId}&token=${adminToken}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addUser', userData })
        });
        fetchUsers();
        showNotification('Thêm user thành công!');
    } catch (error) {
        console.error('Error adding user:', error);
        showNotification('Lỗi khi thêm user!');
    }
}

async function deleteUser(rowIndex) {
    if (!confirm('Bạn có chắc chắn muốn xóa user này không?')) return;
    try {
        await fetch(`${masterApiUrl}?userId=${adminUserId}&token=${adminToken}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteUser', rowIndex })
        });
        fetchUsers();
        showNotification('Xóa user thành công!');
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Lỗi khi xóa user!');
    }
}

async function editUser(rowIndex) {
    const tbody = document.querySelector('#user-table tbody');
    const row = tbody.children[rowIndex - 2];
    document.getElementById('edit-row-index').value = rowIndex;
    document.getElementById('edit-user-id').value = row.cells[0].textContent;
    document.getElementById('edit-email').value = row.cells[1].textContent;
    document.getElementById('edit-sheet-id').value = row.cells[2].textContent;
    document.getElementById('edit-api-url').value = row.cells[3].textContent;
    document.getElementById('edit-token').value = row.cells[4].textContent;
    document.getElementById('edit-status').value = row.dataset.status || 'active';
    const modal = document.getElementById('edit-user-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeEditModal() {
    const modal = document.getElementById('edit-user-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

async function saveEditedUser(e) {
    e.preventDefault();
    const userData = {
        userId: document.getElementById('edit-user-id').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        sheetId: document.getElementById('edit-sheet-id').value.trim(),
        apiUrl: document.getElementById('edit-api-url').value.trim(),
        token: document.getElementById('edit-token').value.trim(),
        status: document.getElementById('edit-status').value
    };
    const rowIndex = document.getElementById('edit-row-index').value;
    try {
        await fetch(`${masterApiUrl}?userId=${adminUserId}&token=${adminToken}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'editUser', rowIndex, userData })
        });
        fetchUsers();
        closeEditModal();
        showNotification('Sửa user thành công!');
    } catch (error) {
        showNotification('Lỗi khi sửa user!');
    }
}

function showNotification(message) {
    const modal = document.getElementById('notification-modal');
    const modalText = document.getElementById('notification-text');
    
    modalText.textContent = message;
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('notification-modal');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function showAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function logout() {
    // Xóa thông tin đăng nhập từ localStorage
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminToken');
    adminUserId = '';
    adminToken = '';
    // Xóa danh sách user hiện tại
    const tbody = document.querySelector('#user-table tbody');
    tbody.innerHTML = '';
    // Hiển thị lại modal đăng nhập
    showAdminLoginModal();
    showNotification('Đã đăng xuất thành công!');
}

document.addEventListener('DOMContentLoaded', () => {
    const savedAdminId = localStorage.getItem('adminId');
    const savedAdminToken = localStorage.getItem('adminToken');
    if (savedAdminId && savedAdminToken) {
        adminUserId = savedAdminId;
        adminToken = savedAdminToken;
        fetchUsers();
    } else {
        showAdminLoginModal();
    }

    const loginForm = document.getElementById('admin-login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        adminUserId = document.getElementById('admin-id').value.trim();
        adminToken = document.getElementById('admin-token').value.trim();
        localStorage.setItem('adminId', adminUserId);
        localStorage.setItem('adminToken', adminToken);
        closeAdminLoginModal();
        fetchUsers();
    });

    const addUserForm = document.getElementById('add-user-form');
    addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            userId: document.getElementById('new-user-id').value.trim(),
            email: document.getElementById('new-email').value.trim(),
            sheetId: document.getElementById('new-sheet-id').value.trim(),
            apiUrl: document.getElementById('new-api-url').value.trim(),
            token: document.getElementById('new-token').value.trim(),
            status: 'active' // Trạng thái mặc định
        };
        addUser(userData);
        addUserForm.reset();
    });

    document.getElementById('edit-user-form').addEventListener('submit', saveEditedUser);

    // Thêm sự kiện cho nút Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
});