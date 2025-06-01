let calendarGrid,
    currentMonthYearEl,
    prevMonthBtn,
    nextMonthBtn,
    expenseForm,
    expenseDescriptionInput,
    expenseAmountInput,
    expenseListEl,
    selectedDateDisplay,
    noExpensesMessage,
    dailyTotalEl,
    expensesChartCanvasCtx;

let expensesChart;
let currentDate;
let selectedDate = null;

const MIN_DATE = new Date(2025, 4, 1); // Anggap Mei dimulai dari tanggal 1
const MAX_DATE = new Date(2025, 11, 31);
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

// Fungsi untuk memformat angka ke format ribuan Indonesia
function formatNumberInput(value) {
    if (!value) return "";
    // Hapus semua karakter non-digit kecuali jika itu adalah input awal yang kosong
    let numStr = String(value).replace(/[^\d]/g, "");
    if (numStr === "") return "";
    return parseInt(numStr, 10).toLocaleString("id-ID");
}

// Fungsi untuk mendapatkan nilai angka murni dari input yang terformat
function getUnformattedNumber(formattedValue) {
    if (!formattedValue) return 0;
    return parseInt(String(formattedValue).replace(/\./g, ""), 10) || 0;
}

document.addEventListener("DOMContentLoaded", function () {
    calendarGrid = document.getElementById("calendarGrid");
    currentMonthYearEl = document.getElementById("currentMonthYear");
    prevMonthBtn = document.getElementById("prevMonthBtn");
    nextMonthBtn = document.getElementById("nextMonthBtn");
    expenseForm = document.getElementById("expenseForm");
    expenseDescriptionInput = document.getElementById("expenseDescription");
    expenseAmountInput = document.getElementById("expenseAmount");
    expenseListEl = document.getElementById("expenseList");
    selectedDateDisplay = document.getElementById("selectedDateDisplay");
    noExpensesMessage = document.getElementById("noExpensesMessage");
    dailyTotalEl = document.getElementById("dailyTotal");

    const canvasElement = document.getElementById("expensesChart");
    if (canvasElement) {
        expensesChartCanvasCtx = canvasElement.getContext("2d");
    } else {
        console.error(
            "Elemen canvas 'expensesChart' tidak ditemukan saat DOMContentLoaded."
        );
    }

    if (expenseForm) expenseForm.addEventListener("submit", addExpense);
    if (prevMonthBtn)
        prevMonthBtn.onclick = async () => {
            if (!currentDate) return;
            currentDate.setMonth(currentDate.getMonth() - 1);
            await renderCalendar();
            await renderExpensesChart();
        };
    if (nextMonthBtn)
        nextMonthBtn.onclick = async () => {
            if (!currentDate) return;
            currentDate.setMonth(currentDate.getMonth() + 1);
            await renderCalendar();
            await renderExpensesChart();
        };

    // Event listener untuk formatting input jumlah
    if (expenseAmountInput) {
        expenseAmountInput.addEventListener("input", function (e) {
            const originalValue = e.target.value;
            const formattedValue = formatNumberInput(originalValue);
            // Untuk menjaga posisi kursor, ini bisa jadi rumit.
            // Untuk simplisitas, kita set value saja.
            // Jika string berubah, browser biasanya meletakkan kursor di akhir.
            if (originalValue !== formattedValue) {
                e.target.value = formattedValue;
            }
        });
        // Mencegah input non-numerik jika diperlukan (selain yang sudah dihandle formatNumberInput)
        expenseAmountInput.addEventListener("keypress", function (e) {
            if (
                e.key.length === 1 &&
                (e.key < "0" || e.key > "9") &&
                e.key !== "." &&
                e.key !== ","
            ) {
                e.preventDefault();
            }
        });
    }

    initializeApp();
});

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateISO(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0"); // Bulan (1-12)
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
}

