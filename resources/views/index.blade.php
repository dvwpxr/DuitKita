<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Catatan Pengeluaran Kita</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" defer></script>
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Pacifico&display=swap" rel="stylesheet">

</head>


<body class="bg-rose-50 text-gray-700 min-h-screen flex flex-col items-center py-8 px-4 selection:bg-rose-300 selection:text-rose-800">

    {{-- Wadah utama dengan bayangan yang lebih lembut dan padding lebih besar --}}
    <div class="w-full max-w-5xl bg-white p-8 sm:p-10 rounded-2xl shadow-lg">
        {{-- Header Pengguna dengan sentuhan lebih manis --}}
        {{-- Header Pengguna --}}
        <div class="w-full max-w-5xl mx-auto mb-6 p-4 bg-rose-100 rounded-xl border border-rose-200
            flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
            {{-- Bagian Kiri: Informasi Pengguna Aktif --}}
            <div class="flex items-center justify-center sm:justify-start">
                {{-- Tampilkan foto profil jika ada, jika tidak, tampilkan inisial --}}
                @if (Session::has('active_user_pic') && Session::get('active_user_pic') != '')
                <img src="{{ Session::get('active_user_pic') }}" alt="{{ Session::get('active_user_name') }}"
                    class="w-12 h-12 rounded-full mr-3 shadow object-cover border-2 border-white">
                @else
                <div class="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center text-xl font-semibold mr-3 shadow border-2 border-white">
                    {{ strtoupper(substr(Session::get('active_user_name', 'U'), 0, 1)) }}
                </div>
                @endif
                <div>
                    <span class="text-sm text-rose-600">Pengeluaran Milik:</span>
                    <strong class="block text-lg text-rose-700 font-medium">{{ Session::get('active_user_name', 'Belum Dipilih') }}</strong>
                </div>
            </div>

            {{-- Bagian Kanan: Pilihan Ganti Pengguna (Responsif) --}}
            <div class="text-center sm:text-right">
                <span class="text-sm text-rose-600 block mb-2 sm:mb-1">Ganti Pengguna:</span>
                <div class="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 justify-center sm:justify-end">
                    <a href="{{ route('setActiveUser', ['userName' => 'Dava']) }}"
                        class="w-full sm:w-auto px-4 py-2 text-sm rounded-lg transition-all duration-150 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-opacity-50 text-center
                {{ Session::get('active_user_name') == 'Dava' ? 'bg-rose-500 text-white font-semibold' : 'bg-white text-rose-500 border border-rose-300 hover:bg-rose-200' }}">
                        Dava
                    </a>
                    <a href="{{ route('setActiveUser', ['userName' => 'Albella']) }}"
                        class="w-full sm:w-auto px-4 py-2 text-sm rounded-lg transition-all duration-150 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-opacity-50 text-center
                {{ Session::get('active_user_name') == 'Albella' ? 'bg-rose-500 text-white font-semibold' : 'bg-white text-rose-500 border border-rose-300 hover:bg-rose-200' }}">
                        Albella
                    </a>
                </div>
            </div>
        </div>

        {{-- Judul dengan font yang lebih menarik (jika menggunakan Google Fonts) --}}
        <header class="mb-10 text-center">
            <h1 class="text-4xl sm:text-5xl font-bold text-rose-600" style="font-family: 'Lato';">Catatan Pengeluaran Kamu</h1>
            <p class="text-gray-500 mt-2 text-sm">Kelola keuangan bersama yaa</p>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {{-- Bagian Kalender (col-span penuh di mobile, 2 di large) --}}
            <section class="lg:col-span-2">
                {{-- Kalender dengan style baru --}}
                <div class="p-6 bg-rose-50 rounded-xl border border-rose-200 shadow-sm">
                    <h2 class="text-2xl font-semibold text-rose-700 mb-3">Kalender</h2>
                    <p class="text-sm text-gray-500 mb-6">Pilih tanggal untuk mencatat pengeluaran atau melihat riwayat.</p>
                    <div class="flex items-center justify-between mb-5">
                        <button id="prevMonthBtn" class="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition duration-150 disabled:opacity-50 shadow-sm">‹ Seb</button>
                        <h3 id="currentMonthYear" class="text-xl font-semibold text-rose-700"></h3>
                        <button id="nextMonthBtn" class="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition duration-150 disabled:opacity-50 shadow-sm">Ber ›</button>
                    </div>
                    <div id="calendarGrid" class="grid grid-cols-7 gap-2 text-center"></div>
                </div>
            </section>

            {{-- Sidebar Input dengan style baru (col-span penuh di mobile, 1 di large) --}}
            <aside class="lg:col-span-1">
                <div class="p-6 bg-emerald-200 rounded-xl border border-rose-200 shadow-sm sticky top-8">
                    <h2 class="text-2xl font-semibold text-slate-900  mb-1">Tambah (Pengeluaran)</h2>
                    <p id="selectedDateDisplay" class="text-lg font-medium text-slate-900 mb-5">Pilih tanggal dulu yaaa...</p>
                    <form id="expenseForm" class="space-y-5">
                        @csrf
                        <div>
                            <label for="expenseDescription" class="block text-sm font-medium text-gray-700 mb-1">Untuk Apa Kamuu?</label>
                            <input type="text" id="expenseDescription" name="expenseDescription" required class="mt-1 block w-full px-4 py-2.5 border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 sm:text-sm transition-colors" placeholder="Harus Jujur Yaa...">
                        </div>
                        <div>
                            <label for="expenseAmount" class="block text-sm font-medium text-gray-700 mb-1">Berapa (Rp)?</label>
                            <input type="text" id="expenseAmount" name="expenseAmount" required class="mt-1 block w-full px-4 py-2.5 border border-gray-400 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 sm:text-sm transition-colors" placeholder="50.000">
                        </div>
                        <button type="submit" class="w-full px-4 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition duration-150 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-opacity-50">
                            Simpan Catatan
                        </button>
                    </form>

                    <div class="mt-8">
                        <h3 class="text-xl font-semibold text-slate-900">Jejak Pengeluaran Hari Ini:</h3>
                        <ul id="expenseList" class="mt-3 space-y-2.5 text-sm border-xl text-gray-800 max-h-60 overflow-y-auto pr-2">
                            <li id="noExpensesMessage" class="text-gray-500 italic">Belum ada cerita pengeluaran hari ini...</li>
                        </ul>
                        <div class="mt-5 pt-3 border-t border-gray-300">
                            <p class="text-lg font-semibold text-slate-900">Total Hari Ini: <span id="dailyTotal" class="text-emerald-500 font-semi-bold">Rp 0</span></p>
                        </div>
                    </div>
                </div>
            </aside>

            {{-- Grafik dengan style baru (sekarang menjadi item grid tersendiri, col-span penuh di semua ukuran layar di bawah Kalender dan Input) --}}
            <div class="lg:col-span-3 mt-0 lg:mt-0"> {{-- Hapus space-y-8 dari section sebelumnya, atur margin di sini jika perlu --}}
                <div class="p-6 bg-purple-50 rounded-xl border border-purple-200 shadow-sm">
                    <h2 class="text-2xl font-semibold text-purple-700 mb-3">Grafik Keuangan Kamu nih.</h2>
                    <p class="text-sm text-gray-500 mb-6">Visualisasikan pengeluaran bulanan.</p>
                    <div class="chart-container">
                        <canvas id="expensesChart"></canvas>
                    </div>
                </div>
                <div class="lg:col-span-3 mt-8"> {{-- Pastikan ini ada di dalam <main class="grid ..."> --}}
                    <div class="p-6 bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm">
                        <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Rekapan Pengeluaran Bulanan Kamu nih.</h2>
                        <div id="monthlyRecapList" class="space-y-3">
                            {{-- Data rekapan akan dimasukkan di sini oleh JavaScript --}}
                            <p id="noMonthlyRecapMessage" class="text-gray-500 italic">Memuat data rekapan atau belum ada data...</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="text-center mt-12 pt-6 border-t border-rose-200">
            <p class="text-sm text-gray-500">&copy; Dibuat dengan Dava, untuk kita ♥</p>
        </footer>
    </div>

    <script src="{{ asset('assets/js/script.js') }}" defer></script>
    <script>
        const API_BASE_URL = "{{ url('/app-data') }}";
    </script>
</body>

</html>