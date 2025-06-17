// Variabel global untuk elemen DOM dan state aplikasi
let calendarGrid,
    currentMonthYearEl,
    prevMonthBtn,
    nextMonthBtn,
    expenseForm,
    expenseDescriptionInput,
    expenseAmountInput,
    expenseListEl,
    selectedDateDisplayPengeluaran, // Diubah dari selectedDateDisplay
    noExpensesMessage,
    dailyTotalEl, // Untuk pengeluaran
    expensesChartCanvasCtx;

let expenseSearchInput, expenseSearchBtn, expenseSearchResultsEl;
let currentMonthExpenses = []; // Untuk menyimpan semua pengeluaran bulan ini

let incomeForm,
    incomeDescriptionInput,
    incomeAmountInput,
    incomeListEl, // ID ini sama dengan expenseListEl, perlu dibedakan jika tampil bersamaan
    noIncomesMessage,
    dailyTotalIncomeEl, // Untuk pemasukan
    selectedDateDisplayPemasukan,
    tabPengeluaran,
    tabPemasukan,
    contentPengeluaran,
    contentPemasukan;

let expensesChart;
let currentDate;
let selectedDate = null; // Tanggal yang sedang dipilih oleh pengguna

// Konstanta
const MIN_DATE = new Date(2025, 4, 1); // Mei (bulan ke-4, 0-indexed)
const MAX_DATE = new Date(2025, 11, 31); // Desember (bulan ke-11, 0-indexed)
const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];

// --- Fungsi Utilitas ---
function formatNumberInput(value) {
    if (!value) return "";
    let numStr = String(value).replace(/[^\d]/g, "");
    if (numStr === "") return "";
    return parseInt(numStr, 10).toLocaleString("id-ID");
}