async function fetchExpensesForDate(isoDate) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/expenses?date=${isoDate}`
        );
        if (!response.ok) {
            console.error(
                "API Error (fetchExpensesForDate):",
                response.status,
                await response.text().catch(() => "")
            );
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch error for date (fetchExpensesForDate):", error);
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
                await response.text().catch(() => "")
            );
            return [];
        }
        const allExpenses = await response.json();

        const filteredExpenses = allExpenses.filter((exp) => {
            if (!exp.date) return false;
            const expDate = new Date(exp.date);

            return (
                expDate.getUTCFullYear() === year &&
                expDate.getUTCMonth() === monthZeroIndexed
            );
        });
        return filteredExpenses;
    } catch (error) {
        console.error("Fetch error for month (fetchExpensesForMonth):", error);
        return [];
    }
}

async function renderCalendar() {
    if (!calendarGrid || !currentMonthYearEl || !currentDate) {
        console.warn(
            "Elemen kalender atau currentDate tidak siap untuk renderCalendar"
        );
        return;
    }
    calendarGrid.innerHTML = ""; // Kosongkan grid kalender
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0 untuk Januari, 11 untuk Desember

    currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Dapatkan hari pertama dalam seminggu untuk bulan ini (0=Minggu, 1=Senin, ..., 6=Sabtu)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Buat header hari (Min, Sen, Sel, dst.)
    const dayHeaders = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    dayHeaders.forEach((header) => {
        const headerEl = document.createElement("div");
        headerEl.className = "font-semibold text-stone-600 text-sm py-1"; // Sesuaikan style jika perlu
        headerEl.textContent = header;
        calendarGrid.appendChild(headerEl);
    });

    // Buat sel kosong untuk hari-hari sebelum tanggal 1 di bulan ini
    // Karena dayHeaders[0] adalah 'Min' (Minggu), dan getDay() mengembalikan 0 untuk Minggu,
    // maka firstDayOfMonth sudah benar menunjukkan jumlah sel kosong yang dibutuhkan.
    for (let i = 0; i < firstDayOfMonth; i++) {
        // PERBAIKAN DI SINI: Gunakan firstDayOfMonth langsung
        const emptyCell = document.createElement("div");
        calendarGrid.appendChild(emptyCell);
    }

    // Ambil data pengeluaran untuk menandai hari yang memiliki pengeluaran
    const expensesInCurrentMonth = await fetchExpensesForMonth(year, month);

    // Dapatkan tanggal hari ini (tanpa komponen waktu) untuk highlight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buat sel untuk setiap hari di bulan ini
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement("button");
        dayEl.textContent = day;
        dayEl.className =
            "calendar-day p-2 rounded-md aspect-square flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"; // Sesuaikan style jika perlu
        const dateValue = new Date(year, month, day);
        dateValue.setHours(0, 0, 0, 0); // Normalisasi untuk perbandingan dengan 'today'

        // Cek apakah ini adalah hari ini
        if (dateValue.getTime() === today.getTime()) {
            dayEl.classList.add("today-highlight"); // Kelas untuk highlight hari ini
        }

        // Nonaktifkan hari di luar rentang MIN_DATE dan MAX_DATE
        if (dateValue < MIN_DATE || dateValue > MAX_DATE) {
            dayEl.classList.add("disabled");
            if (dateValue.getTime() === today.getTime()) {
                dayEl.classList.remove("today-highlight"); // Hapus highlight jika hari ini disableda
            }
        } else {
            dayEl.onclick = () => handleDateClick(dateValue);
        }

        // Tandai hari yang dipilih
        if (
            selectedDate &&
            dateValue.toDateString() === selectedDate.toDateString()
        ) {
            dayEl.classList.add("selected");
        }

        // Tandai hari yang memiliki pengeluaran
        if (expensesInCurrentMonth && expensesInCurrentMonth.length > 0) {
            // Pastikan ada data untuk diperiksa
            if (
                expensesInCurrentMonth.some((exp) => {
                    if (!exp.date) return false;
                    // exp.date dari API Anda adalah string format YYYY-MM-DDTHH:mm:ss.sssZ
                    // kita hanya butuh bagian YYYY-MM-DD untuk perbandingan
                    const expenseDateOnly = exp.date.substring(0, 10);
                    const calendarDateISO = formatDateISO(dateValue); // Fungsi ini menghasilkan YYYY-MM-DD

                    // DEBUG: Untuk melihat perbandingan tanggal
                    // if (day === 1) { // Contoh log untuk tanggal 1 saja agar tidak terlalu banyak
                    //     console.log(`Comparing for day ${day}: API date part = ${expenseDateOnly}, Calendar date ISO = ${calendarDateISO}`);
                    // }

                    return expenseDateOnly === calendarDateISO;
                })
            ) {
                dayEl.classList.add("has-expenses");
            }
        }
        calendarGrid.appendChild(dayEl);
    }
    updateNavigationButtons();
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
    selectedDate = date;
    if (selectedDateDisplay)
        selectedDateDisplay.textContent = formatDate(selectedDate);
    await renderCalendar();
    await renderExpensesForSelectedDate();
    if (expenseForm) expenseForm.reset();
    if (expenseAmountInput) expenseAmountInput.value = ""; // Reset field jumlah juga
    if (expenseDescriptionInput) expenseDescriptionInput.focus();
}

async function renderExpensesForSelectedDate() {
    if (!expenseListEl || !noExpensesMessage || !dailyTotalEl) return;
    expenseListEl.innerHTML = "";
    if (!selectedDate) {
        noExpensesMessage.style.display = "block";
        dailyTotalEl.textContent = "Rp 0";
        if (expensesChart) {
            expensesChart.destroy();
            expensesChart = null;
        }
        return;
    }
    const isoDateStr = formatDateISO(selectedDate);
    const dayExpenses = await fetchExpensesForDate(isoDateStr);
    if (dayExpenses.length === 0) {
        noExpensesMessage.style.display = "block";
    } else {
        noExpensesMessage.style.display = "none";
        dayExpenses.forEach((exp) => {
            const li = document.createElement("li");
            li.className =
                "flex justify-between items-center p-2 bg-white rounded shadow-sm";
            li.innerHTML = `<span>${
                exp.description
            }</span><div class="flex items-center"><span class="mr-3 text-semi-bold text-green-600 font-medium">Rp ${Number(
                exp.amount
            ).toLocaleString("id-ID")}</span><button data-id="${
                exp.id
            }" class="delete-expense-btn text-red-500 hover:text-red-700 text-xs p-1">Hapus</button></div>`;
            expenseListEl.appendChild(li);
        });
    }
    dailyTotalEl.textContent = `Rp ${dayExpenses
        .reduce((sum, exp) => sum + Number(exp.amount), 0)
        .toLocaleString("id-ID")}`;
    addDeleteEventListeners();
    await renderExpensesChart();
}

