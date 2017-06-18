/* Copyright 2014 Tristian Flanagan
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

'use strict';

/* Dependencies */
const Promise = require('bluebird');

/* Throttle */
class Throttle {

	constructor(requestsPerPeriod, periodLength, errorOnLimit){
		this.requestsPerPeriod = requestsPerPeriod || 10;
		this.periodLength = periodLength || -1;
		this.errorOnLimit = errorOnLimit || false;

		this._tick = undefined;
		this._nRequests = 0;
		this._times = [];
		this._pending = [];

		return this;
	}

	_acquire(){
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

	_testTick(){
		if(this.periodLength === -1){
			--this._nRequests;

			if(this._nRequests < this.requestsPerPeriod && this._pending.length > 0){
				++this._nRequests;

				this._pending.shift().resolve();
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

				this._pending.shift().resolve();
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

	acquire(fn){
		return Promise.using(this._acquire(), () => {
			if(fn){
				return new Promise(fn);
			}

			return Promise.resolve();
		});
	}

	flush(){
		return Promise.map(this._pending.splice(0, this._pending.length), (pending) => {
			return pending.resolve();
		});
	}

}

/* Export Module */
if(typeof(module) !== 'undefined' && module.exports){
	module.exports = Throttle;
}else
if(typeof(define) === 'function' && define.amd){
	define('Throttle', [], function(){
		return Throttle;
	});
}

if(typeof(global) !== 'undefined' && typeof(window) !== 'undefined' && global === window){
	global.Throttle = Throttle;
}
