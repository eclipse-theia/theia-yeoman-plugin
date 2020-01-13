/*********************************************************************
* Copyright (c) 2019 Red Hat, Inc.
*
* This program and the accompanying materials are made
* available under the terms of the Eclipse Public License 2.0
* which is available at https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
**********************************************************************/

import * as yeoman from 'yeoman-environment';

const proc = process;

/**
 * Picks from the list and launches a Yeoman generator.
 * Provides the generator methods to log and display the prompt.
 */
export class YeomanProcess {

    protected log: any;

    private promiseId: number = 0;
    private promiseResolvers: { [key: number]: any } = {};

    constructor() {
        // Init adapter logger
        this.initLogger();

        // handle process message event
        proc.on('message', this.onReply);

        // Pick Yeoman generator
        this.pickGenerator();
    }

    /**
     * Initialize the logging system.
     * Need to provide several methods for the log object.
     */
    protected initLogger() {
        this.log = (...args: any[]) => {

            if (args.length > 0) {
                this.output('', args[0]);
            }

            this.log.skip = (...loggerArgs: any[]) => {
                this.output('[SKIP]', loggerArgs[0]);
            };

            this.log.force = (...loggerArgs: any[]) => {
                this.output('[FORCE]', loggerArgs[0]);
            };

            this.log.create = (...loggerArgs: any[]) => {
                this.output('[CREATE]', loggerArgs[0]);
            };

            this.log.invoke = (...loggerArgs: any[]) => {
                this.output('[INVOKE]', loggerArgs[0]);
            };

            this.log.conflict = (...loggerArgs: any[]) => {
                this.output('[CONFLICT]', loggerArgs[0]);
            };

            this.log.identical = (...loggerArgs: any[]) => {
                this.output('[IDENTICAL]', loggerArgs[0]);
            };

            this.log.info = (...loggerArgs: any[]) => {
                this.output('[INFO]', loggerArgs[0]);
            };

            this.log.write = (...loggerArgs: any[]) => {
                this.output('', loggerArgs[0]);
            };

            this.log.writeln = (...loggerArgs: any[]) => {
                this.output('', loggerArgs[0]);
            };

            this.log.ok = (...loggerArgs: any[]) => {
                this.output('[OK]', loggerArgs[0]);
            };

            this.log.error = (...loggerArgs: any[]) => {
                this.output('[ERROR]', loggerArgs[0]);
            };

            return this.log;
        };
    }

    /**
     * Asks plugin to print to the Yaml Generator output view.
     *
     * @param prefix message prefix
     * @param message mesage
     */
    public output(prefix: string, message: string) {
        if (proc.send) {
            proc.send({
                action: 'output',
                prefix: prefix,
                message: message
            });
        }
    }

    /**
     * Asks plugin to display Information message.
     *
     * @param message message to display
     */
    public showInformationMessage(message: any) {
        if (proc.send) {
            proc.send({
                action: 'informationMessage',
                message: message
            });
        }
    }

    /**
     * Asks plugin to display Error message.
     *
     * @param message message to display
     */
    public showErrorMessage(message: any) {
        if (proc.send) {
            proc.send({
                action: 'errorMessage',
                message: message
            });
        }
    }

    /**
     * Handles the prompt request.
     * Asks the plugin to display input or quick pick popup.
     *
     * @param questions a list of questions. An array soud have one question to be compatible
     *                  with Yeoman Environment.
     */
    public prompt(questions: any): Promise<any> {
        this.promiseId++;

        const question: any = questions[0];
        return new Promise<any>((resolve, reject) => {
            this.promiseResolvers[this.promiseId] = resolve;

            if (proc.send) {
                proc.send({
                    action: 'prompt',
                    promiseId: this.promiseId,
                    question: question
                });
            }
        });
    }

    /**
     * Handles a message event sent by main plugin thread.
     * It must be always a reply on a prompt request.
     */
    onReply = async (message: any) => {
        const msg: any = message as {};
        if ('reply' === msg.action) {
            const resolve = this.promiseResolvers[msg.promiseId];
            if (resolve) {
                resolve(msg.replies);
            }
        }
    }

    /**
     * Perform seatching of available Yeoman generators.
     * Displays a quck pick menu with a list of available generators.
     */
    private pickGenerator() {
        const yeomanEnvironment = yeoman.createEnv(undefined, {}, this);
        yeomanEnvironment.lookup(() => {

            const generatorsMeta: any[] = yeomanEnvironment.getGeneratorsMeta();

            if (!generatorsMeta || Object.keys(generatorsMeta).length === 0) {
                this.showErrorMessage('Unable to launch a yeoman wizard as no yeoman generators are installed.');
                return;
            } else if (Object.keys(generatorsMeta).length === 1) {
                // Only one item, let directly run this generator
                this.runGenerator(yeomanEnvironment, Object.keys(generatorsMeta)[0]);
            } else {
                const question: any = {};
                question.message = 'Select Yeoman generator';
                question.name = 'generator';
                question.choices = [];

                Object.keys(generatorsMeta).forEach((key: any) => {
                    const generator = generatorsMeta[key];
                    question.choices.push({
                        name: key,
                        value: key,
                        detail: generator.resolved
                    });
                });

                const questions = [question];

                this.prompt(questions).then(replies => {
                    const generator = replies['generator'];
                    this.runGenerator(yeomanEnvironment, generator);
                });
            }
        });
    }

    private runGenerator(yeomanEnvironment: any, generator: string) {
        yeomanEnvironment.run(generator, (err: any) => {
            if (err) {
                this.showErrorMessage(err);
            }

            this.showInformationMessage('Yeoman generator successfully ended.');
            proc.exit();
        });
    }

}

new YeomanProcess();
