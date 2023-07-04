import type { ScreenStateProps } from './ScreenState';
import type { InternalDocSearchHit } from 'common';

export function NoResultsIcon() {
  return (
    <svg
      width='40'
      height='40'
      viewBox='0 0 20 20'
      fill='none'
      fillRule='evenodd'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M15.5 4.8c2 3 1.7 7-1 9.7h0l4.3 4.3-4.3-4.3a7.8 7.8 0 01-9.8 1m-2.2-2.2A7.8 7.8 0 0113.2 2.4M2 18L18 2'></path>
    </svg>
  );
}

export type NoResultsScreenTranslations = Partial<{
  noResultsText: string;
  suggestedQueryText: string;
  reportMissingResultsText: string;
  reportMissingResultsLinkText: string;
}>;

type NoResultsScreenProps = Omit<ScreenStateProps<InternalDocSearchHit>, 'translations'> & {
  translations?: NoResultsScreenTranslations;
};

export function NoResultsScreen({ translations = {}, ...props }: NoResultsScreenProps) {
  const {
    noResultsText = 'No results for',
    suggestedQueryText = 'Try searching for',
    reportMissingResultsText = 'Believe this query should return results?',
    reportMissingResultsLinkText = 'Let us know.',
  } = translations;
  const searchSuggestions: string[] | undefined = props.state.context.searchSuggestions as string[];

  return (
    <div className='DocSearch-NoResults'>
      <div className='DocSearch-Screen-Icon'>
        <NoResultsIcon />
      </div>
      <p className='DocSearch-Title'>
        {noResultsText} "<strong>{props.state.query}</strong>"
      </p>

      {searchSuggestions && searchSuggestions.length > 0 && (
        <div className='DocSearch-NoResults-Prefill-List'>
          <p className='DocSearch-Help'>{suggestedQueryText}:</p>
          <ul>
            {searchSuggestions.slice(0, 3).reduce<React.ReactNode[]>(
              (acc, search) => [
                ...acc,
                <li key={search}>
                  <button
                    className='DocSearch-Prefill'
                    key={search}
                    type='button'
                    onClick={() => {
                      props.setQuery(search.toLowerCase() + ' ');
                      props.refresh();
                      props.inputRef.current!.focus();
                    }}
                  >
                    {search}
                  </button>
                </li>,
              ],
              []
            )}
          </ul>
        </div>
      )}

      {props.getMissingResultsUrl && (
        <p className='DocSearch-Help'>
          {`${reportMissingResultsText} `}
          <a
            href={props.getMissingResultsUrl({ query: props.state.query })}
            target='_blank'
            rel='noopener noreferrer'
          >
            {reportMissingResultsLinkText}
          </a>
        </p>
      )}
    </div>
  );
}
