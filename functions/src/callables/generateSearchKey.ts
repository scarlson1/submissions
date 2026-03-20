import algoliasearch from 'algoliasearch';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { Client } from 'typesense';

import {
  algoliaAdminKey,
  algoliaAppId,
  algoliaIDemandAdminSearchKey,
  algoliaIndex,
  algoliaUserBaseKey,
  typesenseAdminKey,
  typesenseHost,
  typesenseIDemandAdminSearchKey,
  typesensePort,
  typesenseProtocol,
  typesenseUserSearchKey,
} from '../common/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { visibleType } from '../utils/index.js';
import { validate } from './utils/index.js';

// https://typesense.org/docs/29.0/api/api-keys.html#generate-scoped-search-key
/*
- You can index data from multiple users/customers in a single Typesense collection (aka multi-tenancy) and create scoped search keys with embedded filter_by parameters that only allow users access to their own subset of data.
- You can embed any search parameters (for eg: exclude_fields or limit_hits) to prevent users from being able to modify it client-side.
*/

let typesenseClient: Client;

function getTypesenseClient(apiKey: string) {
  if (typesenseClient) return typesenseClient;
  typesenseClient = new Client({
    nodes: [
      {
        host: typesenseHost.value(),
        port: typesensePort.value(),
        protocol: typesenseProtocol.value(),
      },
    ],
    apiKey: apiKey,
    connectionTimeoutSeconds: 30,
  });
  return typesenseClient;
}

const generateSearchKey = async ({ auth }: CallableRequest) => {
  // const appId = algoliaAppId.value();
  const apiKey = typesenseAdminKey.value();
  // const searchBaseKey = algoliaUserBaseKey.value();
  validate(apiKey, 'failed-precondition', 'missing typesense credentials');

  const client = getTypesenseClient(apiKey);
  if (!client) throw new Error('Typesense client initialization failed');

  const userId = auth?.uid;
  const isAnon = auth?.token.firebase.sign_in_provider === 'anonymous';
  const tenantId = auth?.token.firebase.tenant;
  const isIDemandAdmin = auth?.token.iDemandAdmin || false;
  const isOrgAdmin = auth?.token.orgAdmin || false;
  const isAgent = auth?.token.agent || false;

  if (isIDemandAdmin) {
    const iDemandAdminSearchKey = typesenseIDemandAdminSearchKey.value();
    validate(
      iDemandAdminSearchKey,
      'internal',
      'missing iDemand Admin search key in Secret Manager',
    );

    info(
      `RETURNING ADMIN SEARCH KEY FOR USER ${auth?.token.email || ''} (UID: ${userId})`,
    );
    return {
      key: iDemandAdminSearchKey,
    };
  }

  // docs: https://typesense.org/docs/30.1/api/search.html#filter-parameters
  // is :=[val1, val2] OR exclusive in typesense ?
  const visibleBy = [visibleType.all];

  if (userId) visibleBy.push(visibleType.user(userId));

  if (isAnon) visibleBy.push(visibleType.anon);

  if (userId && !isAnon) visibleBy.push(visibleType.authed);

  if (tenantId && userId) {
    visibleBy.push(visibleType.orgUser(tenantId));

    if (isAgent) visibleBy.push(visibleType.agent(userId));

    if (isOrgAdmin) visibleBy.push(visibleType.orgAdmin(tenantId));
  }

  try {
    // Make sure that the parent search key you use to generate a scoped search key
    //  has no other permissions besides `documents:search`
    const searchBaseKey = typesenseUserSearchKey.value();
    const securedApiKey = client.keys().generateScopedSearchKey(searchBaseKey, {
      filter_by: `visibleBy:=${visibleBy}`,
      // expires_at: 1906054106,
    });

    info(
      `RETURNING TYPESENSE SEARCH KEY FOR USER ${auth?.token.email || ''} (UID: ${userId})`,
      {
        filter_by: `visibleBy:=${visibleBy}`,
      },
    );

    return {
      key: securedApiKey,
    };
  } catch (err) {
    throw new HttpsError(
      'internal',
      'Error generating user-restricted api key',
    );
  }
};

// VISIBLE BY: https://www.algolia.com/doc/guides/security/api-keys/how-to/user-restricted-access-to-data/#generating-a-secured-api-key

// https://firebase.google.com/docs/firestore/solutions/search?provider=algolia#adding_security

// DOCS: https://www.algolia.com/doc/api-reference/api-methods/generate-secured-api-key/?client=javascript

// filtersS: https://www.algolia.com/doc/api-reference/api-parameters/filterss/#examples

// filters VALIDATOR: https://www.algolia.com/doc/api-reference/api-parameters/filterss/#filterss-syntax-validator

