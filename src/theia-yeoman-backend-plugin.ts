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

import { YeomanProcessAdapter } from './yeoman-process-adapter';

/**
 * Entry point of the plug-in.
 * Once starting the plug-in, register a command to start Yeoman wizard.
 */
export function start(context: theia.PluginContext) {
    const yeomanWizardCommand = {
        id: 'theia-yeoman-plugin-wizard',
        label: "Yeoman Wizard"
    };

    theia.commands.registerCommand(yeomanWizardCommand, (...args: any[]) => {
        showWizard(context);
    });
}

let yeoman: YeomanProcessAdapter | undefined;

function showWizard(context: theia.PluginContext) {
    if (yeoman) {
        yeoman.destroy();
    }

    yeoman = new YeomanProcessAdapter((context as any).extensionPath);
}
