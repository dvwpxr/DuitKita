<?php

// database/seeders/SimpleUserSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SimpleUser; // Ganti dengan App\Models\User jika Anda menggunakan model User bawaan

class SimpleUserSeeder extends Seeder
{
    public function run(): void
    {
        SimpleUser::firstOrCreate(['name' => 'Dava']);
        SimpleUser::firstOrCreate(['name' => 'Albella']);
    }
}
