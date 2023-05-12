import React from 'react';
import { Chip, Typography } from '@mui/material';
import type { AutocompleteApi, AutocompleteState, BaseItem } from '@algolia/autocomplete-core';

import { Snippet } from './Snippet';
import type { SearchProps } from './Search';
import type { InternalDocSearchHit, StoredDocSearchHit } from 'common';

interface ResultsProps<TItem extends BaseItem>
  extends AutocompleteApi<TItem, React.FormEvent, React.MouseEvent, React.KeyboardEvent> {
  title: string;
  collection: AutocompleteState<TItem>['collections'][0];
  renderIcon: (props: { item: TItem; index: number }) => React.ReactNode;
  renderAction: (props: {
    item: TItem;
    runDeleteTransition: (cb: () => void) => void;
    runFavoriteTransition: (cb: () => void) => void;
  }) => React.ReactNode;
  onItemClick: (item: TItem, event: KeyboardEvent | MouseEvent) => void;
  hitComponent: SearchProps['hitComponent'];
}

export function Results<TItem extends StoredDocSearchHit>(props: ResultsProps<TItem>) {
  if (!props.collection || props.collection.items.length === 0) {
    return null;
  }

  console.log('RESULTS PROPS: ', props);

  return (
    <section className='DocSearch-Hits'>
      {/* <div className='DocSearch-Hit-source'>{props.title}</div> */}
      <Typography
        variant='subtitle2'
        color='primary'
        fontWeight={600}
        sx={{ zIndex: 10, pt: 2, px: 1, mx: -1, position: 'sticky', top: 0 }}
        // className='DocSearch-Hit-source'
      >
        {props.title}
      </Typography>

      <ul {...props.getListProps()}>
        {props.collection.items.map((item, index) => {
          return (
            <Result
              key={[props.title, item.objectID].join(':')}
              item={item}
              index={index}
              {...props}
            />
          );
        })}
      </ul>
    </section>
  );
}

interface ResultProps<TItem extends BaseItem> extends ResultsProps<TItem> {
  item: TItem;
  index: number;
}

function Result<TItem extends StoredDocSearchHit>({
  item,
  index,
  renderIcon,
  renderAction,
  getItemProps,
  onItemClick,
  collection,
  hitComponent,
}: ResultProps<TItem>) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFavoriting, setIsFavoriting] = React.useState(false);
  const action = React.useRef<(() => void) | null>(null);
  const Hit = hitComponent!;

  function runDeleteTransition(cb: () => void) {
    setIsDeleting(true);
    action.current = cb;
  }

  function runFavoriteTransition(cb: () => void) {
    setIsFavoriting(true);
    action.current = cb;
  }

  console.log('ITEM: ', item);

  return (
    <li
      className={[
        'DocSearch-Hit',
        (item as unknown as InternalDocSearchHit).__docsearch_parent && 'DocSearch-Hit--Child',
        isDeleting && 'DocSearch-Hit--deleting',
        isFavoriting && 'DocSearch-Hit--favoriting',
      ]
        .filter(Boolean)
        .join(' ')}
      onTransitionEnd={() => {
        if (action.current) {
          action.current();
        }
      }}
      {...getItemProps({
        item,
        source: collection.source,
        onClick(event: MouseEvent | KeyboardEvent) {
          onItemClick(item, event);
        },
      })}
    >
      <Hit hit={item}>
        <div className='DocSearch-Hit-Container'>
          {renderIcon({ item, index })}

          {/* {item.hierarchy[item.type] && item.type === 'lvl1' && (
            <div className='DocSearch-Hit-content-wrapper'>
              <Snippet className='DocSearch-Hit-title' hit={item} attribute='hierarchy.lvl1' />
              {item.content && (
                <Snippet className='DocSearch-Hit-path' hit={item} attribute='content' />
              )}
            </div>
          )}
          {item.hierarchy[item.type] &&
            (item.type === 'lvl2' ||
              item.type === 'lvl3' ||
              item.type === 'lvl4' ||
              item.type === 'lvl5' ||
              item.type === 'lvl6') && (
              <div className='DocSearch-Hit-content-wrapper'>
                <Snippet
                  className='DocSearch-Hit-title'
                  hit={item}
                  attribute={`hierarchy.${item.type}`}
                />
                <Snippet className='DocSearch-Hit-path' hit={item} attribute='hierarchy.lvl1' />
              </div>
            )} */}

          {/* {item.type === 'content' && (
            <div className='DocSearch-Hit-content-wrapper'>
              <Snippet className='DocSearch-Hit-title' hit={item} attribute='content' />
              <Snippet className='DocSearch-Hit-path' hit={item} attribute='hierarchy.lvl1' />
            </div>
          )} */}

          {item.content && (
            <div className='DocSearch-Hit-content-wrapper'>
              <Snippet className='DocSearch-Hit-title' hit={item} attribute='title' />
              <Snippet className='DocSearch-Hit-path' hit={item} attribute='content' />
              {/* <Snippet className='DocSearch-Hit-path' hit={item} attribute='hierarchy.lvl1' /> */}
            </div>
          )}

          {renderAction({ item, runDeleteTransition, runFavoriteTransition })}

          {item.type && <Chip label={item.type} variant='outlined' size='small' sx={{ ml: 2 }} />}
        </div>
      </Hit>
    </li>
  );
}
