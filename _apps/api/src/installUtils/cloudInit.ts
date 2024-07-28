import sftp from "@/sftp";
import { InstallTemplateOsType } from "@typevps/db";
import { randomUUID } from "crypto";

export interface CloudInitGeneratorOpts {
    user: {
        username: string;
        password: string;
        sshKeys: string[];
        passwordLessSudo: boolean;
        passwordAuthentication: boolean;
        lockPassword: boolean;
    },
    os: {
        hostname: string;
        updatePackages: boolean;
    }
    type: InstallTemplateOsType
}
export const generateCloudInitConfig = (opts: CloudInitGeneratorOpts) => {
    const sshKeys = opts.user.sshKeys.map((k) => `      - ${k}`).join("\n");
    const sshKeyPart = opts.user.sshKeys.length > 0 ? `    ssh_authorized_keys:\n${sshKeys}` : "";


    // install qemu-guest-agent
    const cloudInit = `#cloud-config
package_update: ${opts.os.updatePackages ? "true" : "false"}
hostname: ${opts.os.hostname}
resize_rootfs: true
package_upgrade: true
ssh_pwauth: ${opts.user.passwordAuthentication ? "true" : "false"}
users:
  - name: ${opts.user.username}
    lock_passwd: ${opts.user.lockPassword ? "true" : "false"}
    passwd: ${opts.user.password}
    sudo: ALL=(ALL) ${opts.user.passwordLessSudo ? "NOPASSWD:ALL" : "ALL"}
    chpasswd: { expire: False }
    shell: /bin/bash
${sshKeyPart}
`;

    return cloudInit;
};

export const generateAndUploadCloudInitConfig = async (opts: CloudInitGeneratorOpts) => {
    // upload via ftp to snippets
    const id = randomUUID()

    await sftp.put(
        Buffer.from(generateCloudInitConfig(opts)),
        `/snippets/${id}.yml`
    )

    return {
        id,
    }
}