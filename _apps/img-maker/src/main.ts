import axios from "axios"
import { randomUUID } from "crypto"
import fs from "fs"
import { tmpdir } from "os"
import path from "path"
import { ostring } from "zod"
import FormData from "form-data"
import { rm } from "fs/promises"

const IMAGES = [
    // Ubuntu Server 23.10 (Mantic Minotaur)
    {
        name: 'Ubuntu Server 23.10 (Mantic Minotaur)',
        url: 'https://cloud-images.ubuntu.com/mantic/current/mantic-server-cloudimg-amd64.img',
    },

    // Ubuntu Server 23.04 (Lunar Lobster)
    {
        name: 'Ubuntu Server 23.04 (Lunar Lobster)',
        url: 'https://cloud-images.ubuntu.com/lunar/current/lunar-server-cloudimg-amd64.img',
    },

    // Ubuntu Server 22.10 (Kinetic Kudu)
    {
        name: 'Ubuntu Server 22.10 (Kinetic Kudu)',
        url: 'https://cloud-images.ubuntu.com/kinetic/current/kinetic-server-cloudimg-amd64.img',
    },

    //  Ubuntu Server 22.04 LTS (Focal Fossa)
    {
        name: 'Ubuntu Server 22.04 LTS (Focal Fossa)',
        url: 'https://cloud-images.ubuntu.com/focal/current/focal-server-cloudimg-amd64.img',
    },

    // Ubuntu Server 20.04 LTS (Jammy Jellyfish)
    {
        name: 'Ubuntu Server 20.04 LTS (Jammy Jellyfish)',
        url: 'https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img',
    },

    // Debian 11 (Bullseye)
    {
        name: 'Debian 11 (Bullseye)',
        url: 'https://cdimage.debian.org/cdimage/cloud/bullseye/latest/debian-11-generic-amd64.qcow2',
    },

    // Debian 12 (bookworm)
    {
        name: 'Debian 12 (bookworm)',
        url: 'https://cdimage.debian.org/cdimage/cloud/bullseye/latest/debian-11-generic-amd64.qcow2',
    }
]

const execAwait = async (command: string) => {
    const { exec } = await import('child_process')
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
            } else {
                resolve({ stdout, stderr })
            }
        })
    })
}

const getUploadLink = async (config: {
    url: string,
    sharedId: string,
},) => {
    const { data } = await axios.get(`${config.url}/api/v2.1/upload-links/${config.sharedId}/upload/`)
    return data.upload_link
}

const seafileUploadFileUploadLink = async (
    config: {
        url: string,
        sharedId: string,
    },
    filePath: string
) => {
    const uploadLink = await getUploadLink(config)
    const fileName = path.basename(filePath)
    // example of uploadLink
    let form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('parent_dir', '/');
    form.append('filename', fileName);
    form.append('replace', 1);

    let response = await axios.post(uploadLink, form, {
        headers: form.getHeaders()
    });
    console.log(response.data);
}

const bytesToHumanSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

async function main() {
    // ensure virt-customize is installed
    try {
        await execAwait('virt-customize --version')
    } catch (e) {
        throw new Error('virt-customize is not installed. Please install libguestfs-tools')
    }

    const seafileConfig = {
        url: 'https://c.auxera.net',
        sharedId: '30c9c293f3b945f3988c'
    }

    // test for invalid images, by asking for file info
    for (const image of IMAGES) {
        const response = await axios.head(image.url)
        if (response.status !== 200) {
            throw new Error(`Invalid image: ${image.name} (${response.status})`)
        }
        console.log(`Image ${image.name} is valid - ${response.headers['content-length']} bytes (${bytesToHumanSize(parseInt(response.headers['content-length'] as string))})`)
    }

    for (const image of IMAGES) {
        console.log(`Downloading ${image.name}...`)
        const response = await axios.get(image.url, {
            responseType: 'stream'
        })

        // replace all non alphanumeric characters with underscores
        const fileId = image.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_' + Math.floor(Date.now() / 1000)
        const filePath = path.join(tmpdir(), `${fileId}.qcow2`)

        const writer = fs.createWriteStream(filePath)

        response.data.pipe(writer)
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })

        console.log(`Downloaded ${image.name} to ${filePath}, customizing...`)
        // use virt-customize to customize the image
        await execAwait(`virt-customize -a ${filePath} --install qemu-guest-agent`)

        // upload the image to the cloud
        console.log(`Uploading ${image.name} to the cloud...`)
        await seafileUploadFileUploadLink(seafileConfig, filePath)

        // delete the image
        console.log(`Deleting ${image.name}...`)
        await rm(filePath)
    }
}

main().catch(console.error)