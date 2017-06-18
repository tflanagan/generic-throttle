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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require('bluebird');

/* Throttle */

var Throttle = function () {
	function Throttle(requestsPerPeriod, periodLength, errorOnLimit) {
		_classCallCheck(this, Throttle);

		this.requestsPerPeriod = requestsPerPeriod || 10;
		this.periodLength = periodLength || -1;
		this.errorOnLimit = errorOnLimit || false;

		this._tick = undefined;
		this._nRequests = 0;
		this._times = [];
		this._pending = [];

		return this;
	}

	_createClass(Throttle, [{
		key: '_acquire',
		value: function _acquire() {
			var _this = this;

			return new Promise(function (resolve, reject) {
				if (_this.periodLength === -1) {
					if (_this._nRequests < _this.requestsPerPeriod || _this.requestsPerPeriod === -1) {
						++_this._nRequests;

						return resolve();
					}
				} else if (_this._times.length < _this.requestsPerPeriod) {
					_this._times.push(Date.now());

					return resolve();
				}

				if (_this.errorOnLimit) {
					return reject(new Error('Throttle Maximum Reached'));
				}

				_this._pending.push({
					resolve: resolve,
					reject: reject
				});
			}).disposer(function () {
				_this._testTick();
			});
		}
	}, {
		key: '_testTick',
		value: function _testTick() {
			var _this2 = this;

			if (this.periodLength === -1) {
				--this._nRequests;

				if (this._nRequests < this.requestsPerPeriod && this._pending.length > 0) {
					++this._nRequests;

					this._pending.shift().resolve();
				}

				return;
			}

			var cutOff = Date.now() - this.periodLength;

			this._times = this._times.filter(function (time) {
				return time >= cutOff;
			}).sort();

			if (this._times.length < this.requestsPerPeriod) {
				if (this._pending.length > 0) {
					this._times.push(Date.now());

					this._pending.shift().resolve();
				}
			} else {
				if (this._tick) {
					clearTimeout(this._tick);
				}

				this._tick = setTimeout(function () {
					_this2._testTick();
				}, this._times[0] - cutOff);
			}
		}
	}, {
		key: 'acquire',
		value: function acquire(fn) {
			return Promise.using(this._acquire(), function () {
				if (fn) {
					return new Promise(fn);
				}

				return Promise.resolve();
			});
		}
	}, {
		key: 'flush',
		value: function flush() {
			return Promise.map(this._pending.splice(0, this._pending.length), function (pending) {
				return pending.resolve();
			});
		}
	}]);

	return Throttle;
}();

/* Export Module */


if (typeof module !== 'undefined' && module.exports) {
	module.exports = Throttle;
} else if (typeof define === 'function' && define.amd) {
	define('Throttle', [], function () {
		return Throttle;
	});
}

if (typeof global !== 'undefined' && typeof window !== 'undefined' && global === window) {
	global.Throttle = Throttle;
}
