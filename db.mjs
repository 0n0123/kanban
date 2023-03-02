import fs from 'node:fs';
import sqlite from 'better-sqlite3';
import log4js from 'log4js';
const logger = log4js.getLogger();

const DB_DIR = './database';
const DB_FILE = DB_DIR + '/db.sqlite';

export const db = new class {
    constructor() {
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR);
        }

        this.db = new sqlite(DB_FILE);
        this.db.exec('CREATE TABLE IF NOT EXISTS task (id TEXT PRIMARY KEY, top REAL, left REAL, text TEXT, color TEXT)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idindex ON task(id)');
        this.db.exec('VACUUM');
    }
    
    backup(to) {
        this.db.backup(to + '/db.sqlite').catch(e => logger.error('Failed to backup.', e));
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
        return this.db.prepare('SELECT * FROM task').all();
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
}();
