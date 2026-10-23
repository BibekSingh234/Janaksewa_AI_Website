/* =========================================================
   JANAKSEWA AI ADMIN DASHBOARD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const API_BASE = (window.location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '8000')) ? "http://127.0.0.1:8000" : window.location.origin;
    const apiFetch = (url, options = {}) => fetch(url, { credentials: 'include', ...options });

    async function verifyAdminSession() {
        if (!document.cookie.match(/(?:^|; )csrftoken=/)) { await apiFetch(`${API_BASE}/api/csrf/`); }
        try {
            const response = await apiFetch(`${API_BASE}/api/me/`);
            const result = await response.json();
            if (!response.ok || !result.success || result.data.role !== 'admin') {
                throw new Error('Administrator access required');
            }
            localStorage.setItem('janaksewaAuth', 'true');
            localStorage.setItem('janaksewaRole', 'admin');
            localStorage.setItem('janaksewaUserName', result.data.name || 'Administrator');
            localStorage.setItem('janaksewaUserEmail', result.data.email || '');
            return true;
        } catch {
            localStorage.clear();
            window.location.replace('login-register.html');
            return false;
        }
    }

    async function loadDashboardData() {
        const statsCard = document.querySelector("#dashboard .stats-grid");
        const complaintsTable = document.querySelector("#complaints tbody");
        const recentComplaintsTable = document.querySelector("#dashboard .admin-table tbody");
        try {
            const [statsRes, complaintsRes] = await Promise.all([
                apiFetch(`${API_BASE}/api/dashboard/stats/`),
                apiFetch(`${API_BASE}/api/complaints/`)
            ]);

            const statsData = await statsRes.json();
            const complaintsData = await complaintsRes.json();

            if (statsRes.ok && statsData.success && statsCard) {
                const data = statsData.data;
                document.getElementById('statusTotal').textContent = data.complaints || 0;
                document.getElementById('pendingSummary').textContent = data.pending || 0;
                document.getElementById('processingSummary').textContent = data.processing || 0;
                document.getElementById('resolvedSummary').textContent = data.resolved || 0;
                statsCard.innerHTML = `
                    <div class="stat-card blue">
                        <div class="stat-icon"><i class="bi bi-people-fill"></i></div>
                        <div class="stat-content"><span>Total Users</span><h3>${data.users || 0}</h3><small><i class="bi bi-arrow-up"></i> Active accounts</small></div>
                        <button class="stat-action" data-section="users"><i class="bi bi-arrow-right"></i></button>
                    </div>
                    <div class="stat-card orange">
                        <div class="stat-icon"><i class="bi bi-exclamation-circle-fill"></i></div>
                        <div class="stat-content"><span>Total Complaints</span><h3>${data.complaints || 0}</h3><small><i class="bi bi-arrow-up"></i> Citizen reports</small></div>
                        <button class="stat-action" data-section="complaints"><i class="bi bi-arrow-right"></i></button>
                    </div>
                    <div class="stat-card green">
                        <div class="stat-icon"><i class="bi bi-check-circle-fill"></i></div>
                        <div class="stat-content"><span>Resolved</span><h3>${data.resolved || 0}</h3><small><i class="bi bi-arrow-up"></i> Completed</small></div>
                        <button class="stat-action" data-section="complaints"><i class="bi bi-arrow-right"></i></button>
                    </div>
                    <div class="stat-card purple">
                        <div class="stat-icon"><i class="bi bi-robot"></i></div>
                        <div class="stat-content"><span>In Progress</span><h3>${data.processing || 0}</h3><small><i class="bi bi-arrow-up"></i> Reports being handled</small></div>
                        <button class="stat-action" data-section="complaints"><i class="bi bi-arrow-right"></i></button>
                    </div>
                `;
            }

            if (complaintsRes.ok && complaintsData.success && (complaintsTable || recentComplaintsTable)) {
                const rows = (complaintsData.data || []).slice(0, 6).map(item => `
                    <tr>
                        <td>#CMP-${item.id}</td>
                        <td><div class="user-cell"><img src="https://i.pravatar.cc/50?img=${(item.id % 20) + 1}"><span>${item.name || 'Citizen'}</span></div></td>
                        <td>${item.subject || item.category || 'General issue'}</td>
                        <td><span class="status ${item.status === 'resolved' ? 'resolved' : item.status === 'processing' ? 'progress' : 'pending'}">${item.status || 'Pending'}</span></td>
                        <td><select class="admin-status" data-id="${item.id}" aria-label="Update complaint status"><option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option><option value="processing" ${item.status === 'processing' ? 'selected' : ''}>Processing</option><option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option><option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>Rejected</option></select></td>
                    </tr>
                `).join('');
                [complaintsTable, recentComplaintsTable].filter(Boolean).forEach((table) => {
                    table.innerHTML = rows || '<tr><td colspan="5">No complaints found.</td></tr>';
                });
                document.querySelectorAll('.admin-status').forEach((select) => {
                    select.addEventListener('change', async () => {
                        const response = await apiFetch(`${API_BASE}/api/complaints/${select.dataset.id}/status/`, {
                            method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': decodeURIComponent((document.cookie.match(/(?:^|; )csrftoken=([^;]+)/) || [])[1] || '') },
                            body: JSON.stringify({ status: select.value })
                        });
                        if (!response.ok) alert('Unable to save the complaint status.');
                        else loadDashboardData();
                    });
                });
            }
        } catch (error) {
            console.warn('Dashboard data unavailable, using static demo data.', error);
        }
    }

    verifyAdminSession().then((ok) => { if (ok) loadDashboardData(); });

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebarToggle");

    const menuLinks =
        document.querySelectorAll(".menu-link");

    const sections =
        document.querySelectorAll(".page-section");

    const pageTitle =
        document.getElementById("pageTitle");

    const profileBtn =
        document.getElementById("adminProfileBtn");

    const profileMenu =
        document.getElementById("profileMenu");

    const globalSearch =
        document.getElementById("globalSearch");

    const modal =
        document.getElementById("actionModal");

    const modalClose =
        document.getElementById("modalClose");

    const modalCancel =
        document.getElementById("modalCancel");

    const modalConfirm =
        document.getElementById("modalConfirm");

    const modalTitle =
        document.getElementById("modalTitle");

    const modalMessage =
        document.getElementById("modalMessage");

    const modalName =
        document.getElementById("modalName");

    const modalDescription =
        document.getElementById("modalDescription");

    const toast =
        document.getElementById("toastMessage");

    const toastTitle =
        document.getElementById("toastTitle");

    const toastText =
        document.getElementById("toastText");

    const toastClose =
        document.getElementById("toastClose");


    /* =====================================================
       SECTION TITLES
    ===================================================== */

    const sectionTitles = {

        dashboard: "Dashboard Overview",

        users: "User Management",

        complaints: "Complaint Management",

        news: "News Management",

        tourism: "Tourism Management",

        transport: "Transportation Management",

        services: "Services Management",

        emergency: "Emergency Management",

        faq: "FAQ Management",

        chatbot: "AI Chatbot",

        recovery: "Recovery / Trash",

        profile: "Admin Profile",

        settings: "System Settings"

    };


    /* =====================================================
       SHOW SECTION
    ===================================================== */

    function showSection(sectionId) {

        sections.forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });


        const target =
            document.getElementById(sectionId);

        if (target) {

            target.classList.add(
                "active-section"
            );

        }


        menuLinks.forEach(link => {

            link.classList.remove("active");

            if (
                link.dataset.section === sectionId
            ) {

                link.classList.add("active");

            }

        });


        if (sectionTitles[sectionId]) {

            pageTitle.textContent =
                sectionTitles[sectionId];

        }


        profileMenu.classList.remove("show");


        if (
            window.innerWidth <= 900
        ) {

            sidebar.classList.remove(
                "mobile-show"
            );

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }


    /* =====================================================
       SIDEBAR NAVIGATION
    ===================================================== */

    menuLinks.forEach(link => {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            const section =
                this.dataset.section;

            if (section) {

                showSection(section);

            }

        });

    });


    /* =====================================================
       OTHER SECTION BUTTONS
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-section]"
                );

            if (
                button &&
                !button.classList.contains(
                    "menu-link"
                )
            ) {

                event.preventDefault();

                showSection(
                    button.dataset.section
                );

            }

        }
    );


    /* =====================================================
       SIDEBAR TOGGLE
    ===================================================== */

    sidebarToggle.addEventListener(
        "click",
        function () {

            if (
                window.innerWidth <= 900
            ) {

                sidebar.classList.toggle(
                    "mobile-show"
                );

            } else {

                sidebar.classList.toggle(
                    "collapsed"
                );

                if (
                    sidebar.classList.contains(
                        "collapsed"
                    )
                ) {

                    sidebar.style.width =
                        "82px";

                    document
                        .querySelector(
                            ".main-content"
                        )
                        .style.marginLeft =
                        "82px";

                } else {

                    sidebar.style.width =
                        "270px";

                    document
                        .querySelector(
                            ".main-content"
                        )
                        .style.marginLeft =
                        "270px";

                }

            }

        }
    );


    /* =====================================================
       PROFILE DROPDOWN
    ===================================================== */

    profileBtn.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            profileMenu.classList.toggle(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".admin-dropdown"
                )
            ) {

                profileMenu.classList.remove(
                    "show"
                );

            }

        }
    );


    /* =====================================================
       MODAL FUNCTIONS
    ===================================================== */

    let currentAction = null;


    function openModal(
        title,
        message,
        action = "edit"
    ) {

        currentAction = action;

        modalTitle.textContent =
            title;

        modalMessage.textContent =
            message;

        modal.classList.add("show");

        modalName.focus();

    }


    function closeModal() {

        modal.classList.remove(
            "show"
        );

        currentAction = null;

    }


    modalClose.addEventListener(
        "click",
        closeModal
    );

    modalCancel.addEventListener(
        "click",
        closeModal
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeModal();

            }

        }
    );


    /* =====================================================
       VIEW BUTTON
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".action-btn.view"
                );

            if (!button) return;

            const row =
                button.closest("tr");

            let title =
                "View Record";

            let message =
                "Here is the selected record.";

            if (row) {

                const cells =
                    row.querySelectorAll("td");

                if (cells.length > 0) {

                    title =
                        cells[0].textContent.trim();

                }

            }

            openModal(
                title,
                message,
                "view"
            );

            modalConfirm.style.display =
                "none";

            modalName.value =
                title;

            modalDescription.value =
                "Record details are displayed here.";

            modalName.disabled = true;

            modalDescription.disabled = true;

        }
    );


    /* =====================================================
       EDIT BUTTON
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".action-btn.edit"
                );

            if (!button) return;

            const row =
                button.closest("tr");

            let recordName =
                "Selected Record";

            if (row) {

                const cells =
                    row.querySelectorAll("td");

                if (cells.length > 0) {

                    recordName =
                        cells[0].textContent.trim();

                }

            }

            modalConfirm.style.display =
                "inline-flex";

            modalName.disabled = false;

            modalDescription.disabled = false;

            modalName.value =
                recordName;

            modalDescription.value =
                "Update this record information.";

            openModal(
                "Edit Record",
                "Update the information below.",
                "edit"
            );

        }
    );


    /* =====================================================
       DELETE BUTTON
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".action-btn.delete"
                );

            if (!button) return;

            const row =
                button.closest("tr");

            let recordName =
                "this record";

            if (row) {

                const firstCell =
                    row.querySelector("td");

                if (firstCell) {

                    recordName =
                        firstCell.textContent.trim();

                }

            }

            const confirmed =
                confirm(
                    `Move "${recordName}" to Recovery / Trash?`
                );

            if (!confirmed) return;


            if (row) {

                row.style.opacity = "0";

                row.style.transform =
                    "translateX(20px)";

                row.style.transition =
                    "0.25s";

                setTimeout(
                    function () {

                        row.remove();

                    },
                    300
                );

            }


            showToast(
                "Deleted",
                "Record moved to Recovery."
            );

        }
    );


    /* =====================================================
       RESTORE
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".restore-btn"
                );

            if (!button) return;

            const row =
                button.closest("tr");

            if (row) {

                row.remove();

            }

            showToast(
                "Restored",
                "Record has been successfully restored."
            );

        }
    );


    /* =====================================================
       PERMANENT DELETE
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".permanent-delete"
                );

            if (!button) return;

            const confirmed =
                confirm(
                    "Permanently delete this record? This cannot be undone."
                );

            if (!confirmed) return;

            const row =
                button.closest("tr");

            if (row) {

                row.remove();

            }

            showToast(
                "Permanently Deleted",
                "Record has been permanently removed."
            );

        }
    );


    /* =====================================================
       SAVE EDIT
    ===================================================== */

    modalConfirm.addEventListener(
        "click",
        function () {

            if (
                currentAction !== "edit"
            ) return;

            const name =
                modalName.value.trim();

            if (!name) {

                showToast(
                    "Error",
                    "Please enter a name."
                );

                return;

            }

            closeModal();

            showToast(
                "Updated",
                "Record information updated successfully."
            );

        }
    );


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer;


    function showToast(
        title,
        message
    ) {

        toastTitle.textContent =
            title;

        toastText.textContent =
            message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                3500
            );

    }


    toastClose.addEventListener(
        "click",
        function () {

            toast.classList.remove(
                "show"
            );

        }
    );


    /* =====================================================
       QUICK ACTIONS
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-action]"
                );

            if (!button) return;

            const action =
                button.dataset.action;


            if (
                action === "view-complaints"
            ) {

                showSection(
                    "complaints"
                );

                return;

            }


            const actionNames = {

                "add-user":
                    "Add New User",

                "add-news":
                    "Add New News",

                "add-tourism":
                    "Add Tourist Place",

                "add-transport":
                    "Add Transportation Route",

                "add-service":
                    "Add New Service",

                "add-emergency":
                    "Add Emergency Contact",

                "add-faq":
                    "Add New FAQ"

            };


            if (actionNames[action]) {

                modalConfirm.style.display =
                    "inline-flex";

                modalName.disabled =
                    false;

                modalDescription.disabled =
                    false;

                modalName.value = "";

                modalDescription.value = "";

                openModal(
                    actionNames[action],
                    "Enter the required information.",
                    "add"
                );

            }

        }
    );


    /* =====================================================
       GLOBAL SEARCH
    ===================================================== */

    globalSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .toLowerCase()
                    .trim();

            if (!search) return;


            let foundSection = null;


            document
                .querySelectorAll(
                    ".page-section"
                )
                .forEach(
                    section => {

                        const text =
                            section.textContent
                                .toLowerCase();

                        if (
                            text.includes(search)
                        ) {

                            if (
                                !foundSection
                            ) {

                                foundSection =
                                    section.id;

                            }

                        }

                    }
                );


            if (foundSection) {

                showSection(
                    foundSection
                );

            }

        }
    );


    /* =====================================================
       TABLE SEARCH
    ===================================================== */

    document.addEventListener(
        "input",
        function (event) {

            if (
                !event.target.classList.contains(
                    "table-search"
                )
            ) return;

            const search =
                event.target.value
                    .toLowerCase()
                    .trim();

            const table =
                event.target
                    .closest(".dashboard-card")
                    ?.querySelector(
                        "tbody"
                    );

            if (!table) return;

            table
                .querySelectorAll("tr")
                .forEach(
                    row => {

                        const text =
                            row.textContent
                                .toLowerCase();

                        row.style.display =
                            text.includes(search)
                                ? ""
                                : "none";

                    }
                );

        }
    );


    /* =====================================================
       FILTER
    ===================================================== */

    document.addEventListener(
        "change",
        function (event) {

            if (
                !event.target.classList.contains(
                    "filter-select"
                )
            ) return;

            const value =
                event.target.value
                    .toLowerCase();

            const card =
                event.target.closest(
                    ".dashboard-card"
                );

            const tbody =
                card?.querySelector(
                    "tbody"
                );

            if (!tbody) return;


            tbody
                .querySelectorAll("tr")
                .forEach(
                    row => {

                        if (
                            value === "all users" ||
                            value === "all status"
                        ) {

                            row.style.display =
                                "";

                            return;

                        }


                        const rowText =
                            row.textContent
                                .toLowerCase();

                        row.style.display =
                            rowText.includes(
                                value
                            )
                                ? ""
                                : "none";

                    }
                );

        }
    );


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    const notificationBtn =
        document.getElementById(
            "notificationBtn"
        );

    notificationBtn.addEventListener(
        "click",
        function () {

            showToast(
                "Notifications",
                "You have 4 new notifications."
            );

        }
    );


    /* =====================================================
       EMPTY TRASH
    ===================================================== */

    const emptyTrash =
        document.getElementById(
            "emptyTrash"
        );

    if (emptyTrash) {

        emptyTrash.addEventListener(
            "click",
            function () {

                const confirmed =
                    confirm(
                        "Permanently delete all items in Recovery?"
                    );

                if (!confirmed) return;

                const tbody =
                    document.querySelector(
                        "#recovery tbody"
                    );

                if (tbody) {

                    tbody.innerHTML = "";

                }

                showToast(
                    "Trash Empty",
                    "All deleted records were permanently removed."
                );

            }
        );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        const confirmed =
            confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmed) return;

        try {
            await apiFetch(`${API_BASE}/api/logout/`, { method: "POST", headers: { "X-CSRFToken": decodeURIComponent((document.cookie.match(/(?:^|; )csrftoken=([^;]+)/) || [])[1] || '') } });
        } finally {
            localStorage.clear();
        }

        showToast(
            "Logged Out",
            "You have been logged out successfully."
        );

        setTimeout(
            function () {

                window.location.href =
                    "login-register.html";

            },
            1200
        );

    }


    document
        .getElementById("logoutBtn")
        .addEventListener(
            "click",
            logout
        );


    document
        .getElementById("profileLogout")
        .addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logout();

            }
        );


    /* =====================================================
       EDIT PROFILE
    ===================================================== */

    const editProfile =
        document.getElementById(
            "editProfile"
        );

    if (editProfile) {

        editProfile.addEventListener(
            "click",
            function () {

                modalConfirm.style.display =
                    "inline-flex";

                modalName.disabled =
                    false;

                modalDescription.disabled =
                    false;

                modalName.value =
                    "Admin User";

                modalDescription.value =
                    "Super Administrator";

                openModal(
                    "Edit Admin Profile",
                    "Update your administrator information.",
                    "edit"
                );

            }
        );

    }


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    const changePassword =
        document.getElementById(
            "changePassword"
        );

    if (changePassword) {

        changePassword.addEventListener(
            "click",
            function () {

                openModal(
                    "Change Password",
                    "Password management will be connected to your backend.",
                    "password"
                );

            }
        );

    }


    /* =====================================================
       DARK MODE
    ===================================================== */

    const darkModeToggle =
        document.getElementById(
            "darkModeToggle"
        );


    if (darkModeToggle) {

        const savedTheme =
            localStorage.getItem(
                "janaksewa-theme"
            );

        if (
            savedTheme === "dark"
        ) {

            document.body.classList.add(
                "dark-mode"
            );

            darkModeToggle.checked =
                true;

        }


        darkModeToggle.addEventListener(
            "change",
            function () {

                if (this.checked) {

                    document.body.classList.add(
                        "dark-mode"
                    );

                    localStorage.setItem(
                        "janaksewa-theme",
                        "dark"
                    );

                } else {

                    document.body.classList.remove(
                        "dark-mode"
                    );

                    localStorage.setItem(
                        "janaksewa-theme",
                        "light"
                    );

                }

            }
        );

    }


    /* =====================================================
       EXPORT COMPLAINTS
    ===================================================== */

    const exportComplaints =
        document.getElementById(
            "exportComplaints"
        );

    if (exportComplaints) {

        exportComplaints.addEventListener(
            "click",
            function () {

                const csv =
`Complaint ID,Citizen,Category,Date,Status
CMP-1024,Ram Kumar,Road,2026-08-31,Pending
CMP-1023,Sita Devi,Street Light,2026-08-30,In Progress`;

                const blob =
                    new Blob(
                        [csv],
                        {
                            type:
                                "text/csv;charset=utf-8;"
                        }
                    );

                const url =
                    URL.createObjectURL(
                        blob
                    );

                const link =
                    document.createElement(
                        "a"
                    );

                link.href = url;

                link.download =
                    "janaksewa-complaints.csv";

                link.click();

                URL.revokeObjectURL(
                    url
                );

                showToast(
                    "Export Complete",
                    "Complaint data has been exported."
                );

            }
        );

    }


    /* =====================================================
       BOOTSTRAP TOOLTIP
    ===================================================== */

    if (
        typeof bootstrap !==
        "undefined"
    ) {

        document
            .querySelectorAll(
                '[data-bs-toggle="tooltip"]'
            )
            .forEach(
                element => {

                    new bootstrap.Tooltip(
                        element
                    );

                }
            );

    }


    /* =====================================================
       DEFAULT PAGE
    ===================================================== */

    showSection("dashboard");

});