// TODO: set attributes for faceting
// https://firebase.google.com/docs/firestore/solutions/search?provider=algolia

// TODO: how to search users when searching from agent account ??
// TODO: add valid until once error boundary is set up to handle refetching expired keys

// You can use nested attributes for filtering.
// For example, authors.mainAuthor:"John Doe" is a valid filters, as long as you declare authors.mainAuthor in attributesForFaceting.

// For example, if a record contains the array attribute genres: ["fiction", "thriller", "sci-fi"], the filters genres:thriller returns this record.

// "We limit filters expressions to a conjunction (ANDs) of disjunctions (ORs). For example you can use filters1 AND (filters2 OR filters3)), but not ORs of ANDs (e.g. filters1 OR (filters2 AND filters3)."

const generateSearchKeyOld = async ({ auth }: CallableRequest) => {
  const appId = algoliaAppId.value();
  const adminKey = algoliaAdminKey.value();
  const searchBaseKey = algoliaUserBaseKey.value();

  validate(
    appId && adminKey && searchBaseKey,
    'failed-precondition',
    'missing algolia credentials',
  );

  const client = algoliasearch(appId, adminKey);

  const userId = auth?.uid;
  const isAnon = auth?.token.firebase.sign_in_provider === 'anonymous';
  const tenantId = auth?.token.firebase.tenant;
  const isIDemandAdmin = auth?.token.iDemandAdmin || false;
  const isOrgAdmin = auth?.token.orgAdmin || false;
  const isAgent = auth?.token.agent || false;

  // return admin search key if user is iDemand Admin
  if (isIDemandAdmin) {
    const iDemandAdminSearchKey = algoliaIDemandAdminSearchKey.value();
    validate(
      iDemandAdminSearchKey,
      'internal',
      'missing iDemand Admin search key in Secret Manager',
    );

    info(
      `RETURNING ADMIN ALGOLIA SEARCH KEY FOR USER ${auth?.token.email || ''} (UID: ${userId})`,
    );
    return {
      key: iDemandAdminSearchKey,
    };
  }

  const keyConfig: SecuredApiKeyRestrictions = {
    restrictIndices: algoliaIndex.value(),
    userToken: userId,
    // validUntil: addDays(new Date(), 30).getTime(),
  };

  let filters = `visibleBy:${visibleType.all}`;

  if (userId) filters += ` OR visibleBy:${visibleType.user(userId)}`;

  if (isAnon) filters += ` OR visibleBy:${visibleType.anon}`;

  if (userId && !isAnon) filters += ` OR visibleBy:${visibleType.authed}`;

  if (tenantId && userId) {
    filters += ` OR visibleBy:${visibleType.orgUser(tenantId)}`;

    if (isAgent) filters += ` OR visibleBy:${visibleType.agent(userId)}`;

    if (isOrgAdmin)
      filters += ` OR visibleBy:${visibleType.orgAdmin(tenantId)}`;
  }

  try {
    const securedApiKey = client.generateSecuredApiKey(searchBaseKey, {
      ...keyConfig,
      filters,
    });

    info(
      `RETURNING ALGOLIA SEARCH KEY FOR USER ${auth?.token.email || ''} (UID: ${userId})`,
      {
        ...keyConfig,
        filters,
      },
    );

    return {
      key: securedApiKey,
    };
  } catch (err) {
    throw new HttpsError(
      'internal',
      'Error generating user-restricted api key',
    );
  }
};

export default onCallWrapper('generatesearchkey', generateSearchKey);

