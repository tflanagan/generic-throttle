'use strict';

/* Types */
type PendingRequest = {
	resolve: Function;
	reject: Function;
	fn: Function;
};

/* Throttle */
export class Throttle {

	protected _tick: NodeJS.Timeout | undefined = undefined;
	protected _nRequests: number = 0;
	protected _times: number[] = [];
	protected _pending: PendingRequest[] = [];

	/**
	 * 
	 * @param requestsPerPeriod Number of requests to execute in given period
	 * @param periodLength Number of milliseconds in period, set to -1 for concurrency
	 * @param errorOnLimit Error if number of requests exceeds limits
	 * @param PromiseImplementation Promise library of your choice
	 */
	constructor(
		public requestsPerPeriod: number = 10,
		public periodLength: number = -1,
		public errorOnLimit: boolean = false,
		public PromiseImplementation: PromiseConstructorLike = Promise
	){
		return this;
	}

	private async _execute(): Promise<void> {
		const active = this._pending.shift();

		if(!active){
			return;
		}

		try {
			++this._nRequests;

			const results = await active.fn();

			--this._nRequests;

			active.resolve(results);
		}catch(err){
			--this._nRequests;

			active.reject(err);
		}finally{
			await this._testTick();
		}
	}

	private async _testTick(): Promise<void> {
		if(this._pending.length === 0){
			return;
		}

		if(this.periodLength === -1){
			if(this._nRequests >= this.requestsPerPeriod){
				if(this.errorOnLimit){
					throw new Error('Throttle Maximum Reached');
				}

				return;
			}

			return this._execute();
		}

		const cutOff = Date.now() - this.periodLength;

		this._times = this._times.filter((time) => {
			return time >= cutOff;
		}).sort();

		if(this._times.length < this.requestsPerPeriod){
			this._times.push(Date.now());

			return this._execute();
		}

		if(this.errorOnLimit){
			throw new Error('Throttle Maximum Reached');
		}

		if(this._tick){
			clearTimeout(this._tick);
		}

		this._tick = setTimeout(() => {
			this._testTick();
		}, this._times[0] - cutOff);
	}

	/**
	 * Acquire position in queue
	 * 
	 * @param fn Function to execute
	 * 
	 * @returns Promise<T>
	 * 
	 * Example (async/await):
	 * ```typescript
	 * const results = await throttle.acquire(async () => {
	 *     // do some async work
	 * 
	 *     return { hello: 'world' };
	 * });
	 * 
	 * console.log(results); // { hello: 'world' }
	 * ```
	 * 
	 * Example (Promises):
	 * ```typescript
	 * return throttle.acquire(() => {
	 *     // do some work
	 * 
	 *     return { hello: 'world' };
	 * }).then((results) => {
	 *     console.log(results); // { hello: 'world' }
	 * });
	 * ```
	 */
	async acquire<T = any>(fn: () => T): Promise<T> {
		return new this.PromiseImplementation(async (resolve, reject) => {
			this._pending.push({
				resolve: resolve,
				reject: reject,
				fn: fn
			});

			try {
				await this._testTick();
			}catch(err){
				reject(err);
			}
		});
	}

	/**
	 * Clears pending queue without execution
	 */
	clear(){
		this._pending.splice(0, this._pending.length);

		return this;
	}

	/**
	 * Executes entire pending queue at once
	 */
	flush(){
		return Promise.all(this._pending.splice(0, this._pending.length)
			.map(pending => pending.resolve())
		);
	}

}

/* Export to Browser */
if(typeof(window) !== 'undefined'){
	// @ts-ignore
	window.Throttle = Throttle;
}
