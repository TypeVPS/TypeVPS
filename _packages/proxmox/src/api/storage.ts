import { z } from "zod"
import { zodGet } from "./base"
import { engine } from "../proxmoxApi"

const downloadUrl = async (
    opts: {
        node: string,
        storage: string,
        url: string,
        fileName: string,
    }) => {
    const { data, status, statusText } = await engine.post(`nodes/${opts.node}/storage/${opts.storage}/download-url`, {
        filename: opts.fileName,
        content: 'iso',
        url: opts.url,
        'verify-certificates': 0,
    })
    console.log(opts, data)

    if (status !== 200) {
        throw new Error(`Failed to download image: ${statusText}`)
    }

    const schema = z.object({
        data: z.string()
    })

    return { taskId: schema.parse(data).data }
}

const listContent = async (opts: {
    node: string,
    storage: string,
}) => {
    const schema = z.object({
        data: z.array(
            z.union([
                z.object({
                    format: z.string(),
                    ctime: z.number(),
                    volid: z.string(),
                    size: z.number(),
                    content: z.string()
                }),
                z.object({
                    format: z.string(),
                    ctime: z.number(),
                    volid: z.string(),
                    content: z.string(),
                    size: z.number()
                }),
                z.object({
                    size: z.number(),
                    content: z.string(),
                    ctime: z.number(),
                    volid: z.string(),
                    format: z.string()
                })
            ])
        )
    })

    const data = await zodGet(`nodes/${opts.node}/storage/${opts.storage}/content`, schema)
    return data.data
}

const listContentMapped = async (opts: {
    node: string,
    storage: string,
}) => {
    const data = await listContent(opts)

    return data.map((item) => {
        const fileName = item.volid.split('/').pop()
        const storage = item.volid.split('/')[0]
        const fullPath = item.volid

        if (!fileName) {
            throw new Error(`Failed to parse file name from ${item.volid}`)
        }

        return {
            size: item.size,
            content: item.content,
            fullPath,
            fileName,
            storage,
            directPath: `/var/lib/vz/template/iso/${fileName}`,
        }
    })
}

export default {
    downloadUrl,
    listContent,
    listContentMapped
}