export declare type SearchOptions = {
  /**
   * Create a new query with an empty search query.
   */
  query?: string;
  /**
   * Allows a search for similar objects, but the query has to be constructed on your end and included alongside an empty query.
   *
   * The similarQuery should be made from the tags and keywords of the relevant object.
   */
  similarQuery?: string;
  /**
   *  filters hits by facet value.
   */
  facetfilters?: string | string[] | ReadonlyArray<string[] | string>;
  /**
   * Create filters for ranking purposes, where records that match the filters are ranked highest.
   */
  optionalfilters?: string | string[] | ReadonlyArray<string[] | string>;
  /**
   * filters on numeric attributes.
   */
  numericfilters?: string | string[] | ReadonlyArray<string[] | string>;
  /**
   * filters hits by tags. tagfilters is a different way of filtering, which relies on the _tags
   * attribute. It uses a simpler syntax than filters. You can use it when you want to do
   * simple filtering based on tags.
   */
  tagfilters?: string | string[] | ReadonlyArray<string[] | string>;
  /**
   * Determines how to calculate the total score for filtering.
   */
  sumOrfiltersScores?: boolean;
  /**
   * filters the query with numeric, facet and/or tag filters.
   */
  filters?: string;
  /**
   * Specify the page to retrieve.
   */
  page?: number;
  /**
   * Set the number of hits per page.
   */
  hitsPerPage?: number;
  /**
   * Specify the offset of the first hit to return.
   */
  offset?: number;
  /**
   * Set the number of hits to retrieve (used only with offset).
   */
  length?: number;
  /**
   * List of attributes to highlight.
   */
  attributesToHighlight?: string[];
  /**
   * List of attributes to snippet, with an optional maximum number of words to snippet.
   */
  attributesToSnippet?: string[];
  /**
   * Gives control over which attributes to retrieve and which not to retrieve.
   */
  attributesToRetrieve?: string[];
  /**
   * The HTML string to insert before the highlighted parts in all highlight and snippet results.
   */
  highlightPreTag?: string;
  /**
   * The HTML string to insert after the highlighted parts in all highlight and snippet results
   */
  highlightPostTag?: string;
  /**
   * String used as an ellipsis indicator when a snippet is truncated.
   */
  snippetEllipsisText?: string;
  /**
   * Restrict highlighting and snippeting to items that matched the query.
   */
  restrictHighlightAndSnippetArrays?: boolean;
  /**
   * Facets to retrieve.
   */
  facets?: string[];
  /**
   * Maximum number of facet values to return for each facet during a regular search.
   */
  maxValuesPerFacet?: number;
  /**
   *  Force faceting to be applied after de-duplication (via the Distinct setting).
   */
  facetingAfterDistinct?: boolean;
  /**
   * Minimum number of characters a word in the query string must contain to accept matches with 1 typo
   */
  minWordSizefor1Typo?: number;
  /**
   * Minimum number of characters a word in the query string must contain to accept matches with 2 typos.
   */
  minWordSizefor2Typos?: number;
  /**
   * Whether to allow typos on numbers (“numeric tokens”) in the query string.
   */
  allowTyposOnNumericTokens?: boolean;
  /**
   * List of attributes on which you want to disable typo tolerance.
   */
  disableTypoToleranceOnAttributes?: string[];
  /**
   * Controls if and how query words are interpreted as prefixes.
   */
  queryType?: 'prefixLast' | 'prefixAll' | 'prefixNone';
  /**
   * Selects a strategy to remove words from the query when it doesn’t match any hits.
   */
  removeWordsIfNoResults?: 'none' | 'lastWords' | 'firstWords' | 'allOptional';
  /**
   * Enables the advanced query syntax.
   */
  advancedSyntax?: boolean;
  /**
   * AdvancedSyntaxFeatures can be exactPhrase or excludeWords
   */
  advancedSyntaxFeatures?: ReadonlyArray<'exactPhrase' | 'excludeWords'>;
  /**
   * A list of words that should be considered as optional when found in the query.
   */
  optionalWords?: string | string[];
  /**
   * List of attributes on which you want to disable the exact ranking criterion.
   */
  disableExactOnAttributes?: string[];
  /**
   * Controls how the exact ranking criterion is computed when the query contains only one word.
   */
  exactOnSingleWordQuery?: 'attribute' | 'none' | 'word';
  /**
   * List of alternatives that should be considered an exact match by the exact ranking criterion.
   */
  alternativesAsExact?: ReadonlyArray<
    'ignorePlurals' | 'singleWordSynonym' | 'multiWordsSynonym'
  >;
  /**
   * Whether rules should be globally enabled.
   */
  enableRules?: boolean;
  /**
   * Enables contextual rules.
   */
  ruleContexts?: string[];
  /**
   * Enables de-duplication or grouping of results.
   */
  distinct?: boolean | number;
  /**
   * Whether the current query will be taken into account in the Analytics
   */
  analytics?: boolean;
  /**
   * List of tags to apply to the query in the analytics.
   */
  analyticsTags?: string[];
  /**
   * Whether to take into account an index’s synonyms for a particular search.
   */
  synonyms?: boolean;
  /**
   * Whether to highlight and snippet the original word that matches the synonym or the synonym itself.
   */
  replaceSynonymsInHighlight?: boolean;
  /**
   * Precision of the proximity ranking criterion.
   */
  minProximity?: number;
  /**
   * Choose which fields the response will contain. Applies to search and browse queries.
   */
  responseFields?: string[];
  /**
   * Maximum number of facet hits to return during a search for facet values.
   */
  maxFacetHits?: number;
  /**
   * Whether to include or exclude a query from the processing-time percentile computation.
   */
  percentileComputation?: boolean;
  /**
   * Enable the Click Analytics feature.
   */
  clickAnalytics?: boolean;
  /**
   * The `personalizationImpact` parameter sets the percentage of the impact that personalization has on ranking records. The
   * value must be between 0 and 100 (inclusive). This parameter will not be taken into account if `enablePersonalization`
   * is **false**.
   */
  personalizationImpact?: number;
  /**
   * Enable personalization for the query
   */
  enablePersonalization?: boolean;
  /**
   * Restricts a given query to look in only a subset of your searchable attributes.
   */
  restrictSearchableAttributes?: string[];
  /**
   * Restricts a given query to look in only a subset of your searchable attributes.
   */
  sortFacetValuesBy?: 'count' | 'alpha';
  /**
   * Controls whether typo tolerance is enabled and how it is applied.
   */
  typoTolerance?: boolean | 'min' | 'strict';
  /**
   * Search for entries around a central geolocation, enabling a geo search within a circular area.
   */
  aroundLatLng?: string;
  /**
   * Search for entries around a given location automatically computed from the requester’s IP address.
   */
  aroundLatLngViaIP?: boolean;
  /**
   * Define the maximum radius for a geo search (in meters).
   */
  aroundRadius?: number | 'all';
  /**
   * Precision of geo search (in meters), to add grouping by geo location to the ranking formula.
   */
  aroundPrecision?:
    | number
    | ReadonlyArray<{
        from: number;
        value: number;
      }>;
  /**
   * Minimum radius (in meters) used for a geo search when aroundRadius is not set.
   */
  minimumAroundRadius?: number;
  /**
   * Search inside a rectangular area (in geo coordinates).
   */
  insideBoundingBox?: ReadonlyArray<number[]> | string;
  /**
   * Search inside a polygon (in geo coordinates).
   */
  insidePolygon?: ReadonlyArray<number[]>;
  /**
   * Treats singular, plurals, and other forms of declensions as matching terms.
   */
  ignorePlurals?: boolean | string[];
  /**
   * Removes stop (common) words from the query before executing it.
   */
  removeStopWords?: boolean | string[];
  /**
   * List of supported languages with their associated language ISO code.
   *
   * Apply a set of natural language best practices such as ignorePlurals,
   * removeStopWords, removeWordsIfNoResults, analyticsTags and ruleContexts.
   */
  naturalLanguages?: string[];
  /**
   * When true, each hit in the response contains an additional _rankingInfo object.
   */
  getRankingInfo?: boolean;
  /**
   * A user identifier.
   * Format: alpha numeric string [a-zA-Z0-9_-]
   * Length: between 1 and 64 characters.
   */
  userToken?: string;
  /**
   * Can be to enable or disable A/B tests at query time.
   * Engine's default: true
   */
  enableABTest?: boolean;
  /**
   * Enable word segmentation (also called decompounding) at query time for
   * compatible languages. For example, this turns the Dutch query
   * "spaanplaatbehang" into "spaan plaat behang" to retrieve more relevant
   * results.
   */
  decompoundQuery?: boolean;
  /**
   * The relevancy threshold to apply to search in a virtual index [0-100]. A Bigger
   * value means fewer, but more relevant results, smaller value means more, but
   * less relevant results.
   */
  relevancyStrictness?: number;
  /**
   * Whether this search should use Dynamic Re-Ranking.
   * @link https://www.algolia.com/doc/guides/algolia-ai/re-ranking/
   *
   * Note: You need to turn on Dynamic Re-Ranking on your index for it to have an effect on
   * your search results. You can do this through the Re-Ranking page on the dashboard.
   * This parameter is only used to turn off Dynamic Re-Ranking (with false) at search time.
   */
  enableReRanking?: boolean;
  /**
   * When Dynamic Re-Ranking is enabled, only records that match these filters will be impacted by Dynamic Re-Ranking.
   */
  reRankingApplyfilters?:
    | string
    | string[]
    | ReadonlyArray<string[] | string>
    | null;
  /**
   * Sets the languages to be used by language-specific settings and functionalities such as ignorePlurals, removeStopWords, and CJK word-detection.
   */
  queryLanguages?: string[];
  /**
   * Enriches the API’s response with meta-information as to how the query was processed.
   */
  explain?: string[];
};

export declare type SecuredApiKeyRestrictions = SearchOptions & {
  /**
   * A Unix timestamp used to define the expiration date of the API key.
   */
  validUntil?: number;
  /**
   * List of index names that can be queried.
   */
  restrictIndices?: string[] | string;
  /**
   * IPv4 network allowed to use the generated key. This is used for more protection against API key leaking and reuse.
   */
  restrictSources?: string;
  /**
   * Specify a user identifier. This is often used with rate limits.
   */
  userToken?: string;
};
