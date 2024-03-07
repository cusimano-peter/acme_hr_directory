const express = require('express');
const app = express();
const { Client } = require('pg');
const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db',
});

app.use(require('morgan')('dev'));
app.use(express.json());

// Port configuration
const port = 3000;

const init = async () => {
    try {
        await client.connect();
        console.log('Connected to database.');

        const SQL = `
            DROP TABLE IF EXISTS notes;
            DROP TABLE IF EXISTS categories;
            DROP TABLE IF EXISTS employees;
            DROP TABLE IF EXISTS departments;
            
            CREATE TABLE categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );

            CREATE TABLE departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );

            CREATE TABLE employees (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                department_id INTEGER REFERENCES departments(id)
            );

            CREATE TABLE notes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                txt VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                ranking INTEGER DEFAULT 5 NOT NULL,
                category_id INTEGER REFERENCES categories(id)
            );

            INSERT INTO categories (name) VALUES ('SQL'), ('Shopping'), ('Express');
            INSERT INTO departments (name) VALUES ('Engineering'), ('Marketing'), ('Sales');
        `;
        
        await client.query(SQL);
        console.log('Database initialized.');

        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    } catch (err) {
        console.error('Failed to connect to the database or initialize it', err);
    }
};

init();

// GET all employees
app.get('/api/employees', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT * FROM employees');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET all departments
app.get('/api/departments', async (req, res) => {
    try {
        const { rows } = await client.query('SELECT * FROM departments');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST a new employee
app.post('/api/employees', async (req, res) => {
    try {
        const { name, department_id } = req.body; // Assuming each employee belongs to a department
        const { rows } = await client.query('INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *', [name, department_id]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE an employee by id
app.delete('/api/employees/:id', async (req, res) => {
    try {
        await client.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT (update) an employee by id
app.put('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department_id } = req.body;
        const { rows } = await client.query('UPDATE employees SET name = $1, department_id = $2 WHERE id = $3 RETURNING *', [name, department_id, id]);
        if (rows.length === 0) {
            return res.status(404).send('Employee not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling route
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});