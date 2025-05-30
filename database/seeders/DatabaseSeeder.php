<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash; // Import Hash

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create(); // You can keep this if you want other random users

        User::factory()->create([
            'name' => 'dava',
            'email' => 'dava@example.com',
            'password' => Hash::make('password123'), // Set a secure password
        ]);

        User::factory()->create([
            'name' => 'albella',
            'email' => 'albella@example.com',
            'password' => Hash::make('password123'), // Set a secure password
        ]);

        // Optionally, create a default Test User if needed
        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        //     'password' => Hash::make('password'),
        // ]);
    }
}
