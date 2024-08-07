import express from 'express';
import log4js from 'log4js';
import fs from 'node:fs';
import path from 'node:path';
import { Server } from 'socket.io';
import { Config } from './config.mjs';

const currentDir = path.resolve(process.cwd());

const logConfig = path.resolve(currentDir, 'conf', 'logconfig.json');
log4js.configure(logConfig);
const logger = log4js.getLogger();
logger.info(`Application is starting (NODE_ENV=${process.env.NODE_ENV})`);

const settings = new Config(currentDir);

import { DB } from './db.mjs';
const db = new DB(currentDir);

const backupDir = settings.getBackupDest();
const backupInterval = settings.getBackupIntervalMinutes();
if (backupDir.length > 0 && backupInterval > 0) {
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    setInterval(() => db.backup(backupDir), backupInterval * 1000 * 60);
}

const app = express();
app.use('/', express.static(path.resolve(currentDir, 'views')));
app.use('/socket.io', express.static(path.resolve(currentDir, 'node_modules/socket.io/client-dist')));
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.set('views', path.resolve(currentDir, 'views'));
app.use(log4js.connectLogger(logger, {}));

import http from 'node:http';
http.createServer(app);

const port = settings.getPort();
const server = http.createServer(app).listen(port, () => logger.info('Listening to port: ' + port));
const io = new Server(server);

/**
 * @typedef {{
 *      id?: string,
 *      color?: string,
 *      pos?: {
 *          left: number,
 *          top: number
 *      },
 *      text?: string,
 * }} TaskInfo
 */

io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    const rows = db.getAll();
    socket.emit('welcome', {
        tasks: rows
    });
    socket.on('create', onmessage(create));
    socket.on('color', onmessage(changeColor));
    socket.on('text', onmessage(editText));
    socket.on('move', onmessage(move));
    socket.on('delete', onmessage(deleteTask));
    socket.on('tofront', onmessage(updateToFront));
    socket.on('disconnect', _ => logger.info(`User disconnected: ${socket.id}`));
});

app.get('/', (req, res) => {
    res.header({
            'Cache-Control': 'no-store'
        })
        .render('index');
});

function onmessage(callback) {
    return function (message) {
        try {
            callback(message);
        } catch (e) {
            io.emit('error');
        }
    };
}

/**
 * @param {TaskInfo} info 
 */
function create(info) {
    const result = {
        pos: {
            top: (info.pos && info.pos.top) || 0,
            left: (info.pos && info.pos.left) || 0
        },
        text: info.text || '',
        color: info.color || 'white',
        id: createId()
    };

    io.emit('create', result);
    db.createTask(result);
    logger.info(`Task[${result.id}] is created.`);
}


function createId() {
    const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
    const max = ALPHABET.length;
    const abc = () => ALPHABET[Math.floor(Math.random() * max)];
    return Date.now() + abc() + abc() + abc();
}

/**
 * @param {{ ids: string[] }} message
 */
function deleteTask(message) {
    io.emit('delete', message);

    const { ids } = message;
    db.deleteTask(ids);
    logger.info(`Task[${ids.join(', ')}] is deleted.`);
}

/**
 * @param {{ ids: string[], color?: string }} message 
 */
function changeColor(message) {
    io.emit('color', message);

    const { ids, color } = message;
    db.changeColor(ids, color);
    logger.info(`Task[${ids.join(',')}] color changed: ${JSON.stringify(color)}`);
}

/**
 * @param {{ id: string, text: string }} message 
 */
function editText(message) {
    io.emit('text', message);

    const { id, text } = message;
    db.editText(id, text);
    logger.info(`Task[${id}] text changed: "${text}"`);
}

/**
 * @param {{ tasks: { id: string, pos: { top: number, left: number }}[] }} message 
 */
function move(message) {
    io.emit('move', message);

    const { tasks } = message;
    db.moveTask(tasks);
    logger.info(`Task moved: ${JSON.stringify(tasks)}`);
}

/**
 * @param {{ ids: string[] }} message 
 */
function updateToFront(message) {
    io.emit('tofront', message);

    const { ids } = message;
    db.updateToFront(ids);
    logger.info(`Task[${ids.join(', ')}] changed: to top.`);
}
