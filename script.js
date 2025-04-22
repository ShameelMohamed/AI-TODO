// Store tasks in localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyByJzlUoKiO1y1xytWczcnQvda9SAwYReo';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// AI prioritization using Gemini
async function aiPrioritize(taskText) {
    try {
        const prompt = `Analyze the following task and classify its priority as HIGH, MEDIUM, or LOW. Consider urgency, importance, and complexity. Only respond with the priority level.
Task: "${taskText}"`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        const data = await response.json();
        const priority = data.candidates[0].content.parts[0].text.trim().toLowerCase();
        
        // Map Gemini's response to our priority levels
        if (priority.includes('high')) {
            return 'high';
        } else if (priority.includes('medium')) {
            return 'medium';
        } else {
            return 'low';
        }
    } catch (error) {
        console.error('AI prioritization failed:', error);
        throw new Error('Failed to analyze task priority');
    }
}

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const addButton = document.getElementById('addButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const taskText = taskInput.value.trim();
    
    if (taskText) {
        // Show loading state
        addButton.disabled = true;
        loadingIndicator.style.display = 'block';
        
        try {
            const priority = await aiPrioritize(taskText);
            const task = {
                id: Date.now(),
                text: taskText,
                priority: priority,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(task);
            saveTasks();
            renderTasks();
            taskInput.value = '';
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        } finally {
            // Hide loading state
            addButton.disabled = false;
            loadingIndicator.style.display = 'none';
        }
    }
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';
    
    // Sort tasks by priority and completion status
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.completed ? 1 : -1;
    });
    
    sortedTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;
        
        taskElement.innerHTML = `
            <div class="task-content">
                ${task.text}
                <span class="priority-badge">${task.priority}</span>
            </div>
            <div class="task-actions">
                <button onclick="toggleTask(${task.id})">${task.completed ? 'Undo' : 'Complete'}</button>
                <button onclick="deleteTask(${task.id})" style="background-color: #ff4444;">Delete</button>
            </div>
        `;
        
        tasksList.appendChild(taskElement);
    });
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    
    // Add enter key support for adding tasks
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
}); 
