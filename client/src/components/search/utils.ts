import { AutocompleteReshapeSource, BaseItem } from '@algolia/autocomplete-core';
import { AutocompleteSource } from '@algolia/autocomplete-js';
import { flatten } from '@algolia/autocomplete-shared';

import type { DocSearchHit, InternalDocSearchHit } from 'common';
import { startCase } from 'lodash';

const regexHighlightTags = /(<mark>|<\/mark>)/g;
const regexHasHighlightTags = RegExp(regexHighlightTags.source);

export function removeHighlightTags(hit: DocSearchHit | InternalDocSearchHit): string {
  const internalDocSearchHit = hit as InternalDocSearchHit;

  if (!internalDocSearchHit.__docsearch_parent && !hit._highlightResult) {
    return hit?.hierarchy?.lvl0;
  }

  const { value } =
    (internalDocSearchHit.__docsearch_parent
      ? internalDocSearchHit.__docsearch_parent?._highlightResult?.hierarchy?.lvl0
      : hit._highlightResult?.hierarchy?.lvl0) || {};

  return value && regexHasHighlightTags.test(value) ? value.replace(regexHighlightTags, '') : value;
}

/**
 * Detect when an event is modified with a special key to let the browser
 * trigger its default behavior.
 */
export function isModifierEvent<TEvent extends KeyboardEvent | MouseEvent>(event: TEvent): boolean {
  const isMiddleClick = (event as MouseEvent).button === 1;

  return isMiddleClick || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

export type AutocompleteReshapeFunction<TParams = any> = <TItem extends BaseItem>(
  ...params: TParams[]
) => (
  ...expressions: Array<AutocompleteReshapeSource<TItem>>
) => Array<AutocompleteReshapeSource<TItem>>;

// Filter out falsy values because dynamic sources may not exist at every render.
// Flatten to support pipe operators from functional libraries like Ramda.
export function normalizeReshapeSources<TItem extends BaseItem>(
  sources: Array<AutocompleteReshapeSource<TItem>>
) {
  return flatten(sources).filter(Boolean);
}

export type GroupByOptions<TItem extends BaseItem, TSource extends AutocompleteSource<TItem>> = {
  getSource(params: { name: string; items: TItem[] }): Partial<TSource>;
  maxResultsPerGroup?: number;
};

// https://codesandbox.io/s/github/algolia/autocomplete/tree/next/examples/reshape?file=/functions/groupBy.ts
export const groupBy: AutocompleteReshapeFunction = <
  TItem extends BaseItem,
  TSource extends AutocompleteSource<TItem> = AutocompleteSource<TItem>
>(
  predicate: (value: TItem) => string,
  options: GroupByOptions<TItem, TSource>
) => {
  return function runGroupBy(...rawSources) {
    const sources = normalizeReshapeSources(rawSources);

    if (sources.length === 0) {
      return [];
    }

    // Since we create multiple sources from a single one, we take the first one as reference to create the new sources from.
    const referenceSource = sources[0];
    const items = flatten(sources.map((source) => source.getItems()));
    const groupedItems = items.reduce<Record<string, TItem[]>>((acc, item) => {
      // @ts-ignore
      const key = predicate(item as TItem);

      if (!acc.hasOwnProperty(key)) {
        acc[key] = [];
      }
      // @ts-ignore
      // acc[key].push(item as TItem);
      // Limit each section to show 5 hits maximum. Acts as a frontend alternative to `distinct`.
      if (acc[key].length < (options.maxResultsPerGroup || 5)) {
        // @ts-ignore
        acc[key].push(item as TItem);
      }

      return acc;
    }, {});

    return Object.entries(groupedItems).map(([groupName, groupItems]) => {
      const userSource = options.getSource({
        name: groupName,
        items: groupItems,
      });

      return {
        ...referenceSource,
        sourceId: groupName,
        title: startCase(groupName),
        getItems() {
          return groupItems;
        },
        ...userSource,
        templates: {
          ...((referenceSource as any).templates as any),
          ...(userSource as any).templates,
        },
      };
    });
  };
};

// @ts-ignore
export const groupByCollectionName = groupBy((hit) => hit.collectionName, {
  // @ts-ignore
  getSource({ name, items }) {
    return {
      getItems() {
        return items;
      },
    };
  },
  maxResultsPerGroup: 4,
});

export function uniqBy(predicate: (props: any) => any) {
  // @ts-ignore
  return function runUniqBy(...rawSources) {
    const sources = rawSources.flat().filter(Boolean);
    const seen = new Set();

    return sources.map((source) => {
      const items = source.getItems().filter((item: any) => {
        const appliedItem = predicate({ source, item });
        const hasSeen = seen.has(appliedItem);

        seen.add(appliedItem);

        return !hasSeen;
      });

      return {
        ...source,
        getItems() {
          return items;
        },
      };
    });
  };
}

export const removeDuplicates = uniqBy(({ source, item }) =>
  source.sourceId === 'querySuggestionsPlugin' ? item.query : item.label
);

// export function groupByOld<TValue extends Record<string, unknown>>(
//   values: TValue[],
//   predicate: (value: TValue) => string,
//   maxResultsPerGroup?: number
// ): Record<string, TValue[]> {
//   console.log('VALUES: ', values);
//   console.log('PREDICATE: ', predicate);
//   return values.reduce<Record<string, TValue[]>>((acc, item) => {
//     const key = predicate(item);

//     if (!acc.hasOwnProperty(key)) {
//       acc[key] = [];
//     }

//     // Limit each section to show 5 hits maximum.
//     // This acts as a frontend alternative to `distinct`.
//     if (acc[key].length < (maxResultsPerGroup || 5)) {
//       acc[key].push(item);
//     }

//     return acc;
//   }, {});
// }

export function identity<TParam>(x: TParam): TParam {
  return x;
}
