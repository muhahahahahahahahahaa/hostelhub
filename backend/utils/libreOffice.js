const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const LIBREOFFICE_WORK_DIR = path.join(os.tmpdir(), "hostelhub-libreoffice");
const LIBREOFFICE_PROFILE_DIR = path.join(LIBREOFFICE_WORK_DIR, "profile");
const LIBREOFFICE_CACHE_DIR = path.join(LIBREOFFICE_WORK_DIR, "cache");
const LIBREOFFICE_CONFIG_DIR = path.join(LIBREOFFICE_WORK_DIR, "config");
const LIBREOFFICE_RUNTIME_DIR = path.join(LIBREOFFICE_WORK_DIR, "runtime");

const ensureLibreOfficeDirs = async () => {
    await Promise.all([
        fs.promises.mkdir(LIBREOFFICE_PROFILE_DIR, { recursive: true }),
        fs.promises.mkdir(LIBREOFFICE_CACHE_DIR, { recursive: true }),
        fs.promises.mkdir(LIBREOFFICE_CONFIG_DIR, { recursive: true }),
        fs.promises.mkdir(LIBREOFFICE_RUNTIME_DIR, { recursive: true, mode: 0o700 }),
    ]);
};

const convertToPdf = async ({ sourcePath, outputDir }) => {
    await ensureLibreOfficeDirs();

    return execFileAsync(
        "libreoffice",
        [
            "--headless",
            "--nologo",
            "--nofirststartwizard",
            `-env:UserInstallation=file://${LIBREOFFICE_PROFILE_DIR}`,
            "--convert-to",
            "pdf",
            "--outdir",
            outputDir,
            sourcePath,
        ],
        {
            env: {
                ...process.env,
                HOME: LIBREOFFICE_WORK_DIR,
                XDG_CACHE_HOME: LIBREOFFICE_CACHE_DIR,
                XDG_CONFIG_HOME: LIBREOFFICE_CONFIG_DIR,
                XDG_RUNTIME_DIR: LIBREOFFICE_RUNTIME_DIR,
            },
            timeout: 60000,
        }
    );
};

module.exports = {
    convertToPdf,
};
