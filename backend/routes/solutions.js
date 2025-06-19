import express from 'express';
import db from "../middleware/db.js";
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const router = express.Router();

async function fetch_testcases(questionId) {
    const query = 'SELECT testcases FROM questions WHERE quesid = $1';
    const { rows } = await db.query(query, [questionId]);
    return rows.length ? rows[0].testcases : null;
}

function getDockerCommand(language, codeFilePath, inputFilePath) {
    const langMap = {
        cpp: {
            image: 'gcc',
            compile: `g++ ${codeFilePath} -o /app/a.out`,
            run: `/app/a.out < ${inputFilePath}`
        },
        python: {
            image: 'python:3',
            run: `python ${codeFilePath} < ${inputFilePath}`
        },
        javascript: {
            image: 'node',
            run: `node ${codeFilePath} < ${inputFilePath}`
        }
    };

    const langConfig = langMap[language.toLowerCase()];
    if (!langConfig) throw new Error('Unsupported language');

    // Absolute host path for temp dir
    const hostTempPath = path.resolve('temp');

    const base = `docker run --rm -v "${hostTempPath}:/app" -w /app ${langConfig.image}`;
    if (langConfig.compile) {
        return `${base} sh -c "${langConfig.compile} && ${langConfig.run}"`;
    }
    return `${base} sh -c "${langConfig.run}"`;
}


async function runCodeInDocker({ language, solution, testcaseInput }) {
    const uid = Date.now();
    const tempDir = path.resolve('temp');
    const extensionMap = {
        cpp: 'cpp',
        python: 'py',
        javascript: 'js'
    };
    const ext = extensionMap[language.toLowerCase()];
    if (!ext) throw new Error('Unsupported language');

    const codeFileName = `code-${uid}.${ext}`;
    const inputFileName = `input-${uid}.txt`;
    const codeFilePath = path.join(tempDir, codeFileName);
    const inputFilePath = path.join(tempDir, inputFileName);

    try {
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(codeFilePath, solution);
        await fs.writeFile(inputFilePath, testcaseInput);

        const command = getDockerCommand(language, `/app/${codeFileName}`, `/app/${inputFileName}`);
        const { stdout, stderr } = await execAsync(command, { timeout: 5000 });

        return {
            output: stdout.trim(),
            error: stderr.trim() || null
        };
    } catch (err) {
        return { output: '', error: err.message };
    } finally {
        // Cleanup
        await fs.rm(codeFilePath, { force: true });
        await fs.rm(inputFilePath, { force: true });
    }
}

router.post('/run', async (req, res) => {
    const { userId, questionId, language, solution, testcases } = req.body;
    try {
        const result = await runCodeInDocker({
            language,
            solution,
            testcaseInput: testcases && testcases.length ? testcases[0].input : ''
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit solution, fetch all testcases, run and return results
router.post('/submit', async (req, res) => {
    const { userId, questionId, language, solution } = req.body;
    try {
        const testcasesJson = await fetch_testcases(questionId);
        if (!testcasesJson) return res.status(404).json({ error: 'Question not found' });

        let testcases;
        try {
            testcases = typeof testcasesJson === 'string' ? JSON.parse(testcasesJson) : testcasesJson;
        } catch {
            return res.status(500).json({ error: 'Testcases format invalid' });
        }

        const results = [];
        for (const tc of testcases) {
            const result = await runCodeInDocker({
                language,
                solution,
                testcaseInput: tc.input
            });
            result.expected_output = tc.expected_output;
            results.push(result);
        }
        res.json({ results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// const res = await runCodeInDocker({
//     language: "cpp",
//     solution: `
//     #include <iostream>
//     using namespace std;
//     int main() {
//         int a, b;
//         cin >> a >> b;
//         cout << (a + b) << endl;
//         return 0;
//     }
//   `,
//     testcaseInput: "2 3"
// });
// console.log(res);
export default router;
