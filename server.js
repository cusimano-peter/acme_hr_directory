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
