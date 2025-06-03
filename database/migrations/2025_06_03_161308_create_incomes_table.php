<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('incomes', function (Blueprint $table) {
            $table->id();
            // Sesuaikan dengan model pengguna Anda (SimpleUser atau User bawaan)
            // dan pastikan foreign key mengarah ke tabel pengguna yang benar
            $table->foreignId('user_id')->constrained('simple_users')->onDelete('cascade');
            $table->date('date');
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('incomes');
    }
};