function getUnformattedNumber(formattedValue) {
    if (!formattedValue) return 0;
    return parseInt(String(formattedValue).replace(/\./g, ""), 10) || 0;
}

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateISO(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// --- Event Listener Utama ---
document.addEventListener("DOMContentLoaded", function () {
    // Pengeluaran
    calendarGrid = document.getElementById("calendarGrid");
    currentMonthYearEl = document.getElementById("currentMonthYear");
    prevMonthBtn = document.getElementById("prevMonthBtn");
    nextMonthBtn = document.getElementById("nextMonthBtn");
    expenseForm = document.getElementById("expenseForm");
    expenseDescriptionInput = document.getElementById("expenseDescription");
    expenseAmountInput = document.getElementById("expenseAmount");
    expenseListEl = document.getElementById("expenseList"); // Target untuk daftar pengeluaran
    selectedDateDisplayPengeluaran = document.getElementById(
        "selectedDateDisplayPengeluaran"
    ); // ID dari HTML Anda
    noExpensesMessage = document.getElementById("noExpensesMessage"); // Target untuk pesan "tidak ada pengeluaran"
    dailyTotalEl = document.getElementById("dailyTotal"); // Target untuk total pengeluaran

    // Pemasukan
    incomeForm = document.getElementById("incomeForm");
    incomeDescriptionInput = document.getElementById("incomeDescription");
    incomeAmountInput = document.getElementById("incomeAmount");
    incomeListEl = document.getElementById("incomeList"); // Target untuk daftar pemasukan
    noIncomesMessage = document.getElementById("noIncomesMessage"); // Target untuk pesan "tidak ada pemasukan"
    dailyTotalIncomeEl = document.getElementById("dailyTotalIncome");
    selectedDateDisplayPemasukan = document.getElementById(
        "selectedDateDisplayPemasukan"
    );

    // Inisialisasi elemen Pencarian
    expenseSearchInput = document.getElementById("expenseSearchInput");
    expenseSearchBtn = document.getElementById("expenseSearchBtn");
    expenseSearchResultsEl = document.getElementById("expenseSearchResults");

    // Inisialisasi elemen Tab
    tabPengeluaran = document.getElementById("tabPengeluaran");
    tabPemasukan = document.getElementById("tabPemasukan");
    contentPengeluaran = document.getElementById("contentPengeluaran");
    contentPemasukan = document.getElementById("contentPemasukan");

    const canvasElement = document.getElementById("expensesChart");
    if (canvasElement) {
        expensesChartCanvasCtx = canvasElement.getContext("2d");
    } else {
        console.error(
            "Elemen canvas 'expensesChart' tidak ditemukan saat DOMContentLoaded."
        );
    }

    // Event Listeners
    if (expenseForm) expenseForm.addEventListener("submit", addExpense);
    if (incomeForm) incomeForm.addEventListener("submit", addIncome);

    if (prevMonthBtn)
        prevMonthBtn.onclick = async () => {
            if (!currentDate) return;
            clearSearchResults(); // KOSONGKAN HASIL PENCARIAN
            currentDate.setMonth(currentDate.getMonth() - 1);
            await renderCalendar();
            await renderFinancialSummaryChart(); // Ganti nama fungsi chart jika sudah diubah
        };
    if (nextMonthBtn)
        nextMonthBtn.onclick = async () => {
            if (!currentDate) return;
            clearSearchResults(); // KOSONGKAN HASIL PENCARIAN
            currentDate.setMonth(currentDate.getMonth() + 1);
            await renderCalendar();
            await renderFinancialSummaryChart(); // Ganti nama fungsi chart jika sudah diubah
        };

    if (expenseAmountInput) {
        expenseAmountInput.addEventListener("input", function (e) {
            const originalValue = e.target.value;
            const formattedValue = formatNumberInput(originalValue);
            if (originalValue !== formattedValue)
                e.target.value = formattedValue;
        });
        expenseAmountInput.addEventListener("keypress", function (e) {
            if (e.key.length === 1 && (e.key < "0" || e.key > "9"))
                e.preventDefault();
        });
    }
    if (incomeAmountInput) {
        incomeAmountInput.addEventListener("input", function (e) {
            const originalValue = e.target.value;
            const formattedValue = formatNumberInput(originalValue);
            if (originalValue !== formattedValue)
                e.target.value = formattedValue;
        });
        incomeAmountInput.addEventListener("keypress", function (e) {
            if (e.key.length === 1 && (e.key < "0" || e.key > "9"))
                e.preventDefault();
        });
    }

    // Event listener untuk tombol tab (jika belum ada di HTML onclick)
    if (tabPengeluaran) tabPengeluaran.onclick = () => switchTab("pengeluaran");
    if (tabPemasukan) tabPemasukan.onclick = () => switchTab("pemasukan");

    // Event listener untuk tombol cari
    if (expenseSearchBtn) {
        expenseSearchBtn.onclick = handleSearchExpenses;
    }
    // Opsional: Cari saat menekan Enter di input field
    if (expenseSearchInput) {
        expenseSearchInput.addEventListener("keyup", function (event) {
            if (event.key === "Enter") {
                handleSearchExpenses();
            }
        });
    }

    initializeApp();
});

// --- Fungsi Fetch Data ---
async function fetchExpensesForDate(isoDate) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/expenses?date=${isoDate}`
        );
        if (!response.ok) {
            console.error(
                "API Error (fetchExpensesForDate):",
                response.status,
                await response
                    .text()
                    .catch(() => "Gagal mengambil detail error")
            );
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch error for date (fetchExpensesForDate):", error);
        return [];
    }
}

async function fetchIncomesForDate(isoDate) {
    try {
        const response = await fetch(`${API_BASE_URL}/incomes?date=${isoDate}`);
        if (!response.ok) {
            console.error(
                "API Error (fetchIncomesForDate):",
                response.status,
                await response
                    .text()
                    .catch(() => "Gagal mengambil detail error")
            );
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch error for date (fetchIncomesForDate):", error);
        return [];
    }
}

async function fetchExpensesForMonth(year, monthZeroIndexed) {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`);
        if (!response.ok) {
            console.error(
                "API Error (fetchExpensesForMonth):",
                response.status,
                await response
                    .text()
                    .catch(() => "Gagal mengambil detail error")
            );
            return [];
        }
        const allExpenses = await response.json();
        // console.log(`RAW DATA dari /api/expenses (fetchExpensesForMonth) untuk ${year}-${monthZeroIndexed + 1}:`, JSON.stringify(allExpenses));
        const filteredExpenses = allExpenses.filter((exp) => {
            if (!exp.date) return false;
            const expDate = new Date(exp.date);
            return (
                expDate.getUTCFullYear() === year &&
                expDate.getUTCMonth() === monthZeroIndexed
            );
        });
        // console.log(`HASIL FILTER untuk ${year}-${monthZeroIndexed + 1} (expensesInCurrentMonth):`, JSON.stringify(filteredExpenses));
        return filteredExpenses;
    } catch (error) {
        console.error("Fetch error for month (fetchExpensesForMonth):", error);
        return [];
    }
}

// --- Fungsi Render UI ---
// Ganti fungsi renderCalendar Anda dengan yang ini:

// Ganti fungsi renderCalendar Anda dengan versi yang lebih lengkap ini:

