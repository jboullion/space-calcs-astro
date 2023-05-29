export function debounce(func: Function) {
  let timer: number = 0;

  return function (event: Event) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(func, 100, event);
  };
}
