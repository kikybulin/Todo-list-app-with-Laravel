<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Todo;

class TodoController extends Controller
{
    // Menampilkan semua todo
    public function index()
    {
        $todos = Todo::all();
        return response()->json($todos);
    }

    // Menyimpan todo baru
    public function store(Request $request)
    {
        $request->validate([
            'task' => 'required|string|max:255',
        ]);

        $todo = Todo::create([
            'task' => $request->input('task')
        ]);

        return response()->json($todo, 201);
    }

    // Menghapus todo
    public function destroy($id)
    {
        $todo = Todo::findOrFail($id);
        $todo->delete();

        return response()->json(null, 204);
    }

    public function updateStatus(Request $request, $id)
    {
        $todo = Todo::findOrFail($id);
        $todo->completed = $request->completed;
        $todo->save();

        return response()->json($todo);
    }
}
