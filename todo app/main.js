document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
        const todoForm = document.getElementById('todo-form');
        const todoInput = document.getElementById('todo-input');
        const todoList = document.getElementById('todo-list');
        const remainingCount = document.getElementById('remaining-count');
        const clearCompletedBtn = document.getElementById('clear-completed');
        const filterButtons = document.querySelectorAll('.filter-btn');
        let todos = JSON.parse(localStorage.getItem('todos')) || [];
        let currentFilter = 'all';
    // Initialize the app
    function init() {
        renderTodos();
        updateRemainingCount();
        setupEventListeners();
    }
    // Set up event listeners
    function setupEventListeners() {
        todoForm.addEventListener('submit', handleAddTodo);
        clearCompletedBtn.addEventListener('click', handleClearCompleted);
        filterButtons.forEach(button => {
        button.addEventListener('click', () => handleFilterChange(button.dataset.filter));
    });
    setupDragAndDrop();
    }
    // Add a new todo
    function handleAddTodo(e) {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (!text) return;
        const newTodo = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
        };todos.unshift(newTodo);
        saveTodos();
        renderTodos();
        updateRemainingCount();
        todoInput.value = '';
        todoInput.focus();
    }
    // Toggle todo completion status
    function toggleTodoComplete(id) {
    todos = todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
    updateRemainingCount();
    }
    // Edit todo text
    function editTodo(id, newText) {
    if (!newText.trim()) return;
    todos = todos.map(todo =>
    todo.id === id ? { ...todo, text: newText.trim() } : todo
    );
    saveTodos();
    renderTodos();
    }
    // Delete a todo
    function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateRemainingCount();
    }
    // Clear all completed todos
    function handleClearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();updateRemainingCount();
    }
    // Change filter
    function handleFilterChange(filter) {
    currentFilter = filter;
    // Update active button
    filterButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.filter === filter);
    });
    renderTodos();
    }
    // Update remaining tasks count
    function updateRemainingCount() {
    const count = todos.filter(todo => !todo.completed).length;
    remainingCount.textContent = count;
    }
    // Save todos to localStorage
    function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    }
    // Render todos based on current filter
    function renderTodos() {
    let filteredTodos = [];
    switch (currentFilter) {
    case 'active':
    filteredTodos = todos.filter(todo => !todo.completed);
    break;
    case 'completed':
    filteredTodos = todos.filter(todo => todo.completed);
    break;
    default:
    filteredTodos = [...todos];
    }
    todoList.innerHTML = '';
    if (filteredTodos.length === 0) {const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = currentFilter === 'all'
    ? 'No tasks added yet'
    : `No ${currentFilter} tasks`;
    todoList.appendChild(emptyMessage);
    return;
    }
    filteredTodos.forEach(todo => {
    const todoItem = document.createElement('li');
    todoItem.className = 'todo-item';
    todoItem.dataset.id = todo.id;
    todoItem.draggable = true;
    todoItem.innerHTML = `
    <input
    type="checkbox"
    class="todo-checkbox"
    ${todo.completed ? 'checked' : ''}
    aria-label="${todo.completed ? 'Mark as incomplete' : 'Mark as complete'}"
    >
    <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
    <div class="todo-actions">
    <button class="edit-btn" aria-label="Edit task">
    <i class="fas fa-edit"></i>
    </button>
    <button class="delete-btn" aria-label="Delete task">
    <i class="fas fa-trash"></i>
    </button>
    </div>
    `;
    // Add event listeners to the new todo item
    const checkbox = todoItem.querySelector('.todo-checkbox');
    const editBtn = todoItem.querySelector('.edit-btn');
    const deleteBtn = todoItem.querySelector('.delete-btn');
    const todoText = todoItem.querySelector('.todo-text');
    checkbox.addEventListener('change', () => toggleTodoComplete(todo.id));
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    editBtn.addEventListener('click', () => {const currentText = todo.text;
    const newText = prompt('Edit your task:', currentText);
    if (newText !== null) {
    editTodo(todo.id, newText);
    }
    });
    // Make todo text editable on double click
    todoText.addEventListener('dblclick', () => {
    const currentText = todo.text;
    const newText = prompt('Edit your task:', currentText);
    if (newText !== null) {
    editTodo(todo.id, newText);
    }
    });
    todoList.appendChild(todoItem);
    });
    }
    // Drag and drop functionality
    function setupDragAndDrop() {
    let draggedItem = null;
    todoList.addEventListener('dragstart', function(e) {
    if (e.target.classList.contains('todo-item')) {
    draggedItem = e.target;
    setTimeout(() => {
    draggedItem.classList.add('dragging');
    }, 0);
    }
    });
    todoList.addEventListener('dragend', function() {
    if (draggedItem) {
    draggedItem.classList.remove('dragging');
    draggedItem = null;
    }
    });
    todoList.addEventListener('dragover', function(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(todoList, e.clientY);
    const currentItem = document.querySelector('.dragging');if (!currentItem) return;
    if (afterElement) {
    todoList.insertBefore(currentItem, afterElement);
    } else {
    todoList.appendChild(currentItem);
    }
    // Update todos order in the array
    updateTodosOrder();
    });
    }
    function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
    return { offset: offset, element: child };
    } else {
    return closest;
    }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    function updateTodosOrder() {
    const todoItems = todoList.querySelectorAll('.todo-item');
    const newOrder = Array.from(todoItems).map(item => parseInt(item.dataset.id));
    // Reorder the todos array based on DOM order
    todos.sort((a, b) => {
    return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
    });
    saveTodos();
    }
    // Initialize the app
    init();
    });