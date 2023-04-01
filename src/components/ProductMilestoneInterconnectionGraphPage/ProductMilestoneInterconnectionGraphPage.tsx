import { Button, Label, NumberInput, SearchInput, Switch, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useFullscreen } from 'hooks/useFullscreen';
import { useQueryParamsEffect } from 'hooks/useQueryParamsEffect';
import { useServiceContainer } from 'hooks/useServiceContainer';

import { ArtifactsList } from 'components/ArtifactsList/ArtifactsList';
import { ContentBox } from 'components/ContentBox/ContentBox';
import { FullscreenButton } from 'components/FullscreenButton/FullscreenButton';
import { ProductMilestoneInterconnectionGraph } from 'components/NetworkGraphs/ProductMilestoneInterconnectionGraph';
import { useServiceContainerMilestone } from 'components/ProductMilestonePages/ProductMilestonePages';
import { ProductMilestoneReleaseLabel } from 'components/ProductMilestoneReleaseLabel/ProductMilestoneReleaseLabel';
import { ServiceContainerLoading } from 'components/ServiceContainers/ServiceContainerLoading';
import { Toolbar } from 'components/Toolbar/Toolbar';
import { ToolbarItem } from 'components/Toolbar/ToolbarItem';
import { TooltipWrapper } from 'components/TooltipWrapper/TooltipWrapper';

import * as productMilestoneApi from 'services/productMilestoneApi';

import { updateQueryParamsInURL } from 'utils/queryParamsHelper';

import styles from './ProductMilestoneInterconnectionGraphPage.module.css';

const sharedDeliveredArtifactsListColumns = ['identifier', 'product.name', 'productMilestone.version', 'build'];

interface IProductMilestoneInterconnectionGraphPageProps {
  componentId?: string;
}

