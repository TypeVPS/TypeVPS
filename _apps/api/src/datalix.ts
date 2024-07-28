import axios from "axios";
import { z } from "zod";
import { ENV } from "./env";

const engine = axios.create({
    baseURL: 'https://backend.datalix.de/v1/',
    params: {
        token: ENV.DATALIX_API_KEY
    }
})

// a function to get number from string
const stringToNumberSchema = () => z.string().transform(value => parseFloat(value));


const getDdosIncidents = async () => {
    if (!ENV.DATALIX_VM_IP_SERVICE_ID) {
        throw new Error('DATALIX_VM_IP_SERVICE_ID is not set');
    }

    const schema = z.object({
        data: z.array(
            z.object({
                ip: z.string(),
                mbps: stringToNumberSchema(),
                method: z.string(),
                mode: z.string(),
                pps: stringToNumberSchema(),
                created_on: z.string().transform(value => {
                    const [time, date] = value.split(' ');

                    const [hours, minutes, seconds] = time.split(':');
                    const [day, month, year] = date.split('.');
                    const dateObject = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));

                    return dateObject;
                }),
                processed: z.number()
            })
        ),
        pageInfo: z.object({
            total: z.number(),
            stepsize: z.number(),
            last: z.number()
        })
    })

    const { data } = await engine.get<unknown>(`service/${ENV.DATALIX_VM_IP_SERVICE_ID}/incidents`);
    const parsed = schema.parse(data);

    return parsed;
}

export default {
    getDdosIncidents
}