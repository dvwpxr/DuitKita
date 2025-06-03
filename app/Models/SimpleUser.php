<?php

// app/Models/SimpleUser.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SimpleUser extends Model
{
    protected $fillable = ['name'];

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'user_id'); // Asumsi kolom FK di expenses adalah user_id
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(\App\Models\Income::class, 'user_id');
    }
}
