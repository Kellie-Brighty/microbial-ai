import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaCheck, FaEdit } from "react-icons/fa";

// Define the Todo item interface
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const Todo: React.FC = () => {
  // State for todos and input
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    // Load todos from localStorage if available
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos);
        // Convert string dates back to Date objects
        return parsedTodos.map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt),
        }));
      } catch (error) {
        console.error("Error parsing todos from localStorage:", error);
        return [];
      }
    }
    return [];
  });

  const [inputValue, setInputValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // Add a new todo
  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        completed: false,
        createdAt: new Date(),
      };
      setTodos([...todos, newTodo]);
      setInputValue("");
    }
  };

  // Toggle completion status
  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a todo
  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // Start editing a todo
  const startEditing = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditValue(todo.text);
  };

  // Save edited todo
  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      setTodos(
        todos.map((todo) =>
          todo.id === editingId ? { ...todo, text: editValue.trim() } : todo
        )
      );
      setEditingId(null);
      setEditValue("");
    }
  };

  // Handle key presses
  const handleKeyPress = (
    e: React.KeyboardEvent,
    isEditing: boolean = false
  ) => {
    if (e.key === "Enter") {
      if (isEditing) {
        saveEdit();
      } else {
        addTodo();
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl m-4 p-4">
      <h2 className="text-xl font-bold text-mint mb-4">Todo List</h2>

      {/* Add Todo Form */}
      <div className="flex mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e)}
          placeholder="Add a new task..."
          className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-mint"
        />
        <button
          onClick={addTodo}
          className="bg-mint text-white p-2 rounded-r hover:bg-mint/80 transition"
        >
          <FaPlus />
        </button>
      </div>

      {/* Todo List */}
      <ul className="divide-y divide-gray-200">
        {todos.length === 0 ? (
          <li className="py-4 text-center text-gray-500">
            No tasks yet! Add one above.
          </li>
        ) : (
          todos.map((todo) => (
            <li
              key={todo.id}
              className={`py-4 flex items-center ${
                todo.completed ? "text-gray-400" : ""
              }`}
            >
              {editingId === todo.id ? (
                <div className="flex-grow flex">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, true)}
                    className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-mint"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="bg-mint text-white p-2 rounded-r hover:bg-mint/80 transition"
                  >
                    <FaCheck />
                  </button>
                </div>
              ) : (
                <>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-6 h-6 mr-2 rounded-full border flex items-center justify-center ${
                      todo.completed
                        ? "bg-mint border-mint text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {todo.completed && <FaCheck size={12} />}
                  </button>

                  {/* Todo Text */}
                  <span
                    className={`flex-grow ${
                      todo.completed ? "line-through" : ""
                    }`}
                  >
                    {todo.text}
                  </span>

                  {/* Edit Button */}
                  <button
                    onClick={() => startEditing(todo)}
                    className="text-gray-400 hover:text-mint mr-2 transition"
                    disabled={todo.completed}
                  >
                    <FaEdit />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </li>
          ))
        )}
      </ul>

      {/* Todo Stats */}
      <div className="mt-4 text-sm text-gray-500">
        {todos.length > 0 && (
          <p>
            {todos.filter((todo) => todo.completed).length} of {todos.length}{" "}
            tasks completed
          </p>
        )}
      </div>
    </div>
  );
};

export default Todo;
