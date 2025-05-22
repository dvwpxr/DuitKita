<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplikasi Catatan Pengeluaran Harian</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Visualization & Content Choices:
        - Source: Daily expense entries (user input). Goal: Inform, Organize, Input. Method: Interactive calendar (HTML/CSS/JS) to select dates. Dynamic list (HTML/JS) to display expenses. Input form (HTML) for adding expenses. Interaction: Clicking dates on calendar updates expense view; submitting form adds expense to list and updates totals/chart. Justification: Provides a clear, interactive way to manage daily financial records.
        - Source: Aggregated daily expenses for the current month. Goal: Inform, Compare. Method: Bar chart (Chart.js on Canvas) showing daily totals for the selected month. Interaction: Chart updates when month changes or new expense is added/deleted for a day in the current month. Justification: Visual overview of
spending patterns within the month.
        - CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }

        .chart-container {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            height: 300px;
            max-height: 350px;
        }

        @media (min-width: 768px) {
            .chart-container {
                height: 350px;
                max-height: 400px;
            }
        }

        .calendar-day {
            transition: background-color 0.2s ease-in-out;
        }

        .calendar-day:hover:not(.selected):not(.disabled) {
            background-color: #e0f2fe;
            /* sky-100 */
        }

        .selected {
            background-color: #0284c7 !important;
            /* sky-600 */
            color: white !important;
        }

        .has-expenses {
            position: relative;
        }

        .has-expenses::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            background-color: #fb923c;
            /* orange-400 */
            border-radius: 50%;
        }

        .disabled {
            color: #9ca3af;
            /* gray-400 */
            pointer-events: none;
            background-color: #f3f4f6;
            /* gray-100 */
        }
    </style>
</head>

