'use strict';

/* Dependencies */
import test from 'ava';
import { Throttle } from '../throttle';

/* Test */
test('limit throttle to 10 executions per 30 seconds', async (t) => {
	const throttle = new Throttle(10, 30000, false);
	let batchStart = Date.now();

	const async = async (i: number) => {
		await throttle.acquire((resolve, reject) => {
			if(i !== 0 && i % 10 === 0){
				const now = Date.now();
				const diff = now - batchStart;

				if(diff < 30000){
					return reject(new Error('Max executions exceeded: ' + diff));
				}

				batchStart = now;
			}

			resolve();
		});
	};

	const promises = [];

	for(let i = 0; i <= 20; ++i){
		promises.push(async(i));
	}

	return Promise.all(promises).then(() => {
		t.pass();
	}).catch((err) => {
		t.fail(err.message);
	});
});

test('fail if more than 10 executions per 30 seconds', async (t) => {
	const throttle = new Throttle(10, 30000, true);

	const async = async () => {
		await throttle.acquire((resolve) => {
			resolve();
		});
	};

	const promises = [];

	for(let i = 0; i <= 20; ++i){
		promises.push(async());
	}

	return Promise.all(promises).then(() => {
		t.fail("Should've failed");
	}).catch((err) => {
		if(err.message === 'Throttle Maximum Reached'){
			return t.pass();
		}

		throw err;
	});
});
