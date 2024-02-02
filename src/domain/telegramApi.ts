import axios from 'axios'

const BOT_TOKENS = {
    harmony0bot: process.env.BOT_TOKEN_1,
    harmony1bot: process.env.BOT_TOKEN_2,
    FrankEWTestBot: process.env.BOT_TOKEN_3,
}

export interface GetFileResult {
    file_id: string
    file_path: string
    file_size: number
    file_unique_id: string
}

export const telegramApi = {
    getImageInfo: async (fileId: string, botId: string): Promise<GetFileResult> => {
        try {
            const url = `https://api.telegram.org/bot${BOT_TOKENS[botId]}`

            const { data } = await axios.post(`${url}/getFile`, { file_id: fileId })
            return data.result
        } catch (e) {
            console.log(e)
            return null
        }
    },
    getImgUrl: (filePath: string, botId: string): string => {
        return `https://api.telegram.org/file/bot${BOT_TOKENS[botId]}/${filePath}`
    },
    loadFile: async (url: string): Promise<string> => {
        return await axios
            .get(url, { responseType: 'arraybuffer' })
            .then(response => Buffer.from(response.data, 'binary').toString('base64'))
    }
}