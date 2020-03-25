'use strict';

/* Dependencies */
import test from 'ava';
import { Throttle } from '../throttle';

/* Functions */
const delay = (time: number = 2000) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
};

/* Test */
test('limit throttle to 5 executions at a time', async (t) => {
	const throttle = new Throttle(5);
	const active: number[] = [];

	const async = async (i: number) => {
		await throttle.acquire(async (resolve, reject) => {
			active.push(i);
	
			await delay(2000);
	
			if(active.length > 5){
				return reject(new Error('Too many executions at once: ' + active.length));
			}
	
			active.splice(active.indexOf(i), 1);

			resolve();
		});
	};

	const promises = [];

	for(let i = 0; i <= 30; ++i){
		promises.push(async(i));
	}

	return Promise.all(promises).then(() => {
		t.pass();
	}).catch((err) => {
		t.fail(err.message);
	});
});

test('fail if more than 5 executions at a time', async (t) => {
	const throttle = new Throttle(5, -1, true);

	const async = async () => {
		await throttle.acquire(async (resolve) => {
			await delay(2000);

			resolve();
		});
	};

	const promises = [];

	for(let i = 0; i <= 30; ++i){
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
