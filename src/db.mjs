import fs from 'node:fs';
import path from 'node:path';
import sqlite from 'better-sqlite3';
import log4js from 'log4js';
const logger = log4js.getLogger();

export class DB {
    #dir;
    #dbFile;

    constructor(currentDir) {
        this.#dir = path.resolve(currentDir, 'database');
        this.#dbFile = path.resolve(this.#dir, 'db.sqlite');

        if (!fs.existsSync(this.#dir)) {
            fs.mkdirSync(this.#dir);
        }

        this.db = new sqlite(this.#dbFile);
        this.db.exec('CREATE TABLE IF NOT EXISTS task (id TEXT PRIMARY KEY, top REAL, left REAL, text TEXT, color TEXT)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idindex ON task(id)');
        this.db.exec('VACUUM');
    }
    
    backup(to) {
        const dst = path.resolve(to, 'db.sqlite');
        this.db.backup(dst).catch(e => logger.error('Failed to backup.', e));
    }

    /**
     * @returns {{
     *      id: string,
     *      top: number,
     *      left: number,
     *      text: string,
     *      color: string,
     * }[]}
     */
    getAll() {
        const tasks = this.db.prepare('SELECT * FROM task').all();
        return tasks.map(t => ({
            id: t['id'] || '',
            top: t['top'] || 0,
            left: t['left'] || 0,
            text: t['text'] || '',
            color: t['color'] || 'white'
        }));
    }

    /**
     * @param {{
     *      id: string,
     *      pos: {
     *          top: number,
     *          left: number
     *      },
     *      text: string,
     *      color: string,
     * }} info 
     * @returns 
     */
    createTask(info) {
        const { id, pos: { top, left }, text, color } = info;
        this.db.prepare('INSERT INTO task VALUES(?, ?, ?, ?, ?)').run(id, top, left, text, color);
    }

    /**
     * @param {string[]} ids 
     */
    deleteTask(ids) {
        const idsText = ids.map(id => `'${id}'`).join(',');
        this.db.prepare(`DELETE FROM task WHERE id IN (${idsText})`).run();
    }

    /**
     * @param {string[]} ids
     * @param {string} color
     */
    changeColor(ids, color) {
        const idsText = ids.map(id => `'${id}'`).join(',');
        this.db.prepare(`UPDATE task SET color = ? WHERE id IN (${idsText})`).run(color);
    }

    /**
     * @param {string} id 
     * @param {string} text 
     */
    editText(id, text) {
        this.db.prepare('UPDATE task SET text = ? WHERE id = ?').run(text.replace(/'/g, "''"), id);
    }

    /**
     * @param {{
     *      id: string,
     *      pos: {
     *          top: number,
     *          left: number
     *      }
     * }[]} infos
     */
    moveTask(infos) {
        const updateTask = this.db.prepare('UPDATE task SET top = ?, left = ? WHERE id = ?');
        for (const info of infos) {
            updateTask.run(info.pos.top, info.pos.left, info.id);
        }
    }

    /**
     * @param {string[]} ids 
     */
    updateToFront(ids) {
        const idsText = ids.map(id => `'${id}'`).join(',');
        this.db.transaction(() => {
            const tasks = this.db.prepare(`SELECT * FROM task WHERE id IN (${idsText})`).all();
            this.deleteTask(ids);
            for (const task of tasks) {
                this.db.prepare('INSERT INTO task VALUES(@id, @top, @left, @text, @color)').run(task);
            }
        }).immediate();
    }
}
