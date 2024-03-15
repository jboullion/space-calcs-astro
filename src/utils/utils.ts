export function debounce(func: Function, delay: number = 100) {
	let timer: number = 0;

	return function (event: Event) {
		if (timer) clearTimeout(timer);
		timer = setTimeout(func, delay, event);
	};
}

export function throttle(func: Function, delay: number = 100) {
	let timer: number = 0;

	return function (event: Event) {
		if (timer) clearTimeout(timer);
		// @ts-ignore
		timer = setTimeout(() => {
			func(event);
			timer = 0;
		}, delay);
	};
}
