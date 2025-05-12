import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { FormEvent, useState } from "react";
import { Id } from "../convex/_generated/dataModel";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

function getWeekBounds() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(now);
  end.setDate(now.getDate() + (6 - now.getDay()));
  end.setHours(23, 59, 59, 999);
  
  return { start: start.getTime(), end: end.getTime() };
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Go For It!</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const todos = useQuery(api.todos.list) ?? [];
  const categories = useQuery(api.categories.list) ?? [];
  const create = useMutation(api.todos.create);
  const update = useMutation(api.todos.update);
  const remove = useMutation(api.todos.remove);
  const createCategory = useMutation(api.categories.create);
  
  const [newTodo, setNewTodo] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<"low" | "medium" | "high" | "">("");
  const [notes, setNotes] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { start: weekStart, end: weekEnd } = getWeekBounds();
  const thisWeekTodos = todos.filter(todo => 
    todo.dueDate && todo.dueDate >= weekStart && todo.dueDate <= weekEnd
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    try {
      await create({
        text: newTodo,
        dueDate: selectedDate ? new Date(selectedDate).getTime() : undefined,
        category: selectedCategory || undefined,
        priority: selectedPriority || undefined,
        notes: notes || undefined
      });
      setNewTodo("");
      setSelectedDate("");
      setSelectedCategory("");
      setSelectedPriority("");
      setNotes("");
    } catch (error) {
      toast.error("Failed to create todo");
    }
  }

  async function handleToggle(id: Id<"todos">) {
    try {
      const todo = todos.find(t => t._id === id);
      if (todo) {
        await update({ id, completed: !todo.completed });
      }
    } catch (error) {
      toast.error("Failed to update todo");
    }
  }

  async function handleDelete(id: Id<"todos">) {
    try {
      await remove({ id });
    } catch (error) {
      toast.error("Failed to delete todo");
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategory({
        name: newCategoryName,
        color: newCategoryColor
      });
      setNewCategoryName("");
      setShowAddCategory(false);
    } catch (error) {
      toast.error("Failed to create category");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold accent-text mb-4">Go For It!</h1>
        <Authenticated>
          <p className="text-xl text-slate-600">
            Welcome back, {loggedInUser?.email ?? "friend"}!
          </p>
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to manage your todos</p>
        </Unauthenticated>
      </div>

      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>

      <Authenticated>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new todo..."
                className="w-full rounded border p-2"
              />
              
              <div className="flex gap-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded border p-2"
                />
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded border p-2"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="rounded border p-2"
                >
                  <option value="">Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="w-full rounded border p-2 h-24"
              />

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Add Category
                </button>
                <button
                  type="submit"
                  disabled={!newTodo.trim()}
                  className="bg-indigo-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Add Todo
                </button>
              </div>
            </form>

            {showAddCategory && (
              <form onSubmit={handleAddCategory} className="space-y-4 mt-4 p-4 border rounded">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full rounded border p-2"
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-full h-10 rounded border p-1"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newCategoryName.trim()}
                    className="bg-indigo-500 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    Add Category
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">This Week's Tasks</h2>
              <ul className="space-y-2">
                {thisWeekTodos.map((todo) => (
                  <li
                    key={todo._id}
                    className="flex items-center gap-2 p-2 border rounded"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo._id)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1">
                      <span className={todo.completed ? "line-through" : ""}>
                        {todo.text}
                      </span>
                      {todo.dueDate && (
                        <span className="text-sm text-gray-500 ml-2">
                          {formatDate(todo.dueDate)}
                        </span>
                      )}
                      {todo.category && (
                        <span
                          className="text-sm ml-2 px-2 py-1 rounded"
                          style={{
                            backgroundColor: categories.find(c => c.name === todo.category)?.color ?? "#3B82F6",
                            color: "white"
                          }}
                        >
                          {todo.category}
                        </span>
                      )}
                      {todo.priority && (
                        <span className={`text-sm ml-2 px-2 py-1 rounded ${
                          todo.priority === "high" ? "bg-red-500" :
                          todo.priority === "medium" ? "bg-yellow-500" :
                          "bg-green-500"
                        } text-white`}>
                          {todo.priority}
                        </span>
                      )}
                      {todo.notes && (
                        <p className="text-sm text-gray-500 mt-1">{todo.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(todo._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">All Tasks</h2>
              <ul className="space-y-2">
                {todos.map((todo) => (
                  <li
                    key={todo._id}
                    className="flex items-center gap-2 p-2 border rounded"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo._id)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1">
                      <span className={todo.completed ? "line-through" : ""}>
                        {todo.text}
                      </span>
                      {todo.dueDate && (
                        <span className="text-sm text-gray-500 ml-2">
                          {formatDate(todo.dueDate)}
                        </span>
                      )}
                      {todo.category && (
                        <span
                          className="text-sm ml-2 px-2 py-1 rounded"
                          style={{
                            backgroundColor: categories.find(c => c.name === todo.category)?.color ?? "#3B82F6",
                            color: "white"
                          }}
                        >
                          {todo.category}
                        </span>
                      )}
                      {todo.priority && (
                        <span className={`text-sm ml-2 px-2 py-1 rounded ${
                          todo.priority === "high" ? "bg-red-500" :
                          todo.priority === "medium" ? "bg-yellow-500" :
                          "bg-green-500"
                        } text-white`}>
                          {todo.priority}
                        </span>
                      )}
                      {todo.notes && (
                        <p className="text-sm text-gray-500 mt-1">{todo.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(todo._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Authenticated>
    </div>
  );
}