async function addExpense(e) {
    e.preventDefault();

    if (!selectedDate) {
        alert("Silakan pilih tanggal terlebih dahulu.");

        return;
    }

    const description = expenseDescriptionInput.value.trim();

    // Dapatkan nilai angka murni dari input yang diformat

    const amount = getUnformattedNumber(expenseAmountInput.value);

    if (!description || isNaN(amount) || amount <= 0) {
        alert(
            "Deskripsi dan jumlah pengeluaran harus valid. Jumlah harus lebih besar dari 0."
        );

        return;
    }

    const newExpenseData = {
        date: formatDateISO(selectedDate),

        description,

        amount,
    };

    try {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content"); // Ambil token
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": document
                    .querySelector('meta[name="csrf-token"]')
                    .getAttribute("content"),
            },

            body: JSON.stringify(newExpenseData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: "Gagal menyimpan data.",
            }));

            throw new Error(
                errorData.message || `Server error: ${response.status}`
            );
        }

        if (expenseForm) expenseForm.reset();

        if (expenseAmountInput) expenseAmountInput.value = ""; // Kosongkan field jumlah setelah submit

        await renderExpensesForSelectedDate();

        await renderCalendar(); // Untuk update dot 'has-expenses'
        await renderMonthlyRecap(); // UPDATE REKAPAN
    } catch (error) {
        console.error("Error adding expense (addExpense):", error);

        alert(`Gagal menambahkan pengeluaran: ${error.message}`);
    }
}

async function deleteExpenseAPI(expenseId) {
    // expenseId adalah nilai, bukan string "{expenseId}"
    try {
        // Pastikan Anda menggunakan backtick (`) untuk template literal
        // dan ${API_BASE_URL} serta ${expenseId} untuk menyisipkan nilai variabel.
        const response = await fetch(
            `${API_BASE_URL}/expenses` + `/${expenseId}`,
            {
                // PERHATIKAN BAGIAN INI
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": document
                        .querySelector('meta[name="csrf-token"]')
                        .getAttribute("content"),
                },
            }
        );

        if (!response.ok && response.status !== 204) {
            // 204 No Content juga OK
            const errorData = await response.json().catch(() => ({
                message:
                    "Gagal menghapus data atau respons server tidak valid.",
            }));
            // Tampilkan pesan error ke pengguna (misalnya via alert atau notifikasi UI yang lebih baik)
            alert(
                `Gagal menghapus pengeluaran: ${
                    errorData.message || `Status ${response.status}`
                }`
            );
            throw new Error(
                errorData.message || `Server error: ${response.status}`
            );
        }
        // Jika berhasil
        await renderExpensesForSelectedDate(); // Muat ulang daftar pengeluaran untuk tanggal yang dipilih
        await renderCalendar(); // Muat ulang kalender untuk update dot 'has-expenses'
        await renderMonthlyRecap(); // UPDATE REKAPAN
    } catch (error) {
        console.error("Error deleting expense (deleteExpenseAPI):", error);
        // Anda mungkin ingin menampilkan pesan error ini ke pengguna juga jika belum ditangani di atas
        if (!alertShown) {
            // Hindari alert ganda jika sudah ditangani di atas
            alert(`Terjadi kesalahan saat menghapus: ${error.message}`);
        }
    }
}

