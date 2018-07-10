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
import * as yeoman from 'yeoman-environment';
import { TheiaYeomanAdapter } from './theia-yeoman-adapter';

/**
 * Entry point of the plug-in.
 * Once starting the plug-in, register a command to start Yeoman wizard.
 */
export function start() {
    const yeomanWizardCommand = {
        id: 'theia-yeoman-plugin-wizard',
        label: "Yeoman Wizard"
    };

    theia.commands.registerCommand(yeomanWizardCommand, (...args: any[]) => {
        showWizard();
    });

}

/*
 * Show the wizard
*/
function showWizard() {
    const workspaceFolders = theia.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        theia.window.showErrorMessage('No workspace opened, Need to open a workspace first');
        return;
    }

    // grab first workspace
    const currentWorkspace = workspaceFolders[0];

    const yeomanOpts: any = {};
    yeomanOpts.cwd = currentWorkspace.uri.path;

    const yeomanEnvironment = yeoman.createEnv(undefined, yeomanOpts, new TheiaYeomanAdapter());

    yeomanEnvironment.lookup(() => {

        const generatorsMeta: any[] = yeomanEnvironment.getGeneratorsMeta();

        if (!generatorsMeta || Object.keys(generatorsMeta).length === 0) {
            theia.window.showErrorMessage('Unable to launch a yeoman wizard as no yeoman generators are installed.');
            return;
        } else if (Object.keys(generatorsMeta).length === 1) {
            // Only one item, let directly run this generator
            runEnvironment(Object.keys(generatorsMeta)[0]);
        } else {

            const quickPickOption: theia.QuickPickOptions = {
                placeHolder: 'Select Yeoman generator'
            };

            const quickPickItems: theia.QuickPickItem[] = [];

            Object.keys(generatorsMeta).forEach((key: any) => {
                const value = generatorsMeta[key];
                const item: theia.QuickPickItem = {
                    label: key,
                    description: '',
                    detail: value.resolved
                };
                quickPickItems.push(item);
            });

            theia.window.showQuickPick(quickPickItems, quickPickOption).then((pickedItem: theia.QuickPickItem | undefined) => {

                if (pickedItem === undefined) {
                    theia.window.showErrorMessage('No generator selected. Aborting.');
                    return;
                }
                runEnvironment(pickedItem.label);
            });
        }

    });

    function runEnvironment(name: string) {
        yeomanEnvironment.run(name, (err: any) => {
            if (err) {
                theia.window.showErrorMessage(err);
            }
            theia.window.showInformationMessage("Yeoman generator successfully ended.");
        });
    }

}