async function renderCalendar() {
    if (!calendarGrid || !currentMonthYearEl || !currentDate) {
        console.warn(
            "Elemen kalender atau currentDate tidak siap untuk renderCalendar"
        );
        return;
    }
    calendarGrid.innerHTML = ""; // Kosongkan grid kalender
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    // ... (kode untuk membuat dayHeaders dan sel kosong di awal bulan) ...
    const dayHeaders = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    dayHeaders.forEach((header) => {
        const headerEl = document.createElement("div");
        headerEl.className =
            "font-semibold text-rose-800 text-sm text-center py-2";
        headerEl.textContent = header;
        calendarGrid.appendChild(headerEl);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyCell = document.createElement("div");
        calendarGrid.appendChild(emptyCell);
    }

    // --- PERUBAHAN UTAMA DI SINI ---
    // Ambil data pengeluaran DAN pemasukan untuk bulan ini secara bersamaan
    const [expensesInMonth, incomesInMonth] = await Promise.all([
        fetchExpensesForMonth(year, month),
        fetchIncomesForMonth(year, month), // Panggil fungsi fetch untuk pemasukan
    ]);

    // Simpan data pengeluaran untuk fitur pencarian
    currentMonthExpenses = expensesInMonth;
    // --- AKHIR PERUBAHAN UTAMA ---

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Buat sel untuk setiap hari di bulan ini
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement("button");
        dayEl.textContent = day;
        dayEl.className =
            "calendar-day p-2 rounded-lg aspect-square flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-colors duration-150";
        const dateValue = new Date(year, month, day);
        dateValue.setHours(0, 0, 0, 0);

        // ... (logika untuk highlight hari ini, disabled, dan selected state) ...
        if (dateValue.getTime() === today.getTime())
            dayEl.classList.add("today-highlight");
        if (dateValue < MIN_DATE || dateValue > MAX_DATE) {
            dayEl.classList.add("disabled");
            if (dateValue.getTime() === today.getTime())
                dayEl.classList.remove("today-highlight");
        } else {
            dayEl.onclick = () => handleDateClick(dateValue);
        }
        if (
            selectedDate &&
            dateValue.toDateString() === selectedDate.toDateString()
        )
            dayEl.classList.add("selected");

        // Tandai hari yang memiliki PENGELUARAN
        if (
            expensesInMonth &&
            expensesInMonth.some(
                (exp) => exp.date.substring(0, 10) === formatDateISO(dateValue)
            )
        ) {
            dayEl.classList.add("has-expenses");
        }

        // Tandai hari yang memiliki PEMASUKAN
        if (
            incomesInMonth &&
            incomesInMonth.some(
                (inc) => inc.date.substring(0, 10) === formatDateISO(dateValue)
            )
        ) {
            dayEl.classList.add("has-income"); // Tambahkan kelas baru ini
        }

        calendarGrid.appendChild(dayEl);
    }
    updateNavigationButtons();
}

function handleSearchExpenses() {
    if (!expenseSearchInput || !expenseSearchResultsEl || !currentMonthExpenses)
        return;

    const searchTerm = expenseSearchInput.value.trim().toLowerCase();
    expenseSearchResultsEl.innerHTML = ""; // Kosongkan hasil pencarian sebelumnya

    if (!searchTerm) {
        // Jika input pencarian kosong, tidak perlu melakukan apa-apa
        // atau bisa juga menampilkan pesan "Ketik sesuatu untuk dicari"
        return;
    }

    const results = currentMonthExpenses.filter((exp) =>
        exp.description.toLowerCase().includes(searchTerm)
    );

    if (results.length === 0) {
        expenseSearchResultsEl.innerHTML =
            '<p class="text-gray-500 italic p-2">Tidak ditemukan pengeluaran dengan kata kunci "' +
            searchTerm +
            '" di bulan ini.</p>';
        return;
    }

    const resultsList = document.createElement("ul");
    resultsList.className = "space-y-3";

    results.forEach((exp) => {
        const li = document.createElement("li");
        // Buat item list bisa diklik untuk pindah ke tanggal tersebut
        li.className =
            "flex justify-between items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer hover:bg-sky-50";
        li.onclick = () => handleDateClick(new Date(exp.date)); // Navigasi ke tanggal saat diklik

        li.innerHTML = `
            <div class="flex flex-col">
                <span class="font-semibold text-gray-800">${
                    exp.description
                }</span>
                <span class="text-xs text-gray-500">${formatDate(
                    new Date(exp.date)
                )}</span>
            </div>
            <span class="text-rose-600 font-semibold">Rp ${Number(
                exp.amount
            ).toLocaleString("id-ID")}</span>
        `;
        resultsList.appendChild(li);
    });

    expenseSearchResultsEl.appendChild(resultsList);
}

function clearSearchResults() {
    if (expenseSearchResultsEl) expenseSearchResultsEl.innerHTML = "";
    if (expenseSearchInput) expenseSearchInput.value = "";
}

function updateNavigationButtons() {
    if (!prevMonthBtn || !nextMonthBtn || !currentDate) return;
    const prevMonthTest = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
    );
    const nextMonthTest = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
    );
    prevMonthBtn.disabled =
        prevMonthTest.getFullYear() < MIN_DATE.getFullYear() ||
        (prevMonthTest.getFullYear() === MIN_DATE.getFullYear() &&
            prevMonthTest.getMonth() < MIN_DATE.getMonth());
    nextMonthBtn.disabled =
        nextMonthTest.getFullYear() > MAX_DATE.getFullYear() ||
        (nextMonthTest.getFullYear() === MAX_DATE.getFullYear() &&
            nextMonthTest.getMonth() > MAX_DATE.getMonth());
}

