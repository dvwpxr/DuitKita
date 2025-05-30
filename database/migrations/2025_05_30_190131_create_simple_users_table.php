<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_simple_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simple_users', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Dava, Albella
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('simple_users');
    }
};