export const ProductMilestoneInterconnectionGraphPage = ({
  componentId = 'a1',
}: IProductMilestoneInterconnectionGraphPageProps) => {
  const { productMilestoneId } = useParams();

  const location = useLocation();
  const navigate = useNavigate();

  const { serviceContainerMilestone } = useServiceContainerMilestone();

  const serviceContainerInterconnectionGraph = useServiceContainer(productMilestoneApi.getInterconnectionGraph);
  const serviceContainerInterconnectionGraphRunner = serviceContainerInterconnectionGraph.run;

  const serviceContainerSharedDeliveredArtifacts = useServiceContainer(productMilestoneApi.getSharedDeliveredArtifacts);
  const serviceContainerSharedDeliveredArtifactsRunner = serviceContainerSharedDeliveredArtifacts.run;

  const serviceContainerProductMilestone1 = useServiceContainer(productMilestoneApi.getProductMilestone);
  const serviceContainerProductMilestone1Runner = serviceContainerProductMilestone1.run;
  const serviceContainerProductMilestone2 = useServiceContainer(productMilestoneApi.getProductMilestone);
  const serviceContainerProductMilestone2Runner = serviceContainerProductMilestone2.run;

  const [hasLimitedNesting, setHasLimitedNesting] = useState<boolean>(true);
  const [nestingLevel, setNestingLevel] = useState<number>(10);
  const [searchValueProduct, setSearchValueProduct] = useState<string>('');
  const [searchValueProductMilestone, setSearchValueProductMilestone] = useState<string>('');
  const [showSharedDeliveredArtifactsList, setShowSharedDeliveredArtifactsList] = useState<boolean>(false);

  const graphDivRef = useRef<HTMLDivElement>(null);
  const graphContentOffet = (graphDivRef.current?.children[1] as any)?.offsetTop;
  const sharedDeliveredArtifactsListTopRef = useRef<HTMLDivElement>(null);

  const { isFullscreen } = useFullscreen();

  const loadSharedDeliveredArtifacts = useCallback(
    (milestone1: any, milestone2: any) => {
      updateQueryParamsInURL(
        { milestone1: milestone1 ? milestone1.id : '', milestone2: milestone2 ? milestone2.id : '', pageIndex: 1 },
        componentId,
        location,
        navigate
      );
    },
    [componentId, location, navigate]
  );

  useEffect(() => {
    serviceContainerInterconnectionGraphRunner({
      serviceData: { id: productMilestoneId },
    });
  }, [serviceContainerInterconnectionGraphRunner, productMilestoneId]);

  useQueryParamsEffect(
    ({ requestConfig } = {}) => {
      serviceContainerSharedDeliveredArtifactsRunner({ requestConfig });
      serviceContainerProductMilestone1Runner({ serviceData: { id: requestConfig?.params.milestone1 } });
      serviceContainerProductMilestone2Runner({ serviceData: { id: requestConfig?.params.milestone2 } });
    },
    {
      componentId,
      mandatoryQueryParams: { pagination: true, sorting: true, milestone: true },
    }
  );

  // URL -> UI
  useQueryParamsEffect(
    ({ requestConfig } = {}) => {
      if (requestConfig?.params.milestone1 && requestConfig?.params.milestone2) {
        setShowSharedDeliveredArtifactsList(true);
        // scroll to the list when edge in the graph is selected
        sharedDeliveredArtifactsListTopRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setShowSharedDeliveredArtifactsList(false);
      }
    },
    { componentId, mandatoryQueryParams: { pagination: false, sorting: false } }
  );

  return (
    <>
      <Toolbar>
        <ToolbarItem>
          <TextContent>
            <Text component={TextVariants.h2}>Product Milestone Interconnection Graph</Text>
          </TextContent>
          <TextContent>
            <Text component={TextVariants.p}>
              Edges interconnect Product Milestones sharing Delivered Artifacts. Edge number is the number of shared Delivered
              Artifacts between the two Milestones. Clicking on the edge displays the list of shared Delivered Artifacts. Nesting
              level (relative to the node of the Milestone of this page) can be set to limit the graph size. Nodes can be selected
              by clicking on them to make the graph more readable. Double clicking on the node opens Milestone detail page. Hold{' '}
              <Label>shift</Label> and click the node to drag it.
            </Text>
          </TextContent>
        </ToolbarItem>
      </Toolbar>

      <div ref={graphDivRef} className="position-relative">
        <Toolbar borderTop>
          <ToolbarItem>
            <SearchInput
              placeholder="Find Product"
              value={searchValueProduct}
              onChange={(_, value) => setSearchValueProduct(value)}
              onClear={() => setSearchValueProduct('')}
            />
          </ToolbarItem>
          <ToolbarItem>
            <SearchInput
              placeholder="Find Milestone"
              value={searchValueProductMilestone}
              onChange={(_, value) => setSearchValueProductMilestone(value)}
              onClear={() => setSearchValueProductMilestone('')}
            />
          </ToolbarItem>
          <ToolbarItem>
            <Switch
              label="Limit nesting"
              labelOff="Limit nesting"
              isChecked={hasLimitedNesting}
              onChange={(checked) => setHasLimitedNesting(checked)}
            />
          </ToolbarItem>
          <ToolbarItem>
            <NumberInput
              min={0}
              isDisabled={!hasLimitedNesting}
              value={nestingLevel}
              onChange={(event: React.FormEvent<HTMLInputElement>) => {
                const value = (event.target as HTMLInputElement).value;
                setNestingLevel(+value);
              }}
              onMinus={() => setNestingLevel((prevNestingLevel) => prevNestingLevel - 1)}
              onPlus={() => setNestingLevel((prevNestingLevel) => prevNestingLevel + 1)}
            />
          </ToolbarItem>
        </Toolbar>

        <ContentBox marginBottom borderTop contentHeight={isFullscreen ? `calc(100vh - ${graphContentOffet}px)` : '60vh'}>
          <ServiceContainerLoading
            {...serviceContainerInterconnectionGraph}
            hasSkeleton
            title="Product Milestone Interconnection Graph"
          >
            <ProductMilestoneInterconnectionGraph
              data={serviceContainerInterconnectionGraph.data}
              mainNode={serviceContainerMilestone.data.version}
              hasLimitedNesting={hasLimitedNesting}
              nestingLevel={nestingLevel}
              searchValueMainLabel={searchValueProductMilestone}
              searchValueSubLabel={searchValueProduct}
              onEdgeSelected={loadSharedDeliveredArtifacts}
              componentId={componentId}
            />
          </ServiceContainerLoading>
        </ContentBox>
        <FullscreenButton containerRef={graphDivRef} />
      </div>

      {showSharedDeliveredArtifactsList && (
        <>
          <div ref={sharedDeliveredArtifactsListTopRef} />
          <Toolbar>
            <ToolbarItem>
              <TextContent>
                <Text component={TextVariants.h2}>
                  Shared Delivered Artifacts between{' '}
                  <ServiceContainerLoading {...serviceContainerProductMilestone1} variant="inline" title="Product Milestone">
                    <span className={styles['product-milestone-label']}>
                      <ProductMilestoneReleaseLabel
                        productMilestoneRelease={serviceContainerProductMilestone1.data}
                        isCurrent={false}
                      />
                    </span>
                  </ServiceContainerLoading>{' '}
                  and{' '}
                  <ServiceContainerLoading {...serviceContainerProductMilestone2} variant="inline" title="Product Milestone">
                    <span className={styles['product-milestone-label']}>
                      <ProductMilestoneReleaseLabel
                        productMilestoneRelease={serviceContainerProductMilestone2.data}
                        isCurrent={false}
                      />
                    </span>
                  </ServiceContainerLoading>
                </Text>
              </TextContent>
              <TextContent>
                <Text component={TextVariants.p}>Delivered Artifacts shared between the two Milestones.</Text>
              </TextContent>
            </ToolbarItem>
            <ToolbarItem alignRight>
              <TooltipWrapper tooltip="Close this table.">
                <Button
                  variant="plain"
                  onClick={() =>
                    updateQueryParamsInURL({ milestone1: '', milestone2: '', pageIndex: 1 }, componentId, location, navigate)
                  }
                >
                  <TimesIcon />
                </Button>
              </TooltipWrapper>
            </ToolbarItem>
          </Toolbar>
          <ArtifactsList
            columns={sharedDeliveredArtifactsListColumns}
            serviceContainerArtifacts={serviceContainerSharedDeliveredArtifacts}
            componentId={componentId}
          />
        </>
      )}
    </>
  );
};
