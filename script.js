// Store tasks in localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Hugging Face API configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models/finiteautomata/bertweet-base-sentiment-analysis';
const HF_API_KEY = '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'; // Add your Hugging Face API key here

// AI prioritization using Hugging Face model
async function aiPrioritize(taskText) {
    try {
        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: taskText })
        });

        const result = await response.json();
        
        // Analyze sentiment and urgency
        const sentiment = result[0][0].label;
        const score = result[0][0].score;
        
        // Check for urgency keywords
        const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'important'];
        const hasUrgentKeyword = urgentKeywords.some(keyword => 
            taskText.toLowerCase().includes(keyword)
        );

        // Determine priority based on sentiment and keywords
        if (hasUrgentKeyword || (sentiment === 'POS' && score > 0.8)) {
            return 'high';
        } else if (sentiment === 'POS' || (sentiment === 'NEU' && score > 0.6)) {
            return 'medium';
        } else {
            return 'low';
        }
    } catch (error) {
        console.error('AI prioritization failed:', error);
        // Fallback to basic prioritization
        return basicPrioritize(taskText);
    }
}

// Basic prioritization as fallback
function basicPrioritize(taskText) {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'important'];
    const mediumKeywords = ['soon', 'next', 'tomorrow', 'later'];
    const lowKeywords = ['sometime', 'eventually', 'when possible', 'optional'];

    taskText = taskText.toLowerCase();
    
    if (urgentKeywords.some(keyword => taskText.includes(keyword))) {
        return 'high';
    }
    
    if (mediumKeywords.some(keyword => taskText.includes(keyword))) {
        return 'medium';
    }
    
    if (lowKeywords.some(keyword => taskText.includes(keyword))) {
        return 'low';
    }
    
    if (taskText.length > 50) {
        return 'high';
    } else if (taskText.length > 20) {
        return 'medium';
    }
    
    return 'low';
}

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();
    
    if (taskText) {
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