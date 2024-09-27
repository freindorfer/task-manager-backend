const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware para parsear o corpo das requisições em JSON
app.use(bodyParser.json());
app.use(cors());

// Configuração da conexão com o PostgreSQL
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432, // Porta padrão do PostgreSQL
});

// Testar a conexão ao PostgreSQL
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao banco de dados:', err.stack);
  }
  console.log('Conectado ao banco de dados PostgreSQL');
  release();
});

// Definir um endpoint básico para testar o servidor
app.get('/', (req, res) => {
  res.send('API de Gerenciamento de Tarefas está rodando');
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Endpoint para criar uma nova tarefa
app.post('/tasks', async (req, res) => {
    const { title, description, dueDate } = req.body;
    try {
      const newTask = await pool.query(
        'INSERT INTO tasks (title, description, due_date) VALUES ($1, $2, $3) RETURNING *',
        [title, description, dueDate]
      );
      res.json(newTask.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Erro no servidor');
    }
  });

  // Endpoint para listar todas as tarefas
app.get('/tasks', async (req, res) => {
    try {
      const allTasks = await pool.query('SELECT * FROM tasks ORDER BY due_date');
      res.json(allTasks.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Erro no servidor');
    }
  });

  // Endpoint para editar uma tarefa
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, dueDate, isCompleted } = req.body;
    try {
      const updateTask = await pool.query(
        'UPDATE tasks SET title = $1, description = $2, due_date = $3, is_completed = $4 WHERE id = $5 RETURNING *',
        [title, description, dueDate, isCompleted, id]
      );
      res.json(updateTask.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Erro no servidor');
    }
  });

  // Endpoint para deletar uma tarefa
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
      res.json({ message: 'Tarefa deletada com sucesso' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Erro no servidor');
    }
  });
  
  