async function handleDateClick(date) {
    clearSearchResults(); // KOSONGKAN HASIL PENCARIAN
    selectedDate = date;
    const formattedCurrentDate = formatDate(selectedDate);
    // Update display tanggal di kedua tab
    if (selectedDateDisplayPengeluaran)
        selectedDateDisplayPengeluaran.textContent = formattedCurrentDate;
    if (selectedDateDisplayPemasukan)
        selectedDateDisplayPemasukan.textContent = formattedCurrentDate;

    await renderCalendar(); // Untuk update highlight tanggal terpilih dan 'has-expenses'
    await renderExpensesForSelectedDate(); // Muat dan tampilkan pengeluaran
    await renderIncomesForSelectedDate(); // Muat dan tampilkan pemasukan

    if (expenseForm) expenseForm.reset();
    if (incomeForm) incomeForm.reset();
    if (expenseAmountInput) expenseAmountInput.value = "";
    if (incomeAmountInput) incomeAmountInput.value = "";

    // Fokus ke input deskripsi di tab yang aktif
    if (
        contentPengeluaran &&
        !contentPengeluaran.classList.contains("hidden") &&
        expenseDescriptionInput
    ) {
        expenseDescriptionInput.focus();
    } else if (
        contentPemasukan &&
        !contentPemasukan.classList.contains("hidden") &&
        incomeDescriptionInput
    ) {
        incomeDescriptionInput.focus();
    }
}

// FUNGSI YANG HILANG DITAMBAHKAN DI SINI
async function renderExpensesForSelectedDate() {
    if (!expenseListEl || !noExpensesMessage || !dailyTotalEl) {
        console.error("Elemen DOM untuk daftar pengeluaran tidak ditemukan.");
        return;
    }
    expenseListEl.innerHTML = "";

    if (!selectedDate) {
        noExpensesMessage.style.display = "block";
        dailyTotalEl.textContent = "Rp 0";
        return;
    }

    const isoDateStr = formatDateISO(selectedDate);
    const dayExpenses = await fetchExpensesForDate(isoDateStr);

    if (dayExpenses.length === 0) {
        noExpensesMessage.style.display = "block";
        dailyTotalEl.textContent = "Rp 0";
    } else {
        noExpensesMessage.style.display = "none";
        dayExpenses.forEach((exp) => {
            const li = document.createElement("li");
            li.className =
                "flex justify-between items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow";

            // PERBAIKAN: data-id ditambahkan langsung ke tombol di bawah ini
            li.innerHTML = `
                <span class="text-gray-700">${exp.description}</span>
                <div class="flex items-center space-x-2">
                    <span class="text-rose-600 font-semibold">Rp ${Number(
                        exp.amount
                    ).toLocaleString("id-ID")}</span>
                    <button data-id="${
                        exp.id
                    }" class="delete-expense-btn text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-100 transition-colors">Hapus</button>
                </div>`;
            expenseListEl.appendChild(li);
        });
        dailyTotalEl.innerHTML = `Rp <span class="font-bold">${dayExpenses
            .reduce((sum, exp) => sum + Number(exp.amount), 0)
            .toLocaleString("id-ID")}</span>`;
    }
    addDeleteEventListeners();
    await renderFinancialSummaryChart(); // Atau renderExpensesChart jika belum diganti
}

async function renderIncomesForSelectedDate() {
    if (!incomeListEl || !noIncomesMessage || !dailyTotalIncomeEl) {
        console.error("Elemen DOM untuk daftar pemasukan tidak ditemukan.");
        return;
    }
    incomeListEl.innerHTML = "";

    if (!selectedDate) {
        noIncomesMessage.style.display = "block";
        dailyTotalIncomeEl.textContent = "Rp 0";
        return;
    }
    const isoDateStr = formatDateISO(selectedDate);
    const dayIncomes = await fetchIncomesForDate(isoDateStr);

    if (dayIncomes.length === 0) {
        noIncomesMessage.style.display = "block";
        dailyTotalIncomeEl.textContent = "Rp 0";
    } else {
        noIncomesMessage.style.display = "none";
        dayIncomes.forEach((inc) => {
            const li = document.createElement("li");
            li.className =
                "flex justify-between items-center p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow";

            // PERBAIKAN: data-id ditambahkan langsung ke tombol di bawah ini
            li.innerHTML = `
                <span class="text-gray-700">${inc.description}</span>
                <div class="flex items-center space-x-2">
                    <span class="text-green-600 font-semibold">Rp ${Number(
                        inc.amount
                    ).toLocaleString("id-ID")}</span>
                    <button data-id="${
                        inc.id
                    }" class="delete-income-btn text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-100 transition-colors">Hapus</button>
                </div>`;
            incomeListEl.appendChild(li);
        });
        dailyTotalIncomeEl.innerHTML = `Rp <span class="font-bold">${dayIncomes
            .reduce((sum, inc) => sum + Number(inc.amount), 0)
            .toLocaleString("id-ID")}</span>`;
    }
    addDeleteEventListeners();
}

