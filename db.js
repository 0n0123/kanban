const fs = require('fs');
const sqlite = require('better-sqlite3');
const logger = require('log4js').getLogger();

const DB_DIR = __dirname + '/database';
const DB_FILE = DB_DIR + '/db.sqlite';

module.exports = new class {
    constructor () {
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR);
        }

        this.db = new sqlite(DB_FILE);
        this.db.exec('CREATE TABLE IF NOT EXISTS task (id TEXT PRIMARY KEY, top REAL, left REAL, text TEXT, color TEXT, zindex INTEGER)');
        this.db.exec('CREATE INDEX IF NOT EXISTS idindex ON task(id)');
        this.db.exec('VACUUM');
    }
    
    backup (to) {
        this.db.backup(to + '/db.sqlite').catch(e => logger.error('Failed to backup.', e));
    }

    /**
     * @returns {{
     *      id: string,
     *      top: number,
     *      left: number,
     *      text: string,
     *      color: string,
     *      zindex: number,
     * }[]}
     */
    getAll () {
        return this.db.prepare('SELECT * FROM task ORDER BY zindex ASC, id DESC').all();
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
    createTask (info) {
        this.db.transaction(() => {
            const { id, pos, text, color } = info;
            const { max } = this.db.prepare('SELECT max(zindex) as max FROM task').get();
            const insertTask = this.db.prepare('INSERT INTO task VALUES(@id, @top, @left, @text, @color, @max)');
            insertTask.run({ id, top: pos.top, left: pos.left, text, color, max });
        }).immediate();
    }

    /**
     * @param {string[]} ids 
     */
    deleteTask (ids) {
        const deleteTask = this.db.prepare('DELETE FROM task WHERE id = ?');
        for (const id of ids) {
            deleteTask.run(id);
        }
    }

    /**
     * @param {string[]} ids
     * @param {string} color
     */
    changeColor (ids, color) {
        const updateTask = this.db.prepare('UPDATE task SET color = ? WHERE id = ?');
        for (const id of ids) {
            updateTask.run(color, id);
        }
    }

    /**
     * @param {string} id 
     * @param {string} text 
     */
    editText (id, text) {
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
    moveTask (infos) {
        const updateTask = this.db.prepare('UPDATE task SET top = ?, left = ? WHERE id = ?');
        for (const info of infos) {
            updateTask.run(info.pos.top, info.pos.left, info.id);
        }
    }

    /**
     * @param {string[]} ids 
     */
    updateToFront (ids) {
        this.db.transaction(() => {
            const updateMax = this.db.prepare('UPDATE task SET zindex = ? WHERE id = ?');
            let { max } = this.db.prepare('SELECT max(zindex) as max FROM task').get();
            for (const id of ids) {
                updateMax.run(++max, id);
            }
            this.db.prepare('UPDATE task AS t SET zindex = (SELECT newindex FROM (SELECT row_number() over(ORDER BY zindex ASC) AS newindex, id FROM task) WHERE id = t.id)').run();
        }).immediate();
    }
}
