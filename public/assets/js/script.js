const calendarGrid = document.getElementById("calendarGrid");
const currentMonthYearEl = document.getElementById("currentMonthYear");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const expenseForm = document.getElementById("expenseForm");
const expenseDescriptionInput = document.getElementById("expenseDescription");
const expenseAmountInput = document.getElementById("expenseAmount");
const expenseListEl = document.getElementById("expenseList");
const selectedDateDisplay = document.getElementById("selectedDateDisplay");
const noExpensesMessage = document.getElementById("noExpensesMessage");
const dailyTotalEl = document.getElementById("dailyTotal");
const expensesChartCanvas = document
    .getElementById("expensesChart")
    .getContext("2d");

let expensesChart;
let expensesData = [];
let currentDate = new Date(2025, 4, 21);
let selectedDate = null;

const MIN_DATE = new Date(2025, 4, 21);
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

function renderCalendar() {
    calendarGrid.innerHTML = "";
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthYearEl.textContent = `${monthNames[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayHeaders = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    dayHeaders.forEach((header) => {
        const headerEl = document.createElement("div");
        headerEl.className = "font-semibold text-stone-600 text-sm py-1";
        headerEl.textContent = header;
        calendarGrid.appendChild(headerEl);
    });

    let adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < adjustedFirstDay; i++) {
        calendarGrid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement("button");
        dayEl.textContent = day;
        dayEl.className =
            "calendar-day p-2 rounded-md aspect-square flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-sky-400";
        const dateValue = new Date(year, month, day);

        if (dateValue < MIN_DATE || dateValue > MAX_DATE) {
            dayEl.classList.add("disabled");
        } else {
            dayEl.onclick = () => handleDateClick(dateValue);
        }

        if (
            selectedDate &&
            dateValue.toDateString() === selectedDate.toDateString()
        ) {
            dayEl.classList.add("selected");
        }

        const isoDate = formatDateISO(dateValue);
        if (expensesData.some((exp) => exp.date === isoDate)) {
            dayEl.classList.add("has-expenses");
        }
        calendarGrid.appendChild(dayEl);
    }
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
    );
    const nextMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
    );

    prevMonthBtn.disabled =
        prevMonth.getFullYear() < MIN_DATE.getFullYear() ||
        (prevMonth.getFullYear() === MIN_DATE.getFullYear() &&
            prevMonth.getMonth() < MIN_DATE.getMonth());

    nextMonthBtn.disabled =
        nextMonth.getFullYear() > MAX_DATE.getFullYear() ||
        (nextMonth.getFullYear() === MAX_DATE.getFullYear() &&
            nextMonth.getMonth() > MAX_DATE.getMonth());
}

function handleDateClick(date) {
    selectedDate = date;
    selectedDateDisplay.textContent = formatDate(selectedDate);
    renderCalendar();
    renderExpensesForSelectedDate();
    expenseForm.reset();
    expenseDescriptionInput.focus();
}

function renderExpensesForSelectedDate() {
    expenseListEl.innerHTML = "";
    if (!selectedDate) {
        noExpensesMessage.style.display = "block";
        dailyTotalEl.textContent = "Rp 0";
        return;
    }

    const isoDateStr = formatDateISO(selectedDate);
    const dayExpenses = expensesData.filter((exp) => exp.date === isoDateStr);

    if (dayExpenses.length === 0) {
        noExpensesMessage.style.display = "block";
    } else {
        noExpensesMessage.style.display = "none";
        dayExpenses.forEach((exp) => {
            const li = document.createElement("li");
            li.className =
                "flex justify-between items-center p-2 bg-white rounded shadow-sm";
            li.innerHTML = `
                        <span>${exp.description}</span>
                        <div class="flex items-center">
                            <span class="mr-3 text-emerald-700 font-medium">Rp ${exp.amount.toLocaleString(
                                "id-ID"
                            )}</span>
                            <button data-id="${
                                exp.id
                            }" class="delete-expense-btn text-red-500 hover:text-red-700 text-xs p-1">Hapus</button>
                        </div>
                    `;
            expenseListEl.appendChild(li);
        });
    }

    const dailyTotal = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    dailyTotalEl.textContent = `Rp ${dailyTotal.toLocaleString("id-ID")}`;
    addDeleteEventListeners();
    renderExpensesChart();
}

function addExpense(e) {
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

    const newExpense = {
        id: Date.now().toString(),
        date: formatDateISO(selectedDate),
        description: description,
        amount: amount,
    };
    expensesData.push(newExpense);
    expenseForm.reset();
    renderExpensesForSelectedDate();
    renderCalendar();
}

function deleteExpense(expenseId) {
    expensesData = expensesData.filter((exp) => exp.id !== expenseId);
    renderExpensesForSelectedDate();
    renderCalendar();
}

function addDeleteEventListeners() {
    document.querySelectorAll(".delete-expense-btn").forEach((button) => {
        button.removeEventListener("click", handleDeleteClick);
        button.addEventListener("click", handleDeleteClick);
    });
}

function handleDeleteClick(event) {
    const expenseId = event.target.dataset.id;
    if (confirm("Apakah Anda yakin ingin menghapus pengeluaran ini?")) {
        deleteExpense(expenseId);
    }
}

function renderExpensesChart() {
    if (expensesChart) {
        expensesChart.destroy();
    }

    const currentMonthExpenses = {};
    const daysInCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
    ).getDate();

    for (let i = 1; i <= daysInCurrentMonth; i++) {
        const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            i
        );
        if (date >= MIN_DATE && date <= MAX_DATE) {
            currentMonthExpenses[i] = 0;
        }
    }

    expensesData.forEach((exp) => {
        const expenseDate = new Date(exp.date + "T00:00:00"); // Ensure correct date parsing
        if (
            expenseDate.getFullYear() === currentDate.getFullYear() &&
            expenseDate.getMonth() === currentDate.getMonth()
        ) {
            const day = expenseDate.getDate();
            if (currentMonthExpenses.hasOwnProperty(day)) {
                currentMonthExpenses[day] += exp.amount;
            }
        }
    });

    const labels = Object.keys(currentMonthExpenses).sort((a, b) => a - b);
    const data = labels.map((day) => currentMonthExpenses[day]);

    expensesChart = new Chart(expensesChartCanvas, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Total Pengeluaran Harian (Rp)",
                    data: data,
                    backgroundColor: "rgba(16, 185, 129, 0.6)", // emerald-500 with opacity
                    borderColor: "rgba(5, 150, 105, 1)", // emerald-600
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
                        callback: function (value) {
                            return "Rp " + value.toLocaleString("id-ID");
                        },
                    },
                },
                x: {
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15,
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
                    display: true,
                    position: "top",
                },
            },
        },
    });
}

prevMonthBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    renderExpensesChart();
};

nextMonthBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    renderExpensesChart();
};

expenseForm.addEventListener("submit", addExpense);

function initializeApp() {
    const today = new Date();
    if (today >= MIN_DATE && today <= MAX_DATE) {
        currentDate = new Date(today.getFullYear(), today.getMonth(), 1); // Start with the first day of current month
        handleDateClick(today); // Select today by default
    } else {
        currentDate = new Date(MIN_DATE.getFullYear(), MIN_DATE.getMonth(), 1);
        handleDateClick(MIN_DATE); // Or select MIN_DATE if today is out of range
    }
    renderCalendar();
    renderExpensesChart();
}

initializeApp();
