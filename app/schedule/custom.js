'use strict';

const path = require('path');
const moment = require('moment');
const fs = require('mz/fs');
const debug = require('debug')('egg-logrotator:day_rotator');

// rotate log by day
// rename from foo.log to foo.log.YYYY-MM-DD
function getRotator(app) {
    class CustomRotator extends app.LogRotator {
        constructor(options) {
            super(options);
            this.filesRotateBySize = this.app.config.logrotator.filesRotateBySize || [];
            this.filesRotateByHour = this.app.config.logrotator.filesRotateByHour || [];
        }

        walkLoggerFile(loggers) {
            const files = [];
            for (const key in loggers) {
                if (!loggers.hasOwnProperty(key)) {
                    continue;
                }
                const registeredLogger = loggers[key];
                for (const transport of registeredLogger.values()) {
                    const file = transport.options.file;
                    if (file) {
                        files.push(file);
                    }
                }
            }
            return files;
        }

        async getRotateFiles() {
            const files = new Map();
            const logDir = this.app.config.logger.dir;
            const loggers = this.app.loggers;
            const loggerFiles = this.walkLoggerFile(loggers);
            loggerFiles.forEach(file => {
                // support relative path
                if (!path.isAbsolute(file)) file = path.join(logDir, file);
                this._setFile(file, files);
            });

            // Should rotate agent log, because schedule is running under app worker,
            // agent log is the only differece between app worker and agent worker.
            // - app worker -> egg-web.log
            // - agent worker -> egg-agent.log
            const agentLogName = this.app.config.logger.agentLogName;
            this._setFile(path.join(logDir, agentLogName), files);

            // rotateLogDirs is deprecated
            const rotateLogDirs = this.app.config.logger.rotateLogDirs;
            if (rotateLogDirs && rotateLogDirs.length > 0) {
                this.app.deprecate(
                    '[egg-logrotator] Do not use app.config.logger.rotateLogDirs, only rotate core loggers and custom loggers'
                );

                for (const dir of rotateLogDirs) {
                    const exists = await fs.exists(dir);
                    if (!exists) continue;

                    try {
                        const names = await fs.readdir(dir);
                        for (const name of names) {
                            if (!name.endsWith('.log')) {
                                continue;
                            }
                            this._setFile(path.join(dir, name), files);
                        }
                    } catch (err) {
                        this.logger.error(err);
                    }
                }
            }

            return files;
        }

        _setFile(srcPath, files) {
            // don't rotate logPath in filesRotateBySize
            if (this.filesRotateBySize.indexOf(srcPath) > -1) {
                return;
            }

            // don't rotate logPath in filesRotateByHour
            if (this.filesRotateByHour.indexOf(srcPath) > -1) {
                return;
            }

            if (!files.has(srcPath)) {
                // allow 2 minutes deviation
                const targetPath = srcPath.replace(
                    /\.log$/,
                    '-' +
						moment()
						// eslint-disable-next-line no-mixed-spaces-and-tabs
						    .subtract(23, 'hours')

						// eslint-disable-next-line no-mixed-spaces-and-tabs
						    .subtract(58, 'minutes')

						// eslint-disable-next-line no-mixed-spaces-and-tabs
						    .format('YYYY-MM-DD') +
						'.log'
                );
                debug('set file %s => %s', srcPath, targetPath);
                files.set(srcPath, { srcPath, targetPath });
            }
        }
    }
    return new CustomRotator({ app });
}

module.exports = app => {
    const rotator = getRotator(app);
    return {
        // https://github.com/eggjs/egg-schedule
        schedule: {
            type: 'worker', // only one worker run this task
            cron: '1 0 0 * * *', // custom cron, or use interval
        },
        async task() {
            await rotator.rotate();
        },
    };
};
