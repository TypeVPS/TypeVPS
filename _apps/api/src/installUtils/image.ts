import { InstallTemplate } from "@typevps/db";
import axios from "axios";
import crypto, { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import sftp from "@/sftp";
import { LiveLogger } from "../liveLogger";
import path from "path";
import { exec } from "node:child_process";
import { proxmoxApi, proxmoxUtils } from "@typevps/proxmox";
import proxmox from "@/proxmox";

export const getImageName = (url: string) => {
    let name = crypto.createHash('sha256').update(url).digest('hex');
    name += '.img'

    return name;
}

const execAsync = (cmd: string) => {
    return new Promise<string>((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(stdout);
        })
    })
}

export const getImageStorage = (node: string) => {
    return 'local'
}

export const ensureTemplateImageExists = async (template: {
    qcow2Url: string,
    osType: InstallTemplate['osType'],
}, node: string, liveLogger?: LiveLogger) => {
    const imageName = getImageName(template.qcow2Url);

    liveLogger?.log("Checking if image exists...");
    const imageStorage = getImageStorage(node);
    let files = await proxmoxApi.storage.listContentMapped({
        node,
        storage: imageStorage,
    })

    let existingFile = files.find((file) => file.fileName === imageName);
    if (existingFile) {
        liveLogger?.log("Image exists, skipping download");
        return existingFile
    }

    liveLogger?.log("Image does not exist, downloading...");
    const downloadTask = await proxmoxApi.storage.downloadUrl({
        fileName: imageName,
        node,
        storage: imageStorage,
        url: template.qcow2Url,
    })

    liveLogger?.log("Waiting for download to complete...");
    await proxmox.waitForTaskDone(downloadTask.taskId, 600_000);

    liveLogger?.log("Download complete!");
    files = await proxmoxApi.storage.listContentMapped({
        node,
        storage: imageStorage,
    })
    existingFile = files.find((file) => file.fileName === imageName);

    if (!existingFile) {
        throw new Error("Download failed");
    }

    return existingFile;
}