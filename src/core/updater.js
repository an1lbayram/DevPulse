import { spawn } from 'child_process';
import { TOOLS } from '../config/tools.js';
import { validateCommandParts } from './security.js';
import logger from './logger.js';

function quoteCmdExeArg(arg) {
    const s = String(arg);
    if (!s.includes(' ') && !s.includes('"')) return s;
    return `"${s.replace(/"/g, '\\"')}"`;
}

function buildCmdStringForCmdExe(cmd, args = []) {
    return [cmd, ...(args || [])].map(quoteCmdExeArg).join(' ');
}

// UAC elevasyonu gerektiren komutları PowerShell ile yönetici olarak çalıştır
function runElevatedCmd(cmd, args, onProgress) {
    return new Promise((resolve, reject) => {
        if (!validateCommandParts(cmd, args)) {
            return reject(new Error('Command blocked by security policy'));
        }

        const cmdString = buildCmdStringForCmdExe(cmd, args);
        // PowerShell'de Start-Process ile UAC tetikleyerek yükseltiriz
        // Çıktıyı geçici bir log dosyasına yazıp ardından okuyoruz
        const escapedCmd = cmdString.replace(/'/g, "''");
        // NOT: PowerShell'deki kaçış karakteri ` (backtick) JS template literal'ını bozabileceği için
        // script'i template literal yerine satır satır birleştiriyoruz.
        const psScript = [
            `$cmdString = '${escapedCmd}'`,
            '$logFile = "$env:TEMP\\devpulse_choco_update.log"',
            '$errFile = "$env:TEMP\\devpulse_choco_error.log"',
            '$arg = "/c $cmdString 1> `"$logFile`" 2> `"$errFile`""',
            '$proc = Start-Process cmd.exe -ArgumentList $arg -Verb RunAs -Wait -PassThru',
            'exit $proc.ExitCode'
        ].join('\n');

        onProgress(`[DevPulse] Requesting Administrator privileges via UAC...\n`);
        onProgress(`[DevPulse] Running: ${cmdString}\n`);
        logger.info(`[UPDATER ELEVATED] Running: ${cmdString}`);

        const child = spawn('powershell.exe', ['-NoProfile', '-Command', psScript], {
            shell: false
        });

        child.stdout.on('data', (data) => {
            const txt = data.toString();
            logger.info(`[ELEVATED STDOUT] ${txt.trim()}`);
            onProgress(txt);
        });

        child.stderr.on('data', (data) => {
            const txt = data.toString();
            logger.warn(`[ELEVATED STDERR] ${txt.trim()}`);
            onProgress(txt);
        });

        child.on('close', (code) => {
            if (code === 0) {
                onProgress(`\n[DevPulse] Elevated command completed successfully.\n`);
                resolve({ success: true, code });
            } else {
                onProgress(`\n[DevPulse] Elevated command failed (Exit code: ${code}).\n`);
                reject(new Error(`Elevated process exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            logger.error(`[ELEVATED ERROR] ${err.message}`);
            onProgress(`\nError: ${err.message}\n`);
            reject(err);
        });
    });
}

function runUpdateCmd(cmd, args, onProgress) {
    return new Promise((resolve, reject) => {
        if (!validateCommandParts(cmd, args)) {
            return reject(new Error('Command blocked by security policy'));
        }

        const cmdString = buildCmdStringForCmdExe(cmd, args);
        logger.info(`Running update command: ${cmdString}`);
        onProgress(`Starting: ${cmdString}\n`);

        const child = spawn(cmd, args, { shell: false });

        child.stdout.on('data', (data) => {
            const txt = data.toString();
            logger.info(`[UPDATER STDOUT] ${txt.trim()}`);
            onProgress(txt);

            // Otomatik 'Evet' yanıtlayıcısı
            if (txt.includes('[Y]es') || txt.includes('(Y/N)') || txt.includes('[Y]')) {
                child.stdin.write('Y\n');
                logger.info('[UPDATER STDIN] Automatically answered YES to prompt');
                onProgress('[DevPulse: Automatically answered YES to prompt]\n');
            }
        });

        child.stderr.on('data', (data) => {
            const txt = data.toString();
            logger.warn(`[UPDATER STDERR] ${txt.trim()}`);
            onProgress(txt);
        });

        child.on('close', (code) => {
            if (code === 0) {
                onProgress(`\nDone. (Exit code: ${code})\n`);
                resolve({ success: true, code });
            } else {
                onProgress(`\nFailed. (Exit code: ${code})\n`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            logger.error(`[UPDATER ERROR] ${err.message}`);
            onProgress(`\nExecution Error: ${err.message}\n`);
            reject(err);
        });
    });
}

async function updateTool(toolId, onProgress = () => {}) {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) throw new Error('Tool not found');

    if (!tool.update) {
        throw new Error(`Auto-update not supported for ${tool.name}. Please update manually.`);
    }

    const { cmd, args } = tool.update;

    // Yönetici yetkisi gerektiren araçlar için UAC ile yükseltilmiş çalıştır
    if (tool.elevateRequired) {
        return await runElevatedCmd(cmd, args, onProgress);
    }

    return await runUpdateCmd(cmd, args, onProgress);
}

export { updateTool, runUpdateCmd, runElevatedCmd, buildCmdStringForCmdExe };