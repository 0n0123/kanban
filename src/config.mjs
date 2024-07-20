import fs from 'node:fs';
import path from 'node:path';
import log4js from 'log4js';

const logger = log4js.getLogger();

export class Config {
    #contents;
    #currentDir;

    constructor(currentDir) {
        const filePath = path.resolve(currentDir, 'conf', 'config.json');
        this.#currentDir = currentDir;
        this.#contents = JSON.parse(fs.readFileSync(filePath).toString());
        if (this.#contents.port === undefined ||
            this.#contents.port === '' ||
            isNaN(parseInt(this.#contents.port))) {
            logger.error('Invalid port number: ' + this.#contents.port);
            throw new Error('Failed to load configuration.');
        }
    }

    /**
     * 
     * @returns {number}
     */
    getPort() {
        return this.#contents['port'];
    }

    /**
     * 
     * @returns {string}
     */
    getBackupDest() {
        return this.#contents['backup']['dest.dir'];
    }

    /**
     * 
     * @returns {number}
     */
    getBackupIntervalMinutes() {
        return this.#contents['backup']['interval.minutes'];
    }
};