// --- Fungsi Aksi (Tambah/Hapus) ---
async function addExpense(e) {
    e.preventDefault();
    if (!selectedDate) {
        alert("Silakan pilih tanggal terlebih dahulu.");
        return;
    }
    const description = expenseDescriptionInput.value.trim();
    const amount = getUnformattedNumber(expenseAmountInput.value);
    if (!description || isNaN(amount) || amount <= 0) {
        alert("Deskripsi dan jumlah pengeluaran harus valid.");
        return;
    }
    const newExpenseData = {
        date: formatDateISO(selectedDate),
        description,
        amount,
    };
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenMeta) {
        console.error("CSRF meta tag tidak ditemukan!");
        alert("Kesalahan konfigurasi (CSRF).");
        return;
    }
    const csrfToken = csrfTokenMeta.getAttribute("content");
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify(newExpenseData),
        });
        if (!response.ok) {
            if (response.status === 419)
                throw new Error(
                    "Sesi berakhir atau token tidak valid. Refresh halaman."
                );
            const errorData = await response
                .json()
                .catch(() => ({ message: "Gagal menyimpan data." }));
            throw new Error(
                errorData.message || `Server error: ${response.status}`
            );
        }
        if (expenseForm) expenseForm.reset();
        if (expenseAmountInput) expenseAmountInput.value = "";
        await renderExpensesForSelectedDate();
        await renderCalendar();
        await renderMonthlyRecap();
    } catch (error) {
        console.error("Error adding expense:", error);
        alert(`Gagal menambahkan pengeluaran: ${error.message}`);
    }
}