function addDeleteEventListeners() {
    document.querySelectorAll(".delete-expense-btn").forEach((button) => {
        const newButton = button.cloneNode(true); // Clone untuk menghindari multiple listeners
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener("click", async (event) => {
            const expenseId = event.target.dataset.id;
            if (confirm("Apakah Anda yakin ingin menghapus pengeluaran ini?")) {
                await deleteExpenseAPI(expenseId);
            }
        });
    });
}
async function renderMonthlyRecap() {
    const recapListEl = document.getElementById("monthlyRecapList");
    const noRecapMessageEl = document.getElementById("noMonthlyRecapMessage");

    if (!recapListEl || !noRecapMessageEl) {
        console.error("Elemen untuk rekapan bulanan tidak ditemukan.");
        return;
    }

    // Tampilkan pesan memuat sementara
    noRecapMessageEl.textContent = "Memuat data rekapan...";
    noRecapMessageEl.style.display = "block";
    // Kosongkan daftar yang mungkin sudah ada
    recapListEl
        .querySelectorAll(".recap-item")
        .forEach((item) => item.remove());

    try {
        const response = await fetch(
            `${API_BASE_URL}/expenses/monthly-summary`
        ); // Panggil endpoint baru
        if (!response.ok) {
            const errorText = await response
                .text()
                .catch(() => "Tidak bisa mengambil detail error");
            console.error(
                "API Error (renderMonthlyRecap):",
                response.status,
                errorText
            );
            noRecapMessageEl.textContent =
                "Gagal memuat rekapan. Coba refresh halaman.";
            noRecapMessageEl.className = "text-red-500 italic"; // Ubah style pesan error
            return;
        }
        const summaries = await response.json();

        if (summaries.length === 0) {
            noRecapMessageEl.textContent =
                "Belum ada data pengeluaran untuk direkap.";
            noRecapMessageEl.className = "text-gray-500 italic"; // Kembalikan style normal
            return;
        }

        noRecapMessageEl.style.display = "none"; // Sembunyikan pesan jika ada data

        summaries.forEach((summary) => {
            const itemDiv = document.createElement("div");
            // Tambahkan kelas 'recap-item' untuk memudahkan menghapus item lama
            itemDiv.className =
                "recap-item p-4 bg-white rounded-lg shadow-md flex flex-col sm:flex-row justify-between sm:items-center transition-all hover:shadow-lg hover:scale-[1.01]";

            const monthYearSpan = document.createElement("span");
            monthYearSpan.className =
                "font-semibold text-gray-800 text-lg mb-1 sm:mb-0";
            monthYearSpan.textContent = `${summary.month_name} ${summary.year}`;

            const amountSpan = document.createElement("span");
            amountSpan.className = "text-indigo-600 font-bold text-lg";
            amountSpan.textContent = `Rp ${Number(
                summary.total_amount
            ).toLocaleString("id-ID")}`;

            itemDiv.appendChild(monthYearSpan);
            itemDiv.appendChild(amountSpan);
            recapListEl.appendChild(itemDiv);
        });
    } catch (error) {
        console.error("Fetch error for monthly recap:", error);
        noRecapMessageEl.textContent = "Terjadi kesalahan saat memuat rekapan.";
        noRecapMessageEl.className = "text-red-500 italic";
    }
}

