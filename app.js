const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs'); // Para carregar os arquivos de certificado
const https = require('https'); // Para criar o servidor HTTPS
require('dotenv').config();  // Certifique-se de carregar as variáveis de ambiente

const app = express();
const port = process.env.PORT || 3000; // Porta padrão ou definida no ambiente

// Caminhos para os certificados SSL (ajuste conforme necessário)
const sslOptions = {
  key: fs.readFileSync('/home/andre_freindorfer/task-manager-backend/server.key'),
  cert: fs.readFileSync('/home/andre_freindorfer/task-manager-backend/server.cert'),
};

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
    console.error('Erro ao conectar ao banco de dados:', err.stack);
  } else {
    console.log('Conectado ao banco de dados PostgreSQL');
  }
});

// Definir um endpoint básico para testar o servidor
app.get('/', (req, res) => {
  res.send('API de Gerenciamento de Tarefas está rodando em HTTPS');
});

// Endpoint para criar uma nova tarefa
app.post('/tasks', async (req, res) => {
  const { title, description, dueDate } = req.body;
  try {
    const newTask = await pool.query(
      'INSERT INTO tasks (title, description, due_date) VALUES ($1, $2, $3) RETURNING *',
      [title, description, dueDate]
    );
    res.status(200).json(newTask.rows[0]); // Retornar status 201 Created e a tarefa criada
  } catch (err) {
    console.error('Erro ao adicionar a tarefa:', err.message);
    res.status(500).json({ error: 'Erro ao adicionar a tarefa' }); // Retornar uma mensagem de erro com status 500
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

// Iniciar o servidor HTTPS
https.createServer(sslOptions, app).listen(port, () => {
  console.log(`Servidor HTTPS rodando na porta ${port}`);
});