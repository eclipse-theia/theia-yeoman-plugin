/*********************************************************************
* Copyright (c) 2018 Red Hat, Inc.
*
* This program and the accompanying materials are made
* available under the terms of the Eclipse Public License 2.0
* which is available at https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
**********************************************************************/

import * as theia from '@theia/plugin';

/**
 * Adapter for Theia usecase where we can redirect prompting to the Theia UI.
 * @author Florent Benoit
 */
export class TheiaYeomanAdapter {

    protected log: any;
    private outputChannel: theia.OutputChannel;

    constructor() {
        this.outputChannel = theia.window.createOutputChannel('Yeoman Generator');
        this.outputChannel.show(true);
        this.initLogger();
    }

    public prompt(questions: any, callback: any) {

        // grab question
        const question: any = questions[0];

        // what should we send to the user
        const replies: any = {};
        callback = callback || function() { };

        return new Promise((resolve, reject) => {
            const quickPickOption: theia.QuickPickOptions = {
                placeHolder: question.message
            };

            if (question.choices) {
                // question mode
                this.askQuestion(question, quickPickOption, replies, resolve, reject, callback);
            } else {
                const defaultValue = 'boolean' === typeof question.default ? 'y' : question.default;

                // input box
                const inputOption: theia.InputBoxOptions = {
                    prompt: question.message,
                    placeHolder: question.name,
                    ignoreFocusOut: false,
                    password: false,
                    value: defaultValue
                };

                theia.window.showInputBox(inputOption).then((s: string | undefined) => {
                    if (typeof s !== 'undefined') {
                        replies[question.name] = s;
                    } else {
                        replies[question.name] = defaultValue;
                    }
                    callback(replies);
                    resolve(replies);
                });
            }
        });
    }

    /**
     * Asks a question to the user (can have choices or not)
     */
    public askQuestion(question: any,
        option: theia.QuickPickOptions,
        replies: any,
        resolve: (value?: any | PromiseLike<any>) => void,
        reject: (reason?: any) => void, callback: any) {

        const quickPickItems: theia.QuickPickItem[] = [];

        interface CustomQuickPickItem extends theia.QuickPickItem {
            value: any
        }

        question.choices.forEach((choice: any) => {
            const item: CustomQuickPickItem = {
                label: choice.name,
                description: '',
                detail: '',
                value: choice.value
            };
            quickPickItems.push(item);
        });

        theia.window.showQuickPick(quickPickItems, option).then((pickedItem: theia.QuickPickItem | undefined) => {
            replies[question.name] = (pickedItem as CustomQuickPickItem).value;
            if (pickedItem !== undefined && resolve !== undefined && resolve !== {}) {
                callback(replies);
                resolve(replies);
            } else {
                this.askQuestion(question, option, replies, resolve, reject, callback);
            }
        });
    }

    /**
     *  Make diff between two content
     * @param actual the actual content
     * @param expected what is expected
     */
    public diff(actual: string, expected: string) {
        theia.window.showErrorMessage('Diff is not handled for now.');
    }

    /**
     * Initialize the logging system. Need to provide several methods for the log object.
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
     * Output the given content on the output channel by prefixing it by prefix value
     * @param prefix the prefix of the line to display
     * @param content the content of the text to display
     */
    protected output(prefix: string, content: string): void {
        this.outputChannel.append(prefix);
        this.outputChannel.appendLine(content);
    }

}
