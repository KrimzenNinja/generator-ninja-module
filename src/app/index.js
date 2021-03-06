import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import askName from 'inquirer-npm-name';
import Generator from 'yeoman-generator';
import tmp from 'tmp';
import ora from 'ora';
import { Clone } from 'nodegit';

export default class extends Generator {
    answers;

    constructor(...args) {
        super(...args);
        this.argument('name', { type: String, required: false });
    }

    getGitHubUsername = () =>
        new Promise(resolve => {
            // istanbul ignore next
            try {
                this.user.github.username((err, username) => resolve(username));
            } catch (e) {
                resolve('');
            }
        });

    async prompting() {
        let name = this.options.name;
        if (!name) {
            const obj = await askName(
                {
                    name: 'name',
                    message: 'What do you want to name your module?',
                    default: _.kebabCase(this.appname)
                },
                this
            );
            name = obj.name;
        }

        const props = await this.prompt([
            {
                name: 'description',
                message: 'What is the description of your module?',
                default: 'An awesome module'
            },
            {
                name: 'githubUsername',
                message: 'What is your GitHub username or organization?',
                default: this.getGitHubUsername
            },
            {
                name: 'repository',
                message: 'What is the repository of your module?',
                default: ({ githubUsername }) => `${githubUsername}/${name}`
            },
            {
                name: 'homepage',
                message: 'What is the homepage of your module?',
                default: ({ repository }) => `https://github.com/${repository}`
            },
            {
                name: 'authorName',
                message: 'What is your name?',
                default: this.user.git.name()
            },
            {
                name: 'authorEmail',
                message: 'What is your email?',
                default: this.user.git.email()
            },
            {
                name: 'authorUrl',
                message: 'What is your homepage?',
                default: ({ githubUsername }) => `https://github.com/${githubUsername}`
            }
        ]);

        this.answers = { name, ...props };
    }

    async writing() {
        const repository = 'https://github.com/KrimzenNinja/krimzen-ninja-module-template';
        const { name: cwd } = tmp.dirSync();
        const spinner = ora(`Cloning ${repository} ...`).start();
        await Clone(repository, cwd);
        spinner.stop();
        const ignore = ['**/.git/**', 'README.md'];
        const files = glob.sync('**/*', { cwd, ignore, dot: true });
        const repoPath = (...args) => path.join(cwd, ...args);

        this.fs.copyTpl(this.templatePath('README.md'), this.destinationPath('README.md'), this.answers);

        files.forEach(file => {
            if (fs.statSync(repoPath(file)).isDirectory()) return;
            this.fs.copy(repoPath(file), this.destinationPath(file));
            const contents = this.fs
                .read(this.destinationPath(file))
                .replace(/https:\/\/github.com\/KrimzenNinja\/krimzen-ninja-module-template/g, this.answers.homepage)
                .replace(/https:\/\/github.com\/eXigentCoder/g, this.answers.authorUrl)
                .replace(/KrimzenNinja\/krimzen-ninja-module-template/g, this.answers.repository)
                .replace(/krimzen-ninja-module-template/g, this.answers.name)
                .replace(/potz666@gmail.com/g, this.answers.authorEmail)
                .replace(/eXigentCoder/g, this.answers.githubUsername)
                .replace(/Ryan Kotzen/g, this.answers.authorName)
                .replace(/Template project for building KrimZen Ninja npm templates/g, this.answers.description);
            this.fs.write(this.destinationPath(file), contents);
        });
    }
}