async function renderExpensesChart() {
    if (!expensesChartCanvasCtx) {
        console.warn(
            "Canvas context untuk chart belum siap. Mencoba mengambil ulang."
        );
        const canvasElement = document.getElementById("expensesChart");
        if (canvasElement)
            expensesChartCanvasCtx = canvasElement.getContext("2d");
        else {
            console.error("Elemen canvas tidak ditemukan untuk chart.");
            return;
        }
    }

    if (!currentDate) {
        console.warn(
            "currentDate belum diinisialisasi untuk renderExpensesChart"
        );
        // Mungkin tampilkan chart kosong atau pesan
        if (expensesChart) {
            expensesChart.destroy();
            expensesChart = null;
        }
        const chartElementContainer =
            document.querySelector(".chart-container");
        if (chartElementContainer) chartElementContainer.style.display = "none";
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const expensesInCurrentMonth = await fetchExpensesForMonth(year, month);

    const dailyTotals = {};
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInCurrentMonth; i++) {
        const currentDayDate = new Date(year, month, i);
        // Pastikan hari berada dalam rentang MIN_DATE dan MAX_DATE sebelum diinisialisasi
        if (currentDayDate >= MIN_DATE && currentDayDate <= MAX_DATE) {
            dailyTotals[i] = 0;
        }
    }

    expensesInCurrentMonth.forEach((exp) => {
        if (!exp.date) return;
        const expDate = new Date(exp.date);
        const day = expDate.getUTCDate();
        if (dailyTotals.hasOwnProperty(day)) {
            dailyTotals[day] += Number(exp.amount);
        }
    });

    // Hanya ambil label dan data untuk hari-hari yang ada di dailyTotals (sudah difilter MIN/MAX)
    const labels = Object.keys(dailyTotals)
        .map((day) => String(day))
        .sort((a, b) => parseInt(a) - parseInt(b));
    const data = labels.map((day) => dailyTotals[parseInt(day)]);

    const chartElementContainer = document.querySelector(".chart-container");

    if (expensesChart) {
        // Selalu hancurkan chart lama jika ada
        expensesChart.destroy();
        expensesChart = null;
    }

    if (labels.length === 0 || data.every((val) => val === 0)) {
        console.log(
            "Tidak ada data yang signifikan untuk ditampilkan di chart bulan ini."
        );
        if (chartElementContainer) chartElementContainer.style.display = "none";
        return;
    }

    if (chartElementContainer) chartElementContainer.style.display = "block";

    expensesChart = new Chart(expensesChartCanvasCtx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Total Pengeluaran Harian (Rp)",
                    data: data,
                    backgroundColor: "rgba(16, 185, 129, 0.6)",
                    borderColor: "rgba(5, 150, 105, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) =>
                            "Rp " + value.toLocaleString("id-ID"),
                    },
                },
                x: {
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15, // Batasi jumlah tick pada sumbu X agar tidak terlalu padat
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) =>
                            (context.dataset.label || "") +
                            ": Rp " +
                            context.parsed.y.toLocaleString("id-ID"),
                    },
                },
                legend: {
                    display: true,
                    position: "top",
                },
            },
        },
    });
}

async function initializeApp() {
    const today = new Date();
    let initialDateToSelect = MIN_DATE; // Default ke MIN_DATE

    // Tentukan bulan saat ini untuk kalender
    if (today >= MIN_DATE && today <= MAX_DATE) {
        currentDate = new Date(today.getFullYear(), today.getMonth(), 1); // Bulan ini
        initialDateToSelect = today; // Pilih tanggal hari ini
    } else if (today < MIN_DATE) {
        currentDate = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1); // Bulan dari MIN_DATE
        initialDateToSelect = MIN_DATE; // Pilih MIN_DATE
    } else {
        // today > MAX_DATE
        currentDate = new Date(MAX_DATE.getFullYear(), MAX_DATE.getMonth(), 1); // Bulan dari MAX_DATE
        initialDateToSelect = MAX_DATE; // Pilih MAX_DATE (atau hari terakhir di bulan MAX_DATE)
    }

    if (!currentDate) {
        // Fallback jika ada kondisi aneh
        currentDate = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
        console.warn(
            "currentDate diinisialisasi ke MIN_DATE karena kondisi awal tidak terpenuhi."
        );
    }

    await renderCalendar(); // Render kalender untuk bulan yang sudah ditentukan
    await handleDateClick(initialDateToSelect); // Pilih tanggal dan render pengeluaran serta chart
    await renderMonthlyRecap(); // PANGGIL FUNGSI REKAPAN DI SINI
}
