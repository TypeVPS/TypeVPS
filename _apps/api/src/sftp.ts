import SFTP from 'ssh2-sftp-client'
import { ENV } from './env'


export const sftpClient = new SFTP()

const ensureConnected = async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const isConnected = !!sftpClient.sftp
    console.log('isConnected', isConnected)
    if (!isConnected) {
        await sftpClient.connect({
            host: ENV.CLOUD_INIT_SNIPPETS_SERVER_HOST,
            port: 22,
            username: ENV.CLOUD_INIT_SNIPPETS_SERVER_USER,
            password: ENV.CLOUD_INIT_SNIPPETS_SERVER_PASSWORD
        })
    }
}

const list = async (path: string) => {
    await ensureConnected()
    return sftpClient.list(path)
}

const mkdir = async (path: string, recursive?: boolean) => {
    await ensureConnected()
    return sftpClient.mkdir(path, recursive)
}

const put = async (input: string | Buffer | NodeJS.ReadableStream, remoteFilePath: string, options?: SFTP.TransferOptions | undefined) => {
    await ensureConnected()
    return sftpClient.put(input, remoteFilePath, options)
}

const rename = async (fromPath: string, toPath: string) => {
    await ensureConnected()
    return sftpClient.rename(fromPath, toPath)
}

const fastPut = async (localPath: string, remoteFilePath: string, options?: SFTP.FastPutTransferOptions) => {
    await ensureConnected()
    return sftpClient.fastPut(localPath, remoteFilePath, options)
}

export default {
    list,
    put,
    fastPut,
    mkdir,
    rename
}