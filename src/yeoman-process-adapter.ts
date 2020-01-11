/*********************************************************************
* Copyright (c) 2019 Red Hat, Inc.
*
* This program and the accompanying materials are made
* available under the terms of the Eclipse Public License 2.0
* which is available at https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
**********************************************************************/

import * as theia from '@theia/plugin';
import { ChildProcess } from 'child_process';

const path = require('path');
const fork = require('child_process').fork;

/**
 * Launches a Yeoman Generator in separate node intance.
 * Asks Theia to display prompts and notification messages by request from Yeoman Generator.
 * Prints Yeoman generator logs to dedicated Theia view.
 */
export class YeomanProcessAdapter {

    private outputChannel: theia.OutputChannel;

    private childProcess: ChildProcess | undefined;

    constructor(
        protected extensionPath: string
    ) {
        this.outputChannel = theia.window.createOutputChannel('Yeoman Generator');
        this.run();
    }

    /**
     * Destroys currently running process.
     */
    public destroy() {
        if (this.childProcess) {
            this.childProcess.kill();
        }
    }

    /**
     * Launches separate process.
     */
    private run() {
        const workspaceFolders = theia.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            theia.window.showErrorMessage('No workspace opened, Need to open a workspace first');
            return;
        }

        this.outputChannel.show(true);

        // grab first workspace
        const currentWorkspace = workspaceFolders[0];

        // start Yeoman generator in separate node instance
        const process = path.resolve(this.extensionPath, 'lib/yeoman-process.js');

        const params: any[] = [];
        const options = {
            cwd: currentWorkspace.uri.path,
            stdio: ['pipe', process.stdout, process.stderr, 'ipc']
        };

        const child = fork(process, params, options);

        child.on('message', this.onMessage);

        child.stdout.on('data', (data: any) => {
            this.processOutput({
                prefix: '[INFO]',
                message: data as string
            });
        });

        child.stderr.on('data', (data: any) => {
            this.processOutput({
                prefix: '[WARN]',
                message: data as string
            });
        });

        this.childProcess = child;
    }

    /**
     * Handles process message event.
     */
    private onMessage = async (message: any) => {
        try {
            const msg: any = message as {};

            switch (msg.action) {
                case 'output':
                    this.processOutput(msg);
                    return;
                case 'informationMessage':
                    this.processInformationMessage(msg);
                    return;
                case 'errorMessage':
                    this.processErrorMessage(msg);
                    return;
                case 'prompt':
                    this.processPrompt(msg);
                    return;
            }
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Prints a message to the Yeoman generator output view.
     *
     * @param msg object containing message and message prefix
     */
    protected processOutput(msg: any) {
        this.outputChannel.append(msg.prefix);
        this.outputChannel.appendLine(msg.message);
    }

    /**
     * Displays an information notification.
     *
     * @param msg object containing message to be displayed
     */
    protected processInformationMessage(msg: any) {
        theia.window.showInformationMessage(msg.message);
    }

    /**
     * Displays an error notification.
     *
     * @param msg object containing message to be displayed
     */
    protected processErrorMessage(msg: any) {
        theia.window.showErrorMessage(msg.message);
    }

    /**
     * Displays prompt popup.
     *
     * @param msg object containing prompt params
     */
    protected processPrompt(msg: any) {
        const question = msg.question;

        if (question.choices) {
            this.askQuestion(question, msg.promiseId);
        } else {
            this.askValue(question, msg.promiseId);
        }
    }

    /**
     * Displays quick pick menu continint list of answers.
     */
    private askQuestion(question: any, promiseId: number) {
        const replies: any = {};

        const quickPickItems: theia.QuickPickItem[] = [];

        interface CustomQuickPickItem extends theia.QuickPickItem {
            value: any
        }

        question.choices.forEach((choice: any) => {
            const item: CustomQuickPickItem = {
                label: choice.name,
                description: '',
                detail: choice.detail ? choice.detail : undefined,
                value: choice.value ? choice.value : undefined
            };
            quickPickItems.push(item);
        });

        const options: theia.QuickPickOptions = {
            placeHolder: question.message
        };

        theia.window.showQuickPick(quickPickItems, options).then((pickedItem: theia.QuickPickItem | undefined) => {
            replies[question.name] = (pickedItem as CustomQuickPickItem).value;
            this.reply(promiseId, replies);
        });
    }

    /**
     * Displays input popup.
     */
    private askValue(question: any, promiseId: number) {
        const replies: any = {};

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

            this.reply(promiseId, replies);
        });
    }

    /**
     * Replies to the client on prompt request.
     */
    private reply(promiseId: number, replies: any) {
        if (this.childProcess && this.childProcess.send) {
            this.childProcess.send({
                action: 'reply',
                promiseId: promiseId,
                replies: replies
            });
        }
    }

}
