import { Results } from './Results';
import type { ScreenStateProps } from './ScreenState';
import { InternalDocSearchHit } from 'common';

export type StartScreenTranslations = Partial<{
  recentSearchesTitle: string;
  noRecentSearchesText: string;
  saveRecentSearchButtonTitle: string;
  removeRecentSearchButtonTitle: string;
  favoriteSearchesTitle: string;
  removeFavoriteSearchButtonTitle: string;
}>;

type StartScreenProps = Omit<ScreenStateProps<InternalDocSearchHit>, 'translations'> & {
  hasCollections: boolean;
  translations?: StartScreenTranslations;
};

export function StartScreen({ translations = {}, ...props }: StartScreenProps) {
  const {
    recentSearchesTitle = 'Recent',
    noRecentSearchesText = 'No recent searches',
    saveRecentSearchButtonTitle = 'Save this search',
    removeRecentSearchButtonTitle = 'Remove this search from history',
    favoriteSearchesTitle = 'Favorite',
    removeFavoriteSearchButtonTitle = 'Remove this search from favorites',
  } = translations;
  if (props.state.status === 'idle' && props.hasCollections === false) {
    if (props.disableUserPersonalization) {
      return null;
    }

    return (
      <div className='DocSearch-StartScreen'>
        <p className='DocSearch-Help'>{noRecentSearchesText}</p>
      </div>
    );
  }

  if (props.hasCollections === false) {
    return null;
  }

  return (
    <div className='DocSearch-Dropdown-Container'>
      <Results
        {...props}
        title={recentSearchesTitle}
        collection={props.state.collections[0]}
        renderIcon={() => (
          <div className='DocSearch-Hit-icon'>
            <RecentIcon />
          </div>
        )}
        renderAction={({ item, runFavoriteTransition, runDeleteTransition }) => (
          <>
            <div className='DocSearch-Hit-action'>
              <button
                className='DocSearch-Hit-action-button'
                title={saveRecentSearchButtonTitle}
                type='submit'
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  runFavoriteTransition(() => {
                    props.favoriteSearches.add(item);
                    props.recentSearches.remove(item);
                    props.refresh();
                  });
                }}
              >
                <StarIcon />
              </button>
            </div>
            <div className='DocSearch-Hit-action'>
              <button
                className='DocSearch-Hit-action-button'
                title={removeRecentSearchButtonTitle}
                type='submit'
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  runDeleteTransition(() => {
                    props.recentSearches.remove(item);
                    props.refresh();
                  });
                }}
              >
                <ResetIcon />
              </button>
            </div>
          </>
        )}
      />

      <Results
        {...props}
        title={favoriteSearchesTitle}
        collection={props.state.collections[1]}
        renderIcon={() => (
          <div className='DocSearch-Hit-icon'>
            <StarIcon />
          </div>
        )}
        renderAction={({ item, runDeleteTransition }) => (
          <div className='DocSearch-Hit-action'>
            <button
              className='DocSearch-Hit-action-button'
              title={removeFavoriteSearchButtonTitle}
              type='submit'
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                runDeleteTransition(() => {
                  props.favoriteSearches.remove(item);
                  props.refresh();
                });
              }}
            >
              <ResetIcon />
            </button>
          </div>
        )}
      />
    </div>
  );
}

export function RecentIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20'>
      <g
        stroke='currentColor'
        fill='none'
        fillRule='evenodd'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M3.18 6.6a8.23 8.23 0 1112.93 9.94h0a8.23 8.23 0 01-11.63 0' />
        <path d='M6.44 7.25H2.55V3.36M10.45 6v5.6M10.45 11.6L13 13' />
      </g>
    </svg>
  );
}

export function ResetIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20'>
      <path
        d='M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z'
        stroke='currentColor'
        fill='none'
        fillRule='evenodd'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20'>
      <path
        d='M10 14.2L5 17l1-5.6-4-4 5.5-.7 2.5-5 2.5 5 5.6.8-4 4 .9 5.5z'
        stroke='currentColor'
        fill='none'
        fillRule='evenodd'
        strokeLinejoin='round'
      />
    </svg>
  );
}
