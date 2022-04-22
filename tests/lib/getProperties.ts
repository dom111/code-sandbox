import { ElementHandle, EvaluateFn } from 'puppeteer';

export const getRawProperty = async <
  T extends HTMLElement = HTMLElement,
  K extends keyof T = keyof T
  >(
  element: Promise<ElementHandle<T>> | ElementHandle<T>,
  property: K
): Promise<T[K]> =>
  await (await (await element)?.getProperty(property as string))?.jsonValue();

export const getRawProperties = async <
  T extends HTMLElement = HTMLElement,
  K extends keyof T = keyof T
  >(
  elements: Promise<ElementHandle<T>[]> | ElementHandle<T>[],
  property: K
): Promise<T[K][]> =>
  Promise.all(
    (await elements).map(async (element) =>
      ['innerText', 'innerHTML'].includes(property as string)
        ? await element?.evaluate(
          new Function(
            'element',
            `return element.${property};`
          ) as EvaluateFn<T>
        )
        : getRawProperty<T, K>(element, property)
    )
  );
