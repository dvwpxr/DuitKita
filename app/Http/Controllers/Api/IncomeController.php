<?php
// app/Http/Controllers/Api/IncomeController.php (atau path controller Anda)
namespace App\Http\Controllers\Api; // Sesuaikan namespace

use App\Http\Controllers\Controller;
use App\Models\Income; // Gunakan model Income
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session; // Untuk mengambil active_user_id
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class IncomeController extends Controller
{
    // Salin fungsi getActiveUserId dari ExpenseController atau buat trait/base controller
    private function getActiveUserId()
    {
        Log::info("getActiveUserId dipanggil. Session ID: " . Session::getId() . ". Current active_user_id: " . Session::get('active_user_id'));
        if (!Session::has('active_user_id')) {
            Log::info("SESSION KOSONG di getActiveUserId: Mencoba set pengguna default Dava.");
            $defaultUser = \App\Models\SimpleUser::where('name', 'Dava')->first();
            if ($defaultUser) {
                Session::put('active_user_id', $defaultUser->id);
                Session::put('active_user_name', $defaultUser->name);
                $profilePic = ($defaultUser->name == 'Dava') ? asset('images/profiles/dava.jpg') : '';
                if ($defaultUser->name == 'Albella') $profilePic = asset('images/profiles/albella.jpg');
                Session::put('active_user_pic', $profilePic);
                Log::info("Pengguna default DISETEL via getActiveUserId: ID=" . $defaultUser->id . ", Nama=" . $defaultUser->name . ", Pic=" . $profilePic);
                return $defaultUser->id;
            } else {
                Log::error("Pengguna default 'Dava' TIDAK DITEMUKAN di database saat getActiveUserId.");
                return null; // Ini akan menyebabkan error 403 jika tidak ada user
            }
        }
        return Session::get('active_user_id');
    }

    public function index(Request $request)
    {
        $activeUserId = $this->getActiveUserId();
        if (!$activeUserId) {
            return response()->json(['message' => 'Pengguna aktif tidak ditemukan.'], 403);
        }

        $query = Income::where('user_id', $activeUserId);

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        $incomes = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->get();
        return response()->json($incomes)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    public function store(Request $request)
    {
        $activeUserId = $this->getActiveUserId();
        if (!$activeUserId) {
            return response()->json(['message' => 'Pengguna aktif tidak ditemukan untuk menyimpan pemasukan.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'date' => 'required|date_format:Y-m-d',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01', // Pemasukan minimal > 0
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $validatedData = $validator->validated();
        $validatedData['user_id'] = $activeUserId;

        $income = Income::create($validatedData);
        return response()->json($income, 201);
    }

    public function destroy(Income $income) // Route model binding
    {
        $activeUserId = $this->getActiveUserId();
        if (!$activeUserId || $income->user_id !== $activeUserId) {
            return response()->json(['message' => 'Unauthorized atau pengguna belum dipilih.'], 403);
        }
        $income->delete();
        return response()->json(null, 204);
    }
}
