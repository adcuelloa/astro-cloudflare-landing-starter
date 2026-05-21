/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
/**
 * Get element from dom by selector string
 * @example
 * 	const elementClass = $('.my-class')
 * 	const elementId = $('#my-id')
 * @param selector
 * @param context
 * @returns  HTMLElement
 */
export const $ = <T extends Element = HTMLElement>(
  selector: string,
  context: ParentNode = document
): T | null => {
  const element = context.querySelector<T>(selector);
  return element;
};

/**
 * Get elements from dom by selector string
 * @example
 * 	const elements = $$('.my-class')
 * @param selector
 * @param context
 * @returns  NodeList
 */
export const $$ = <T extends Element = HTMLElement>(
  selector: string,
  context: ParentNode = document
): NodeListOf<T> => {
  const elements = context.querySelectorAll<T>(selector);
  return elements;
};
