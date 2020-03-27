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
import React, { useState, useEffect, ReactNode, FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAsync } from 'react-use';
import {
  makeStyles,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import {
  useApi,
  pageTheme,
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  Progress,
} from '@backstage/core';

import { lighthouseApiRef, Website, Audit } from '../../api';
import AuditStatusIcon from '../shared/AuditStatusIcon';
import LighthouseSupportButton from '../shared/LighthouseSupportButton';

const useStyles = makeStyles({
  // TODO this is trash-tier stuff, need someone who knows how grid works
  // to help me out here.
  card: {
    height: 'calc(100vh - 240px)',
  },
  iframe: {
    border: '0',
    width: '100%',
    height: '100%',
  },
});

interface AuditLinkListProps {
  audits?: Audit[];
  selectedId: string;
}
const AuditLinkList: FC<AuditLinkListProps> = ({
  audits = [],
  selectedId,
}: AuditLinkListProps) => (
  <List component="nav" aria-label="lighthouse audit history">
    {audits.map(audit => (
      <ListItem
        key={audit.id}
        selected={audit.id === selectedId}
        button
        component={Link}
        replace
        to={`/lighthouse/audit/${audit.id}`}
      >
        <ListItemIcon>
          <AuditStatusIcon audit={audit} />
        </ListItemIcon>
        <ListItemText primary={audit.timeCreated} />
      </ListItem>
    ))}
  </List>
);

const AuditView: FC<{}> = () => {
  const classes = useStyles();
  const params = useParams<{ id: string }>();
  const { url: lighthouseUrl } = useApi(lighthouseApiRef);
  return (
    <InfoCard cardClassName={classes.card}>
      <iframe
        className={classes.iframe}
        title="Lighthouse audit"
        src={`${lighthouseUrl}/v1/audits/${params.id}`}
      />
    </InfoCard>
  );
};

const ConnectedAuditView: FC<{}> = () => {
  const lighthouseApi = useApi(lighthouseApiRef);
  const params = useParams<{ id: string }>();

  const { loading, error, value: nextValue } = useAsync<Website>(
    async () => lighthouseApi.getWebsiteForAuditId(params.id),
    [params.id],
  );
  const [value, setValue] = useState<Website>();
  useEffect(() => {
    if (!!nextValue && nextValue.url !== value?.url) {
      setValue(nextValue);
    }
  }, [value, nextValue, setValue]);

  let content: ReactNode = null;
  if (value) {
    content = (
      <>
        <Grid item xs={3}>
          <AuditLinkList audits={value?.audits} selectedId={params.id} />
        </Grid>
        <Grid item xs={9}>
          <AuditView />
        </Grid>
      </>
    );
  } else if (loading) {
    content = (
      <Grid item xs={12}>
        <Progress />
      </Grid>
    );
  } else if (error) {
    content = (
      <Grid item xs={12}>
        <Alert severity="error">
          <span style={{ whiteSpace: 'pre' }}>{error.message}</span>
        </Alert>
      </Grid>
    );
  }

  let createAuditButtonUrl = '/lighthouse/create-audit';
  if (value?.url) {
    createAuditButtonUrl += `?url=${encodeURIComponent(value.url)}`;
  }

  return (
    <Page theme={pageTheme.tool}>
      <Header
        title="Lighthouse"
        subtitle="Website audits powered by Lighthouse"
      >
        <HeaderLabel label="Owner" value="Spotify" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader
          title={value?.url || 'Audit'}
          description="See a history of all Lighthouse audits for your website run through Backstage."
        >
          <Button
            variant="contained"
            color="primary"
            href={createAuditButtonUrl}
          >
            Create Audit
          </Button>
          <LighthouseSupportButton />
        </ContentHeader>
        <Grid container direction="row">
          {content}
        </Grid>
      </Content>
    </Page>
  );
};

export default ConnectedAuditView;
