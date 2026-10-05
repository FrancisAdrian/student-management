const express = require('express');
const mysql = require('mysql2');

const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'student_management'
});

db.connect((err) => {
    if (err) {
    console.error('Database connection failed:', err);
    return;
    }
    console.log('Connected to MySQL');
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/students', (req, res) => {
    db.query('SELECT * FROM students ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        res.render('index', {
        students: results
        });
    });
});

app.get('/students/add', (req, res) => {
    res.render('add');
});

app.post('/students/add', (req, res) => {
    const {
        student_id,
        first_name,
        last_name,
        course,
        year_level,
        email
    } = req.body;

    const sql = `
        INSERT INTO students
        (student_id, first_name, last_name, course, year_level, email)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        student_id,
        first_name,
        last_name,
        course,
        year_level,
        email
    ];
    db.query(sql, values, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Unable to save student');
        }
        res.redirect('/');
    });
});

app.get('/students/search', (req, res) => {
    const keyword = req.query.keyword || '';
    const sql = `
        SELECT * FROM students
        WHERE student_id LIKE ?
        OR first_name LIKE ?
        OR last_name LIKE ?
        OR course LIKE ?
    `;
    const searchValue = `%${keyword}%`;
    db.query(
        sql,
        [
            searchValue,
            searchValue,
            searchValue,
            searchValue
        ],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Search error');
            }
            res.render('index', {
                students: results
            });
        }
    );
});

// POST /students/delete/:id - Delete a student record
app.post('/students/delete/:id', (req, res) => {
  const studentId = req.params.id;
  const sql = 'DELETE FROM students WHERE id = ?';

  db.query(sql, [studentId], (err, result) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).send('Database error while deleting student.');
    }

    // Redirect back to the student list after successful deletion
    res.redirect('/students');
  });
});

// 1. GET Route: I-render ang Edit Form na may kasamang lumang data
app.get('/students/edit/:id', (req, res) => {
  const studentId = req.params.id;
  const sql = 'SELECT * FROM students WHERE id = ?';

  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).send('Database error while retrieving student.');
    }

    // Kapag walang nahanap na estudyante gamit ang ibinigay na ID
    if (results.length === 0) {
      return res.status(404).send('Student not found.');
    }

    // I-render ang edit.ejs at ipasa ang nahanap na student object
    res.render('edit', { student: results[0] });
  });
});

// 2. POST Route: Tanggapin at i-save ang mga bagong detalye sa database
app.post('/students/edit/:id', (req, res) => {
  const id = req.params.id;
  const { student_id, first_name, last_name, course, year_level } = req.body;

  const sql = `
    UPDATE students 
    SET student_id = ?, first_name = ?, last_name = ?, course = ?, year_level = ?
    WHERE id = ?
  `;

  // Parameterized array para maiwasan ang SQL Injection
  const values = [student_id.trim(), first_name.trim(), last_name.trim(), course.trim(), year_level.trim(), id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).send('Database error while updating student.');
    }

    // Kapag matagumpay ang update, mag-redirect pabalik sa student list
    res.redirect('/students');
  });
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
