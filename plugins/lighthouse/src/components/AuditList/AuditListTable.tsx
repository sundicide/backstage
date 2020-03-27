/* eslint-disable react/prop-types */
/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useAsync } from 'react-use';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import { Progress, useApi } from '@backstage/core';

import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';
import Pagination from '@material-ui/lab/Pagination';

import CategoryTrendline from './CategoryTrendline';
import { useQuery } from '../../utils';
import {
  lighthouseApiRef,
  Audit,
  AuditCompleted,
  LighthouseCategoryId,
  WebsiteListResponse,
  Website,
} from '../../api';
import AuditStatusIcon from '../shared/AuditStatusIcon';

const LIMIT = 10;

export const CATEGORIES: LighthouseCategoryId[] = [
  'accessibility',
  'performance',
  'seo',
  'best-practices',
];

export const CATEGORY_LABELS: Record<LighthouseCategoryId, string> = {
  accessibility: 'Accessibility',
  performance: 'Performance',
  seo: 'SEO',
  'best-practices': 'Best Practices',
  pwa: 'Progressive Web App',
};

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
  status: {
    textTransform: 'capitalize',
  },
});

type SparklinesDataByCategory = Record<LighthouseCategoryId, number[]>;
function buildSparklinesDataForItem(item: Website): SparklinesDataByCategory {
  return item.audits
    .filter(
      (audit: Audit): audit is AuditCompleted => audit.status === 'COMPLETED',
    )
    .reduce((scores, audit) => {
      Object.values(audit.categories).forEach(category => {
        scores[category.id] = scores[category.id] || [];
        scores[category.id].unshift(category.score);
      });

      // edge case: if only one audit exists, force a "flat" sparkline
      Object.values(scores).forEach(arr => {
        if (arr.length === 1) arr.push(arr[0]);
      });

      return scores;
    }, {} as SparklinesDataByCategory);
}

function usePage() {
  const query = useQuery();
  return query.get('page') ? parseInt(query.get('page') as string, 10) || 1 : 1;
}

export const AuditListTable: FC<WebsiteListResponse> = ({
  items,
  total,
  limit,
}) => {
  const classes = useStyles();
  const page = usePage();
  const history = useHistory();

  const pageCount: number = useMemo(() => {
    if (total && limit) return Math.ceil(total / limit);
    return 0;
  }, [total, limit]);

  const categorySparklines: Record<string, SparklinesDataByCategory> = useMemo(
    () =>
      items.reduce(
        (res, item) => ({
          ...res,
          [item.url]: buildSparklinesDataForItem(item),
        }),
        {},
      ),
    [items],
  );

  return (
    <TableContainer>
      <Table className={classes.table} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Website URL</TableCell>
            {CATEGORIES.map(category => (
              <TableCell key={`${category}-label`}>
                {CATEGORY_LABELS[category]}
              </TableCell>
            ))}
            <TableCell>Last Report</TableCell>
            <TableCell>Last Audit Triggered</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(website => (
            <TableRow key={website.url}>
              <TableCell>
                <Link
                  style={{ padding: '0.75rem 0', display: 'inline-block' }}
                  href={`/lighthouse/audit/${website.lastAudit.id}`}
                >
                  {website.url}
                </Link>
              </TableCell>
              {CATEGORIES.map(category => (
                <TableCell
                  key={`${website.url}|${category}`}
                  style={{ minWidth: 120 }}
                >
                  <CategoryTrendline
                    data={categorySparklines[website.url][category] || []}
                  />
                </TableCell>
              ))}
              <TableCell style={{ whiteSpace: 'nowrap' }}>
                <AuditStatusIcon audit={website.lastAudit} />{' '}
                <span className={classes.status}>
                  {website.lastAudit.status.toLowerCase()}
                </span>
              </TableCell>
              <TableCell>
                {new Date(website.lastAudit.timeCreated).toString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pageCount > 1 && (
        <Pagination
          page={page}
          count={pageCount}
          onChange={(_event: Event, value: number) => {
            history.replace(`/lighthouse?page=${value}`);
          }}
        />
      )}
    </TableContainer>
  );
};

const AuditListTableConnected: FC<{}> = ({}) => {
  const lighthouseApi = useApi(lighthouseApiRef);
  const page = usePage();
  const { value, loading, error } = useAsync(
    async (): Promise<WebsiteListResponse> =>
      lighthouseApi.getWebsiteList({
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
      }),
    [page],
  );

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return (
    <AuditListTable
      items={value?.items || []}
      total={value?.total || 0}
      limit={value?.limit || 0}
      offset={value?.offset || 0}
    />
  );
};

export default AuditListTableConnected;
