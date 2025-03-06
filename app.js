import express from 'express';

const app = express();
const port = 3000;

// Entity
class Task {
  constructor(task_id, title, description, due_date, completed = false) {
    this.task_id = task_id;
    this.title = title;
    this.description = description;
    this.due_date = due_date;
    this.completed = completed;
  }
}

// Storage
let tasks = [
  new Task( "task1", "shop", "Купить УрПЭТовское молоко", "2024-03-15", true),  // Ensure the ID is "TASK1", the title is "shop", project_id is null or properly initialized
  new Task( "task2", "friday", "Посетить пару", "2024-03-16", false)
];

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
// GET /tasks 
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// GET /tasks/:task_id 
app.get('/tasks/:task_id', (req, res) => {
  const task_id = req.params.task_id;
  const task = tasks.find(task => task.task_id === task_id);

  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});
// GET /task/search?title=keyword - поиск по title
app.get('/task/search', (req, res) => {
    const searchTerm = req.query.title;
  
    if (!searchTerm) {
      return res.status(400).json({ message: 'Missing search term (title)' });
    }
  
    const results = tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    res.json(results);
  });

// POST /tasks 
app.post('/tasks', (req, res) => {
  const { title, description, due_date } = req.body;

  
  if (!title || !due_date) {
    return res.status(400).json({ message: 'Missing required fields (title and due_date)' });
  }

  const new_task_id = String(Date.now()); 
  const newTask = new Task(new_task_id, title, description, due_date);
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT /tasks/:task_id 
app.put('/tasks/:task_id', (req, res) => {
  const task_id = req.params.task_id;
  const { title, description, due_date, completed } = req.body;

  const taskIndex = tasks.findIndex(task => task.task_id === task_id);

  if (taskIndex !== -1) {
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      title,
      description,
      due_date,
      completed 
    };
    res.json(tasks[taskIndex]);
  } else {
    res.status(404).json({ message: 'Task not found' });
  }
});

// DELETE /tasks/:task_id - Delete a task by ID
app.delete('/tasks/:task_id', (req, res) => {
  const task_id = req.params.task_id;
  tasks = tasks.filter(task => task.task_id !== task_id);
  res.status(204).send(); 
});


app.get('/', (req, res) => {
  res.send('Task Management API is running!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});