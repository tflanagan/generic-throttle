generic-throttle
==============

[![npm license](https://img.shields.io/npm/l/generic-throttle.svg)](https://www.npmjs.com/package/generic-throttle) [![npm version](https://img.shields.io/npm/v/generic-throttle.svg)](https://www.npmjs.com/package/generic-throttle) [![npm downloads](https://img.shields.io/npm/dm/generic-throttle.svg)](https://www.npmjs.com/package/generic-throttle)

A lightweight, flexible promise based throttle class perfect for any rate or concurrency limiting need.

Written in TypeScript, targets Nodejs and the Browser

Install
-------
```
# Latest Stable Release
$ npm install generic-throttle

# Latest Commit
$ npm install tflanagan/generic-throttle

# Also available via Bower
$ bower install generic-throttle
```

Documentation
-------------

[TypeDoc Documentation](https://tflanagan.github.io/generic-throttle/)

Rate Limit Example
------------------
This Throttle instance will rate limit the throttle to a maximum of 10 requests
every 30 seconds. It will not throw an error if the maximum is exceeded.

```javascript
'use strict';

const { Throttle } = require('generic-throttle');

const throttle = new Throttle(10, 30000, false);

function delay(){
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 2000);
	});
}

function asyncRequest(i){
	return throttle.acquire(() => {
		console.log('%d does some async request', i);

		return delay();
	}).then(function(){
		console.log('%d finished', i);
	});
}

for(let i = 0; i < 30; ++i){
	asyncRequest(i);
}
```

Concurrency Limit Example
-------------------------
This Throttle instance will limit concurrency to 5 requests at any given
moment. It will not throw an error if the maximum is exceeded.

```javascript
'use strict';

const { Throttle } = require('generic-throttle');

const throttle = new Throttle(5);

function delay(){
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 2000);
	});
}

function asyncRequest(i){
	return throttle.acquire(() => {
		console.log('%d does some async request', i);

		return delay();
	}).then(function(){
		console.log('%d finished', i);
	});
}

for(let i = 0; i < 30; ++i){
	asyncRequest(i);
}
```

License
-------
Copyright 2014 Tristian Flanagan

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
