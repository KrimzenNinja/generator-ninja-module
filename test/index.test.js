import path from 'path';
import fs from 'fs';
import helpers from 'yeoman-test';
import assert from 'yeoman-assert';

// eslint-disable-next-line no-undef
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

jest.mock('inquirer-npm-name', () => (prompt, inquirer) => inquirer.prompt(prompt));

const run = () => helpers.run(path.join(__dirname, '../src/app'));

describe('app', () => {
    const files = [
        'src/index.js',
        'test/basic.unit.js',
        '.babelrc',
        '.editorconfig',
        '.eslintrc',
        '.flowconfig',
        '.gitignore',
        'LICENSE',
        'README.md',
        'package.json'
    ];

    it('copies files properly', async () => {
        await run();
        assert.file(files);
    });

    it('copies files passing name as argument', async () => {
        const dir = await run().withOptions({ name: 'generator-node' });
        assert.file(files);
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json')));
        expect(pkg.name).toBe('generator-node');
    });
});
