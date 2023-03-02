import sqlite from 'better-sqlite3';
const db = new sqlite('./database/db.sqlite');
const tasks = db.prepare('SELECT * FROM task ORDER BY zindex ASC').all();
for (const task of tasks) {
    db.prepare('DELETE FROM task WHERE id = ?').run(task.id);
    db.prepare('INSERT INTO task VALUES(?, ?, ?, ?, ?, 0)').run(task.id, task.top, task.left, task.text, task.color);
}
