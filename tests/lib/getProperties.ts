import { ElementHandle, EvaluateFunc, EvaluateFuncWith } from 'puppeteer';

export const getRawProperty = async <
  T extends HTMLElement = HTMLElement,
  K extends keyof T = keyof T
  >(
  element: Promise<ElementHandle<T>> | ElementHandle<T>,
  property: K
): Promise<T[K]> =>
  await (await (await element)?.getProperty(property as string))?.jsonValue() as T[K];

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
        ? await element?.evaluate<[], EvaluateFuncWith<T, []>>(
          new Function(
            'element',
            `return element.${String(property)};`
          ) as EvaluateFuncWith<T, []>
        ) as T[K]
        : getRawProperty<T, K>(element, property)
    )
  );
