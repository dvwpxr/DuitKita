<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception; // Import Exception

class TestDbController extends Controller
{
    public function checkConnection()
    {
        try {
            $result = DB::select('SELECT version()');
            // $result = DB::connection()->getPdo(); // Cara lain untuk cek koneksi tanpa query data

            return response()->json([
                'status' => 'success',
                'message' => 'Successfully connected to the database!',
                'db_version' => $result
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Could not connect to the database. Please check your configuration.',
                'error_details' => $e->getMessage()
            ], 500);
        }
    }
}
