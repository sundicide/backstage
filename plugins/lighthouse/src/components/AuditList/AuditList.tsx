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

import React, { useState, FC } from 'react';
import { useLocalStorage } from 'react-use';
import { Grid, Button } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  pageTheme,
  Content,
  ContentHeader,
  HeaderLabel,
} from '@backstage/core';

import AuditListTable from './AuditListTable';
import LighthouseSupportButton from '../shared/LighthouseSupportButton';
import LighthouseIntro, { LIGHTHOUSE_INTRO_LOCAL_STORAGE } from './LighthouseIntro';

const AuditList: FC<{}> = () => {
  const [dismissedStored] = useLocalStorage(LIGHTHOUSE_INTRO_LOCAL_STORAGE);
  const [dismissed, setDismissed] = useState(dismissedStored);
  return (
    <Page theme={pageTheme.tool}>
      <Header title="Lighthouse" subtitle="Website audits powered by Lighthouse">
        <HeaderLabel label="Owner" value="Spotify" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <LighthouseIntro onDismiss={() => setDismissed(true)} />
        <ContentHeader title="Audits" description="View all audits run for your website through Backstage here. Track the trend of your most recent audits.">
          <Button
            variant="contained"
            color="primary"
            href="/lighthouse/create-audit"
          >
            Create Audit
          </Button>
          {dismissed && (<LighthouseSupportButton />)}
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <InfoCard>
              <AuditListTable />
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};

export default AuditList;