async function addIncome(e) {
    e.preventDefault();
    if (!selectedDate) {
        alert("Silakan pilih tanggal untuk pemasukan.");
        return;
    }
    const description = incomeDescriptionInput.value.trim();
    const amount = getUnformattedNumber(incomeAmountInput.value);
    if (!description || isNaN(amount) || amount <= 0) {
        alert("Deskripsi dan jumlah pemasukan harus valid.");
        return;
    }
    const newIncomeData = {
        date: formatDateISO(selectedDate),
        description,
        amount,
    };
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenMeta) {
        console.error("CSRF meta tag tidak ditemukan!");
        alert("Kesalahan konfigurasi (CSRF).");
        return;
    }
    const csrfToken = csrfTokenMeta.getAttribute("content");
    try {
        const response = await fetch(`${API_BASE_URL}/incomes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": csrfToken,
            },
            body: JSON.stringify(newIncomeData),
        });
        if (!response.ok) {
            if (response.status === 419)
                throw new Error(
                    "Sesi berakhir atau token tidak valid. Refresh halaman."
                );
            const errorData = await response
                .json()
                .catch(() => ({ message: "Gagal menyimpan data." }));
            throw new Error(
                errorData.message || `Server error: ${response.status}`
            );
        }
        if (incomeForm) incomeForm.reset();
        if (incomeAmountInput) incomeAmountInput.value = "";
        await renderIncomesForSelectedDate();
        await renderCalendar(); // Untuk update dot jika ada indikator pemasukan
        // await renderMonthlyRecap(); // Jika rekapan perlu update juga
    } catch (error) {
        console.error("Error adding income:", error);
        alert(`Gagal menambahkan pemasukan: ${error.message}`);
    }
}

async function deleteExpenseAPI(expenseId) {
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenMeta) {
        console.error("CSRF meta tag tidak ditemukan!");
        alert("Kesalahan konfigurasi (CSRF).");
        return;
    }
    const csrfToken = csrfTokenMeta.getAttribute("content");

    // Temukan elemen list item yang akan dihapus
    const itemToRemove = expenseListEl.querySelector(
        `li[data-id="${expenseId}"]`
    );

    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
            method: "DELETE",
            headers: { Accept: "application/json", "X-CSRF-TOKEN": csrfToken },
        });

        if (!response.ok && response.status !== 204) {
            // ... (logika error Anda yang sudah ada) ...
            throw new Error(`Server error: ${response.status}`);
        }

        // Jika API berhasil, mulai animasi penghapusan
        if (itemToRemove) {
            itemToRemove.classList.add("item-exit");
            // Hapus elemen dari DOM setelah animasi selesai
            itemToRemove.addEventListener("animationend", () => {
                itemToRemove.remove();
                // Setelah item dihapus, render ulang data untuk update total dan UI lainnya
                // Cukup panggil render ulang data untuk tanggal yang sama
                renderExpensesForSelectedDate();
            });
        } else {
            // Jika item tidak ditemukan di UI (kasus aneh), tetap render ulang
            renderExpensesForSelectedDate();
        }

        // Update kalender dan grafik secara langsung
        await renderCalendar();
        // renderFinancialSummaryChart akan dipanggil dari dalam renderExpensesForSelectedDate
    } catch (error) {
        console.error("Error deleting expense:", error);
        alert(`Gagal menghapus pengeluaran: ${error.message}`);
    }
}

async function deleteIncomeAPI(incomeId) {
    const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
    if (!csrfTokenMeta) {
        console.error("CSRF meta tag tidak ditemukan!");
        alert("Kesalahan konfigurasi (CSRF).");
        return;
    }
    const csrfToken = csrfTokenMeta.getAttribute("content");

    // Temukan elemen list item yang akan dihapus
    const itemToRemove = incomeListEl.querySelector(
        `li[data-id="${incomeId}"]`
    );

    try {
        const response = await fetch(`${API_BASE_URL}/incomes/${incomeId}`, {
            method: "DELETE",
            headers: { Accept: "application/json", "X-CSRF-TOKEN": csrfToken },
        });

        if (!response.ok && response.status !== 204) {
            // ... (logika error Anda yang sudah ada) ...
            throw new Error(`Server error: ${response.status}`);
        }

        // Jika API berhasil, mulai animasi penghapusan
        if (itemToRemove) {
            itemToRemove.classList.add("item-exit");
            itemToRemove.addEventListener("animationend", () => {
                itemToRemove.remove();
                renderIncomesForSelectedDate();
            });
        } else {
            renderIncomesForSelectedDate();
        }

        await renderCalendar();
        await renderFinancialSummaryChart();
    } catch (error) {
        console.error("Error deleting income:", error);
        alert(`Gagal menghapus pemasukan: ${error.message}`);
    }
}

async function fetchIncomesForMonth(year, monthZeroIndexed) {
    try {
        // Asumsi endpoint /incomes mengembalikan semua pemasukan untuk pengguna aktif
        const response = await fetch(`${API_BASE_URL}/incomes`); // Panggil endpoint pemasukan
        if (!response.ok) {
            console.error(
                "API Error (fetchIncomesForMonth):",
                response.status,
                await response
                    .text()
                    .catch(() => "Gagal mengambil detail error")
            );
            return [];
        }
        const allIncomes = await response.json();
        // console.log(`RAW DATA Pemasukan dari API (fetchIncomesForMonth) untuk ${year}-${monthZeroIndexed + 1}:`, JSON.stringify(allIncomes));

        const filteredIncomes = allIncomes.filter((inc) => {
            if (!inc.date) return false;
            const incDate = new Date(inc.date);
            return (
                incDate.getUTCFullYear() === year &&
                incDate.getUTCMonth() === monthZeroIndexed
            );
        });
        // console.log(`HASIL FILTER Pemasukan untuk ${year}-${monthZeroIndexed + 1}:`, JSON.stringify(filteredIncomes));
        return filteredIncomes;
    } catch (error) {
        console.error("Fetch error for month (fetchIncomesForMonth):", error);
        return [];
    }
}

function addDeleteEventListeners() {
    document.querySelectorAll(".delete-expense-btn").forEach((button) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener("click", async (event) => {
            const expenseId = event.target.dataset.id;
            if (confirm("Apakah Anda yakin ingin menghapus pengeluaran ini?")) {
                await deleteExpenseAPI(expenseId);
            }
        });
    });
    document.querySelectorAll(".delete-income-btn").forEach((button) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener("click", async (event) => {
            const incomeId = event.target.dataset.id;
            if (confirm("Apakah Anda yakin ingin menghapus pemasukan ini?")) {
                await deleteIncomeAPI(incomeId);
            }
        });
    });
}

// --- Fungsi Tab ---
function switchTab(tabName) {
    if (
        !contentPengeluaran ||
        !contentPemasukan ||
        !tabPengeluaran ||
        !tabPemasukan
    ) {
        console.error("Elemen tab tidak ditemukan.");
        return;
    }

    const activeContent =
        tabName === "pengeluaran" ? contentPemasukan : contentPengeluaran;
    const targetContent =
        tabName === "pengeluaran" ? contentPengeluaran : contentPemasukan;

    const activeTabButton =
        tabName === "pengeluaran" ? tabPemasukan : tabPengeluaran;
    const targetTabButton =
        tabName === "pengeluaran" ? tabPengeluaran : tabPemasukan;

    // Mulai sembunyikan konten yang aktif
    activeContent.classList.add("is-hiding");

    // Ganti gaya tombol tab
    activeTabButton.className =
        "tab-button w-1/2 py-3 px-1 text-center border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300";
    targetTabButton.className =
        "tab-button active-tab w-1/2 py-3 px-1 text-center border-b-2 font-medium text-sm border-rose-500"; // Warna dasar aktif
    if (tabName === "pemasukan") {
        targetTabButton.classList.add("text-green-600", "border-green-500"); // Warna spesifik untuk tab pemasukan
        targetTabButton.classList.remove("border-rose-500");
    } else {
        targetTabButton.classList.add("text-rose-600");
    }

    // Tunggu animasi 'is-hiding' selesai, lalu tukar tampilan
    setTimeout(() => {
        activeContent.classList.add("hidden");
        activeContent.classList.remove("is-hiding");

        targetContent.classList.remove("hidden");
    }, 200); // Durasi harus cocok dengan transisi di CSS (0.2s = 200ms)

    // Update tampilan tanggal terpilih di kedua tab
    if (
        selectedDate &&
        selectedDateDisplayPengeluaran &&
        selectedDateDisplayPemasukan
    ) {
        const formattedCurrentDate = formatDate(selectedDate);
        selectedDateDisplayPengeluaran.textContent = formattedCurrentDate;
        selectedDateDisplayPemasukan.textContent = formattedCurrentDate;
    }
}

// --- Fungsi Chart ---
async function renderFinancialSummaryChart() {
    if (!expensesChartCanvasCtx) {
        console.warn("Canvas context untuk chart belum siap.");
        const canvasElement = document.getElementById("expensesChart");
        if (canvasElement)
            expensesChartCanvasCtx = canvasElement.getContext("2d");
        else {
            console.error("Elemen canvas tidak ditemukan untuk chart.");
            return;
        }
    }

    if (expensesChart) {
        expensesChart.destroy();
        expensesChart = null;
    }

    if (!currentDate) {
        console.warn(
            "currentDate belum diinisialisasi untuk renderFinancialSummaryChart"
        );
        const chartElementContainer =
            document.querySelector(".chart-container");
        if (chartElementContainer) chartElementContainer.style.display = "none";
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const [expensesInMonth, incomesInMonth] = await Promise.all([
        fetchExpensesForMonth(year, month),
        fetchIncomesForMonth(year, month),
    ]);

    // ... (Logika Anda untuk memproses data: dailyExpenseTotals, dailyIncomeTotals) ...
    const dailyExpenseTotals = {};
    const dailyIncomeTotals = {};
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInCurrentMonth; i++) {
        const currentDayDate = new Date(year, month, i);
        if (currentDayDate >= MIN_DATE && currentDayDate <= MAX_DATE) {
            dailyExpenseTotals[i] = 0;
            dailyIncomeTotals[i] = 0;
        }
    }
    expensesInMonth.forEach((exp) => {
        if (!exp.date) return;
        const day = new Date(exp.date).getUTCDate();
        if (dailyExpenseTotals.hasOwnProperty(day))
            dailyExpenseTotals[day] += Number(exp.amount);
    });
    incomesInMonth.forEach((inc) => {
        if (!inc.date) return;
        const day = new Date(inc.date).getUTCDate();
        if (dailyIncomeTotals.hasOwnProperty(day))
            dailyIncomeTotals[day] += Number(inc.amount);
    });

    const labels = Object.keys(dailyExpenseTotals)
        .map((day) => String(day))
        .sort((a, b) => parseInt(a) - parseInt(b));
    const expenseDataForChart = labels.map(
        (day) => dailyExpenseTotals[parseInt(day)] || 0
    );
    const incomeDataForChart = labels.map(
        (day) => dailyIncomeTotals[parseInt(day)] || 0
    );

    const chartElementContainer = document.querySelector(".chart-container");
    const hasSignificantData =
        expenseDataForChart.some((val) => val > 0) ||
        incomeDataForChart.some((val) => val > 0);

    if (labels.length === 0 || !hasSignificantData) {
        if (chartElementContainer) chartElementContainer.style.display = "none";
        return;
    }
    if (chartElementContainer) chartElementContainer.style.display = "block";

    // --- PERUBAHAN UTAMA UNTUK RESPONSIVITAS DIMULAI DI SINI ---

    // Deteksi apakah ini layar mobile berdasarkan lebar window
    const isMobile = window.innerWidth < 768;

    expensesChart = new Chart(expensesChartCanvasCtx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Pengeluaran", // Label lebih pendek untuk mobile
                    data: expenseDataForChart,
                    backgroundColor: "rgba(225, 29, 72, 0.6)", // Merah
                    borderColor: "rgba(190, 18, 60, 1)",
                    borderWidth: 2,
                    barPercentage: 1.3, // Membuat bar sedikit lebih gemuk
                    categoryPercentage: 0.7, // Mengatur spasi antar kategori hari
                },
                {
                    label: "Pemasukan", // Label lebih pendek untuk mobile
                    data: incomeDataForChart,
                    backgroundColor: "rgba(22, 163, 74, 0.6)", // Hijau
                    borderColor: "rgba(21, 128, 61, 1)",
                    borderWidth: 1,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false,
                    ticks: {
                        // Di mobile, tampilkan lebih sedikit label tanggal agar tidak berdesakan
                        maxTicksLimit: isMobile ? 8 : 15, // Tampilkan maks 8 tick di mobile, 15 di desktop
                        font: {
                            size: isMobile ? 10 : 12, // Ukuran font label lebih kecil di mobile
                        },
                    },
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    ticks: {
                        // Fungsi callback untuk format Rupiah di sumbu Y
                        callback: (value) => {
                            // Format angka menjadi lebih pendek (misal: 200rb, 1jt) jika angkanya besar
                            if (value >= 1000000) {
                                return "Rp " + value / 1000000 + "jt";
                            }
                            if (value >= 1000) {
                                return "Rp " + value / 1000 + "rb";
                            }
                            return "Rp " + value.toLocaleString("id-ID");
                        },
                        font: {
                            size: isMobile ? 10 : 12, // Ukuran font label lebih kecil di mobile
                        },
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || "";
                            if (label) {
                                label += ": ";
                            }
                            if (context.parsed.y !== null) {
                                label +=
                                    "Rp " +
                                    context.parsed.y.toLocaleString("id-ID");
                            }
                            return label;
                        },
                    },
                },
                legend: {
                    // Di mobile, pindahkan legenda ke bawah. Di desktop, biarkan di atas.
                    position: isMobile ? "bottom" : "top",
                    labels: {
                        font: {
                            size: 12, // Ukuran font legenda
                        },
                        boxWidth: 15, // Lebar kotak warna legenda
                        padding: 20, // Jarak antar legenda
                    },
                },
            },
        },
    });
}

// --- Fungsi Rekapan Bulanan ---
async function renderMonthlyRecap() {
    const recapListEl = document.getElementById("monthlyRecapList");
    const noRecapMessageEl = document.getElementById("noMonthlyRecapMessage");
    if (!recapListEl || !noRecapMessageEl) {
        console.error("Elemen untuk rekapan bulanan tidak ditemukan.");
        return;
    }

    noRecapMessageEl.textContent = "Memuat data rekapan...";
    noRecapMessageEl.style.display = "block";
    recapListEl
        .querySelectorAll(".recap-item")
        .forEach((item) => item.remove());

    try {
        const response = await fetch(
            `${API_BASE_URL}/expenses/monthly-summary`
        );
        if (!response.ok) {
            const errorText = await response
                .text()
                .catch(() => "Tidak bisa mengambil detail error");
            throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        const summaries = await response.json();
        if (summaries.length === 0) {
            noRecapMessageEl.textContent =
                "Belum ada data pengeluaran untuk direkap.";
            return;
        }
        noRecapMessageEl.style.display = "none";
        summaries.forEach((summary) => {
            const itemDiv = document.createElement("div");
            itemDiv.className =
                "recap-item p-4 bg-white rounded-lg shadow-md flex flex-col sm:flex-row justify-between sm:items-center transition-all hover:shadow-lg hover:scale-[1.01]";
            itemDiv.innerHTML = `
                <span class="font-semibold text-gray-800 text-lg mb-1 sm:mb-0">${
                    summary.month_name
                } ${summary.year}</span>
                <span class="text-indigo-600 font-bold text-lg">Rp ${Number(
                    summary.total_amount
                ).toLocaleString("id-ID")}</span>`;
            recapListEl.appendChild(itemDiv);
        });
    } catch (error) {
        console.error("Fetch error for monthly recap:", error);
        noRecapMessageEl.textContent = `Terjadi kesalahan: ${error.message}`;
        noRecapMessageEl.className = "text-red-500 italic";
    }
}

// --- Inisialisasi Aplikasi ---
async function initializeApp() {
    let initialDateToSelect = MIN_DATE;
    const today = new Date();
    if (today >= MIN_DATE && today <= MAX_DATE) {
        currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
        initialDateToSelect = today;
    } else if (today < MIN_DATE) {
        currentDate = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
        initialDateToSelect = MIN_DATE;
    } else {
        currentDate = new Date(MAX_DATE.getFullYear(), MAX_DATE.getMonth(), 1);
        initialDateToSelect = MAX_DATE;
    }
    if (!currentDate) {
        // Fallback
        currentDate = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
    }

    await renderCalendar();
    await handleDateClick(initialDateToSelect); // Ini akan memanggil renderExpensesForSelectedDate dan renderIncomesForSelectedDate
    await renderMonthlyRecap();
    switchTab("pengeluaran"); // Set tab default
}
