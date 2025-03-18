import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';
import { body, validationResult } from 'express-validator'; // For request body validation

const app = express();
const port = 3000;

// Database Configuration (SQLite for simplicity)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite', // Database file
    logging: false // Disable logging for cleaner console output
});

// Task Model Definition
const Task = sequelize.define('Task', {
    task_id: {
        type: DataTypes.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            // Custom validator in Sequelize
            isValidDay(value) {
                const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                if (!validDays.includes(value.toLowerCase())) {
                    throw new Error('Title must be a valid day of the week (Monday, Tuesday, etc.)');
                }
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: true
        }
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'tasks',
    timestamps: true  // Enable timestamps (createdAt, updatedAt)
});

(async () => {
    try {
        await sequelize.sync({ force: false }); // Use { force: true } to drop and recreate the table
        console.log('Database synchronized');

        if (await Task.count() === 0) {
            await Task.create({
                title: "Monday",
                description: "Example task for Monday",
                due_date: "2024-01-30"
            });
            console.log('Database seeded with initial data');
        }

    } catch (error) {
        console.error('Unable to synchronize the database:', error);
    }
})();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Routes ---

// GET /tasks - get all tasks
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.findAll();
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /tasks/:task_id - get task by ID
app.get('/tasks/:task_id', async (req, res) => {
    const task_id = req.params.task_id;

    try {
        const task = await Task.findByPk(task_id);
        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /tasks - create a new task
app.post(
    '/tasks',
    [
        // Validation using express-validator (more for demonstration, Sequelize handles the main validation)
        body('title')
            .notEmpty()
            .withMessage('Title is required')
        ,
        body('due_date').notEmpty().withMessage('Due date is required').isISO8601().toDate().withMessage('Invalid due date format') // Validate date format

    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, due_date, completed } = req.body;

        try {
            const newTask = await Task.create({
                title,
                description,
                due_date,
                completed
            });
            res.status(201).json(newTask);
        } catch (error) {
            console.error(error);

            // Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path, // Field name
                    msg: err.message  // Error message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }

            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);


// PUT /tasks/:task_id - update a task by ID
app.put(
    '/tasks/:task_id',
    [
        // Validation using express-validator
        body('title')
            .optional()
            .notEmpty()
            .withMessage('Title is required'), // You can adjust validation rules here as needed
        body('due_date').optional().isISO8601().toDate().withMessage('Invalid due date format')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const task_id = req.params.task_id;
        const { title, description, due_date, completed } = req.body;

        try {
            const task = await Task.findByPk(task_id);
            if (!task) {
                return res.status(404).json({ message: 'Task not found' });
            }

            await task.update({
                title,
                description,
                due_date,
                completed
            });

            res.json(task);
        } catch (error) {
            console.error(error);
              // Sequelize validation errors
            if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path, // Field name
                    msg: err.message  // Error message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// DELETE /tasks/:task_id - delete a task by ID
app.delete('/tasks/:task_id', async (req, res) => {
    const task_id = req.params.task_id;

    try {
        const task = await Task.findByPk(task_id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.destroy();
        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('Task Management API is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});