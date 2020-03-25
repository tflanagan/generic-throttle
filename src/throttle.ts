'use strict';

/* Dependencies */
import { Promise } from 'bluebird';

/* Types */
type AcquireCallback = (resolve: (thenableOrResult?: any) => void, reject: (error?: any) => void) => any;

/* Throttle */
export class Throttle {

	protected _tick: NodeJS.Timeout | undefined = undefined;
	protected _nRequests: number = 0;
	protected _times: number[] = [];
	protected _pending: {
		resolve: Function,
		reject: Function
	}[] = [];

	constructor(
		public requestsPerPeriod: number = 10,
		public periodLength: number = -1,
		public errorOnLimit: boolean = false
	){
		return this;
	}

	private _acquire() {
		return new Promise((resolve, reject) => {
			if(this.periodLength === -1){
				if(this._nRequests < this.requestsPerPeriod || this.requestsPerPeriod === -1){
					++this._nRequests

					return resolve();
				}
			}else
			if(this._times.length < this.requestsPerPeriod){
				this._times.push(Date.now());

				return resolve();
			}

			if(this.errorOnLimit){
				return reject(new Error('Throttle Maximum Reached'));
			}

			this._pending.push({
				resolve: resolve,
				reject: reject
			});
		}).disposer(() => {
			this._testTick();
		});
	}

	private _testTick() {
		if(this.periodLength === -1){
			--this._nRequests;

			if(this._nRequests < this.requestsPerPeriod && this._pending.length > 0){
				++this._nRequests;

				this._pending.shift()!.resolve();
			}

			return;
		}

		const cutOff = Date.now() - this.periodLength;

		this._times = this._times.filter((time) => {
			return time >= cutOff;
		}).sort();

		if(this._times.length < this.requestsPerPeriod){
			if(this._pending.length > 0){
				this._times.push(Date.now());

				this._pending.shift()!.resolve();
			}
		}else{
			if(this._tick){
				clearTimeout(this._tick);
			}

			this._tick = setTimeout(() => {
				this._testTick();
			}, this._times[0] - cutOff);
		}
	}

	/**
	 * Acquire position in queue
	 */
	acquire(fn: AcquireCallback){
		return Promise.using(this._acquire(), () => {
			return new Promise(fn);
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
		return Promise.map(this._pending.splice(0, this._pending.length), (pending) => {
			return pending.resolve();
		});
	}

}

/* Export to Browser */
if(typeof(window) !== 'undefined'){
	// @ts-ignore
	window.Throttle = Throttle;
}