<body class="bg-stone-50 text-stone-800 min-h-screen flex flex-col items-center py-8 px-4">

    <div class="w-full max-w-5xl bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <header class="mb-8 text-center">
            <h1 class="text-3xl sm:text-4xl font-bold text-sky-700">Catatan Pengeluaran Harian</h1>
            <p class="text-stone-600 mt-2">Kelola dan lacak pengeluaran Anda dari Mei 2025 hingga Desember 2025.</p>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section class="lg:col-span-2">
                <div class="mb-6 p-4 bg-sky-50 rounded-lg border border-sky-200">
                    <h2 class="text-xl font-semibold text-sky-700 mb-2">Navigasi & Kalender</h2>
                    <p class="text-sm text-stone-600 mb-4">Gunakan tombol di bawah untuk mengganti bulan...</p>
                    <div class="flex items-center justify-between mb-4">
                        <button id="prevMonthBtn" class="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-150 disabled:opacity-50">‹ Sebelumnya</button>
                        <h3 id="currentMonthYear" class="text-xl font-semibold text-sky-700"></h3>
                        <button id="nextMonthBtn" class="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition duration-150 disabled:opacity-50">Berikutnya ›</button>
                    </div>
                    <div id="calendarGrid" class="grid grid-cols-7 gap-1 text-center"></div>
                </div>
                <div class="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h2 class="text-xl font-semibold text-amber-700 mb-2">Ringkasan Pengeluaran Bulanan</h2>
                    <p class="text-sm text-stone-600 mb-4">Grafik ini menampilkan total pengeluaran harian...</p>
                    <div class="chart-container">
                        <canvas id="expensesChart"></canvas>
                    </div>
                </div>
            </section>

            <aside class="lg:col-span-1">
                <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h2 class="text-xl font-semibold text-emerald-700 mb-1">Pengeluaran untuk:</h2>
                    <p id="selectedDateDisplay" class="text-lg font-medium text-emerald-600 mb-3">Pilih tanggal dari kalender</p>
                    <div class="mb-4">
                        <p class="text-sm text-stone-600 mb-4">Setelah memilih tanggal pada kalender...</p>
                    </div>
                    <form id="expenseForm" class="space-y-4">
                        @csrf
                        <div>
                            <label for="expenseDescription" class="block text-sm font-medium text-stone-700">Deskripsi</label>
                            <input type="text" id="expenseDescription" name="expenseDescription" required class="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="Contoh: Makan siang">
                        </div>
                        <div>
                            <label for="expenseAmount" class="block text-sm font-medium text-stone-700">Jumlah (Rp)</label>
                            <input type="number" id="expenseAmount" name="expenseAmount" required class="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="Contoh: 25000">
                        </div>
                        <button type="submit" class="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition duration-150">Tambah Pengeluaran</button>
                    </form>
                    <div class="mt-6">
                        <h3 class="text-lg font-semibold text-stone-700">Daftar Pengeluaran:</h3>
                        <ul id="expenseList" class="mt-2 space-y-2 text-sm">
                            <li id="noExpensesMessage" class="text-stone-500">Belum ada pengeluaran untuk tanggal ini.</li>
                        </ul>
                        <div class="mt-4 pt-2 border-t border-stone-300">
                            <p class="text-md font-semibold text-stone-800">Total Hari Ini: <span id="dailyTotal" class="text-emerald-600">Rp 0</span></p>
                        </div>
                    </div>
                </div>
            </aside>
        </main>
    </div>

    <script>
        const API_BASE_URL = "{{ url('/api') }}";

        let calendarGrid, currentMonthYearEl, prevMonthBtn, nextMonthBtn,
            expenseForm, expenseDescriptionInput, expenseAmountInput,
            expenseListEl, selectedDateDisplay, noExpensesMessage, dailyTotalEl,
            expensesChartCanvasCtx;

        let expensesChart;
        let currentDate;
        let selectedDate = null;

        const MIN_DATE = new Date(2025, 4, 21);
        const MAX_DATE = new Date(2025, 11, 31);
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        document.addEventListener('DOMContentLoaded', function() {
            calendarGrid = document.getElementById('calendarGrid');
            currentMonthYearEl = document.getElementById('currentMonthYear');
            prevMonthBtn = document.getElementById('prevMonthBtn');
            nextMonthBtn = document.getElementById('nextMonthBtn');
            expenseForm = document.getElementById('expenseForm');
            expenseDescriptionInput = document.getElementById('expenseDescription');
            expenseAmountInput = document.getElementById('expenseAmount');
            expenseListEl = document.getElementById('expenseList');
            selectedDateDisplay = document.getElementById('selectedDateDisplay');
            noExpensesMessage = document.getElementById('noExpensesMessage');
            dailyTotalEl = document.getElementById('dailyTotal');

            const canvasElement = document.getElementById('expensesChart');
            if (canvasElement) {
                expensesChartCanvasCtx = canvasElement.getContext('2d');
            } else {
                console.error("Elemen canvas 'expensesChart' tidak ditemukan saat DOMContentLoaded.");
            }

            if (expenseForm) expenseForm.addEventListener('submit', addExpense);
            if (prevMonthBtn) prevMonthBtn.onclick = async () => {
                if (!currentDate) return;
                currentDate.setMonth(currentDate.getMonth() - 1);
                await renderCalendar();
                await renderExpensesChart();
            };
            if (nextMonthBtn) nextMonthBtn.onclick = async () => {
                if (!currentDate) return;
                currentDate.setMonth(currentDate.getMonth() + 1);
                await renderCalendar();
                await renderExpensesChart();
            };

            initializeApp();
        });

        function formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        }

        function formatDateISO(date) {
            if (!date) return null;
            const d = new Date(date);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        async function fetchExpensesForDate(isoDate) {
            try {
                const response = await fetch(`${API_BASE_URL}/expenses?date=${isoDate}`);
                if (!response.ok) {
                    console.error("API Error (fetchExpensesForDate):", response.status, await response.text().catch(() => ""));
                    return [];
                }
                return await response.json();
            } catch (error) {
                console.error('Fetch error for date (fetchExpensesForDate):', error);
                return [];
            }
        }

        async function fetchExpensesForMonth(year, monthZeroIndexed) {
            try {
                const response = await fetch(`${API_BASE_URL}/expenses`);
                if (!response.ok) {
                    console.error("API Error (fetchExpensesForMonth):", response.status, await response.text().catch(() => ""));
                    return [];
                }
                const allExpenses = await response.json();

                const filteredExpenses = allExpenses.filter(exp => {
                    if (!exp.date) return false;
                    const expDate = new Date(exp.date); // Menggunakan exp.date langsung

                    // console.log(
                    //     `Memfilter item: API Date='${exp.date}', Parsed Date=${expDate.toISOString()}, ` +
                    //     `Item Year=${expDate.getUTCFullYear()} vs Target Year=${year}, ` +
                    //     `Item Month=${expDate.getUTCMonth()} vs Target Month=${monthZeroIndexed}`
                    // );
                    return expDate.getUTCFullYear() === year && expDate.getUTCMonth() === monthZeroIndexed;
                });
                return filteredExpenses;
            } catch (error) {
                console.error('Fetch error for month (fetchExpensesForMonth):', error);
                return [];
            }
        }


        async function renderCalendar() {
            if (!calendarGrid || !currentMonthYearEl || !currentDate) {
                console.warn("Elemen kalender atau currentDate tidak siap untuk renderCalendar");
                return;
            }
            calendarGrid.innerHTML = '';
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            dayHeaders.forEach(header => {
                const headerEl = document.createElement('div');
                headerEl.className = 'font-semibold text-stone-600 text-sm py-1';
                headerEl.textContent = header;
                calendarGrid.appendChild(headerEl);
            });

            let adjustedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
            for (let i = 0; i < adjustedFirstDay; i++) calendarGrid.appendChild(document.createElement('div'));

            const expensesInCurrentMonth = await fetchExpensesForMonth(year, month);
            for (let day = 1; day <= daysInMonth; day++) {
                const dayEl = document.createElement('button');
                dayEl.textContent = day;
                dayEl.className = 'calendar-day p-2 rounded-md aspect-square flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-sky-400';
                const dateValue = new Date(year, month, day);

                if (dateValue < MIN_DATE || dateValue > MAX_DATE) {
                    dayEl.classList.add('disabled');
                } else {
                    dayEl.onclick = () => handleDateClick(dateValue);
                }
                if (selectedDate && dateValue.toDateString() === selectedDate.toDateString()) dayEl.classList.add('selected');
                if (expensesInCurrentMonth.some(exp => exp.date === formatDateISO(dateValue))) dayEl.classList.add('has-expenses');
                calendarGrid.appendChild(dayEl);
            }
            updateNavigationButtons();
        }

        function updateNavigationButtons() {
            if (!prevMonthBtn || !nextMonthBtn || !currentDate) return;
            const prevMonthTest = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            const nextMonthTest = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            prevMonthBtn.disabled = prevMonthTest.getFullYear() < MIN_DATE.getFullYear() || (prevMonthTest.getFullYear() === MIN_DATE.getFullYear() && prevMonthTest.getMonth() < MIN_DATE.getMonth());
            nextMonthBtn.disabled = nextMonthTest.getFullYear() > MAX_DATE.getFullYear() || (nextMonthTest.getFullYear() === MAX_DATE.getFullYear() && nextMonthTest.getMonth() > MAX_DATE.getMonth());
        }

        async function handleDateClick(date) {
            selectedDate = date;
            if (selectedDateDisplay) selectedDateDisplay.textContent = formatDate(selectedDate);
            await renderCalendar();
            await renderExpensesForSelectedDate();
            if (expenseForm) expenseForm.reset();
            if (expenseDescriptionInput) expenseDescriptionInput.focus();
        }

        async function renderExpensesForSelectedDate() {
            if (!expenseListEl || !noExpensesMessage || !dailyTotalEl) return;
            expenseListEl.innerHTML = '';
            if (!selectedDate) {
                noExpensesMessage.style.display = 'block';
                dailyTotalEl.textContent = 'Rp 0';
                if (expensesChart) {
                    expensesChart.destroy();
                    expensesChart = null;
                }
                return;
            }
            const isoDateStr = formatDateISO(selectedDate);
            const dayExpenses = await fetchExpensesForDate(isoDateStr);
            if (dayExpenses.length === 0) {
                noExpensesMessage.style.display = 'block';
            } else {
                noExpensesMessage.style.display = 'none';
                dayExpenses.forEach(exp => {
                    const li = document.createElement('li');
                    li.className = 'flex justify-between items-center p-2 bg-white rounded shadow-sm';
                    li.innerHTML = `<span>${exp.description}</span><div class="flex items-center"><span class="mr-3 text-emerald-700 font-medium">Rp ${Number(exp.amount).toLocaleString('id-ID')}</span><button data-id="${exp.id}" class="delete-expense-btn text-red-500 hover:text-red-700 text-xs p-1">Hapus</button></div>`;
                    expenseListEl.appendChild(li);
                });
            }
            dailyTotalEl.textContent = `Rp ${dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString('id-ID')}`;
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
            const amount = parseFloat(expenseAmountInput.value);
            if (!description || isNaN(amount) || amount <= 0) {
                alert("Deskripsi dan jumlah pengeluaran harus valid.");
                return;
            }
            const newExpenseData = {
                date: formatDateISO(selectedDate),
                description,
                amount
            };
            try {
                const response = await fetch(`${API_BASE_URL}/expenses`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(newExpenseData)
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({
                        message: "Gagal menyimpan data."
                    }));
                    throw new Error(errorData.message || `Server error: ${response.status}`);
                }
                if (expenseForm) expenseForm.reset();
                await renderExpensesForSelectedDate();
                await renderCalendar();
            } catch (error) {
                console.error('Error adding expense (addExpense):', error);
                alert(`Gagal menambahkan pengeluaran: ${error.message}`);
            }
        }

        async function deleteExpenseAPI(expenseId) {
            try {
                const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                if (!response.ok && response.status !== 204) {
                    const errorData = await response.json().catch(() => ({
                        message: "Gagal menghapus data."
                    }));
                    throw new Error(errorData.message || `Server error: ${response.status}`);
                }
                await renderExpensesForSelectedDate();
                await renderCalendar();
            } catch (error) {
                console.error('Error deleting expense (deleteExpenseAPI):', error);
                alert(`Gagal menghapus pengeluaran: ${error.message}`);
            }
        }

        function addDeleteEventListeners() {
            document.querySelectorAll('.delete-expense-btn').forEach(button => {
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                newButton.addEventListener('click', async (event) => {
                    const expenseId = event.target.dataset.id;
                    if (confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
                        await deleteExpenseAPI(expenseId);
                    }
                });
            });
        }

        // Fungsi renderExpensesChart yang Anda berikan:
        async function renderExpensesChart() {
            if (!expensesChartCanvasCtx) {
                console.warn("Canvas context untuk chart belum siap. Mencoba mengambil ulang.");
                const canvasElement = document.getElementById('expensesChart');
                if (canvasElement) expensesChartCanvasCtx = canvasElement.getContext('2d');
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
                console.warn("currentDate belum diinisialisasi untuk renderExpensesChart");
                return;
            }
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const expensesInCurrentMonth = await fetchExpensesForMonth(year, month);
            // Log data yang diterima untuk chart


            const dailyTotals = {};
            const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 1; i <= daysInCurrentMonth; i++) {
                // Hanya inisialisasi hari yang valid dalam rentang MIN_DATE dan MAX_DATE
                const currentDayDate = new Date(year, month, i);
                if (currentDayDate >= MIN_DATE && currentDayDate <= MAX_DATE) {
                    dailyTotals[i] = 0;
                }
            }

            expensesInCurrentMonth.forEach(exp => {
                if (!exp.date) return;
                const expDate = new Date(exp.date); // Gunakan exp.date langsung
                const day = expDate.getUTCDate(); // Gunakan getUTCDate jika tanggal dari DB adalah UTC
                if (dailyTotals.hasOwnProperty(day)) { // Pastikan hari ada di dailyTotals (sudah difilter MIN/MAX)
                    dailyTotals[day] += Number(exp.amount);
                }
            });

            const labels = Object.keys(dailyTotals).sort((a, b) => parseInt(a) - parseInt(b));
            const data = labels.map(day => dailyTotals[day]); // 'data' ini adalah variabel lokal


            const chartElementContainer = document.querySelector('.chart-container');

            if (labels.length === 0 || data.every(val => val === 0)) { // Jika tidak ada label atau semua data nol
                console.log("Tidak ada data yang signifikan untuk ditampilkan di chart.");
                if (chartElementContainer) chartElementContainer.style.display = 'none';
                if (expensesChart) {
                    expensesChart.destroy();
                    expensesChart = null;
                }
                return;
            }
            if (chartElementContainer) chartElementContainer.style.display = 'block';

            // Hancurkan instance chart lama jika ada sebelum membuat yang baru
            if (expensesChart) {
                expensesChart.destroy();
                expensesChart = null;
            }

            expensesChart = new Chart(expensesChartCanvasCtx, {
                type: 'bar',
                data: {
                    labels: labels, // Menggunakan variabel labels lokal
                    datasets: [{
                        label: 'Total Pengeluaran Harian (Rp)',
                        data: data, // Menggunakan variabel data lokal
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: 'rgba(5, 150, 105, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => 'Rp ' + value.toLocaleString('id-ID')
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 0,
                                minRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 15
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: context => (context.dataset.label || '') + ': Rp ' + context.parsed.y.toLocaleString('id-ID')
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
        }

        async function initializeApp() {
            const today = new Date();
            let initialDateToSelect = MIN_DATE;
            if (today >= MIN_DATE && today <= MAX_DATE) {
                currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
                initialDateToSelect = today;
            } else {
                currentDate = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
            }
            if (!currentDate) {
                currentDate = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
                console.warn("currentDate diinisialisasi ke MIN_DATE karena kondisi awal tidak terpenuhi.");
            }

            await renderCalendar();
            await handleDateClick(initialDateToSelect);
        }
    </script>
</body>

</html>