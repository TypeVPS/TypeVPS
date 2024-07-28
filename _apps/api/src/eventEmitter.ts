

import EventEmitter from "events"
import { pinoLogger } from "./log"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

const logger = pinoLogger.child({ module: "eventEmitter" })
export class TypedEventEmitter<TEvents extends Record<string, Any>> {
	private emitter = new EventEmitter()

	emit<TEventName extends keyof TEvents & string>(
		eventName: TEventName,
		...eventArg: TEvents[TEventName]
	) {
		this.emitter.emit(eventName, ...(eventArg as []))
	}

	on<TEventName extends keyof TEvents & string>(
		eventName: TEventName,
		handler: (...eventArg: TEvents[TEventName]) => void,
	) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.emitter.on(eventName, handler as Any)
	}

	off<TEventName extends keyof TEvents & string>(
		eventName: TEventName,
		handler: (...eventArg: TEvents[TEventName]) => void,
	) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.emitter.off(eventName, handler as Any)
	}

	once<TEventName extends keyof TEvents & string>(
		eventName: TEventName,
		handler: (...eventArg: TEvents[TEventName]) => void,
	) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		this.emitter.once(eventName, handler as Any)
	}

	// onceAwaited
	onceAwaited<TEventName extends keyof TEvents & string>(
		eventName: TEventName,
		timeOut = 5000,
		condition?: (...eventArg: TEvents[TEventName]) => boolean,
	) {
		return new Promise<TEvents[TEventName]>((resolve, reject) => {
			const onEvent = (...args: Any[]) => {
				resolve(args as TEvents[TEventName])
			}

			const timeoutTimeout = setTimeout(() => {
				this.emitter.removeListener(eventName, onEvent)

				reject(new Error(`Event ${eventName} timed out`))
			}, timeOut)

			this.emitter.on(eventName, (...args: Any[]) => {
				if (!condition || condition(...(args as TEvents[TEventName]))) {
					this.emitter.removeListener(eventName, onEvent)
					clearTimeout(timeoutTimeout)
					resolve(args as TEvents[TEventName])
				}
			})
		})
	}
}

const MANAGED_INTERVALS: Record<
	string,
	{
		interval?: NodeJS.Timeout
		status: {
			status: "ok" | "error"
			error?: unknown
			date: Date
		}[]
		originalFn: () => Promise<void>
		runFn: () => void
	}
> = {}
export const createManagedInterval = async (opts: {
	name: string
	second?: number
	minute?: number
	hour?: number
	runOnStart?: boolean
	fn: () => Promise<void>
}) => {
	if (MANAGED_INTERVALS[opts.name]?.interval) {
		logger.warn(`Interval ${opts.name} already exists. Clearing it.`)
		clearInterval(MANAGED_INTERVALS[opts.name].interval)
	}

	const run = () => {
		logger.debug(`Running ${opts.name}`)

		opts.fn().then(() => {
			MANAGED_INTERVALS[opts.name].status.push({
				status: "ok",
				date: new Date(),
			})
		}).catch((error) => {
			MANAGED_INTERVALS[opts.name].status.push({
				status: "error",
				error: error,
				date: new Date(),
			})
			logger.error(error)
		})

		return void 1;
	}

	logger.debug(`Creating interval ${opts.name}`)
	MANAGED_INTERVALS[opts.name] = {
		originalFn: opts.fn,
		runFn: run,
		status: [],
	}

	if (opts.runOnStart) {
		await opts.fn()
	}

	const runIn =
		1000 * (opts.second ?? 0) +
		1000 * 60 * (opts.minute ?? 0) +
		1000 * 60 * 60 * (opts.hour ?? 0)

	MANAGED_INTERVALS[opts.name].interval = setInterval(run, runIn)
	logger.debug(`Interval ${opts.name} set. Running in ${runIn}ms`)
}
