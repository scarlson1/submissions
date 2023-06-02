import React from 'react';

import { Results } from './Results';
import type { ScreenStateProps } from './ScreenState';
import type { InternalDocSearchHit } from 'common';
// import { removeHighlightTags } from './utils';

type ResultsScreenProps = Omit<ScreenStateProps<InternalDocSearchHit>, 'translations'>;

export function ResultsScreen(props: ResultsScreenProps) {
  return (
    <div className='DocSearch-Dropdown-Container'>
      {props.state.collections.map((collection) => {
        if (collection.items.length === 0) {
          return null;
        }

        // const title = removeHighlightTags(collection.items[0]);
        // @ts-ignore
        const title = collection.title ?? (collection?.source?.title || '');
        // TODO: remove? not being used.
        // pulling title from collection.source.title in the results component

        return (
          <Results
            {...props}
            key={collection.source.sourceId}
            title={title}
            collection={collection}
            renderIcon={({ item, index }) => (
              <>
                {item.__docsearch_parent && (
                  <svg className='DocSearch-Hit-Tree' viewBox='0 0 24 54'>
                    <g
                      stroke='currentColor'
                      fill='none'
                      fillRule='evenodd'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      {item.__docsearch_parent !==
                      collection.items[index + 1]?.__docsearch_parent ? (
                        <path d='M8 6v21M20 27H8.3' />
                      ) : (
                        <path d='M8 6v42M20 27H8.3' />
                      )}
                    </g>
                  </svg>
                )}

                <div className='DocSearch-Hit-icon'>
                  <SourceIcon type={item.type} />
                </div>
              </>
            )}
            renderAction={() => (
              <div className='DocSearch-Hit-action'>
                <SelectIcon />
              </div>
            )}
          />
        );
      })}

      {props.resultsFooterComponent && (
        <section className='DocSearch-HitsFooter'>
          <props.resultsFooterComponent state={props.state} />
        </section>
      )}
    </div>
  );
}

export function SelectIcon() {
  return (
    <svg className='DocSearch-Hit-Select-Icon' width='20' height='20' viewBox='0 0 20 20'>
      <g
        stroke='currentColor'
        fill='none'
        fillRule='evenodd'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M18 3v4c0 2-2 4-4 4H2' />
        <path d='M8 17l-6-6 6-6' />
      </g>
    </svg>
  );
}

const LvlIcon: React.FC = () => {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20'>
      <path
        d='M17 6v12c0 .52-.2 1-1 1H4c-.7 0-1-.33-1-1V2c0-.55.42-1 1-1h8l5 5zM14 8h-3.13c-.51 0-.87-.34-.87-.87V4'
        stroke='currentColor'
        fill='none'
        fillRule='evenodd'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export function SourceIcon(props: { type: string }) {
  switch (props.type) {
    case 'lvl1':
      return <LvlIcon />;
    case 'content':
      return <ContentIcon />;
    default:
      return <AnchorIcon />;
  }
}

function AnchorIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20'>
      <path
        d='M13 13h4-4V8H7v5h6v4-4H7V8H3h4V3v5h6V3v5h4-4v5zm-6 0v4-4H3h4z'
        stroke='currentColor'
        fill='none'
        fillRule='evenodd'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20'>
      <path
        d='M17 5H3h14zm0 5H3h14zm0 5H3h14z'
        stroke='currentColor'
        fill='none'
        fillRule='evenodd'
        strokeLinejoin='round'
      />
    </svg>
  );
}
