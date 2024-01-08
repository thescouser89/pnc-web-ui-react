import { CodeEditor } from '@patternfly/react-code-editor';
import {
  ActionGroup,
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Select,
  SelectOption,
  Switch,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { useCallback, useEffect, useState } from 'react';

import { Environment, Product, ProductVersion } from 'pnc-api-types-ts';

import { buildConfigEntityAttributes } from 'common/buildConfigEntityAttributes';
import { buildTypeData } from 'common/buildTypeData';
import { PageTitles } from 'common/constants';
import { productEntityAttributes } from 'common/productEntityAttributes';

import { IFieldConfigs, IFieldValues, useForm } from 'hooks/useForm';
import { useParamsRequired } from 'hooks/useParamsRequired';
import { useServiceContainer } from 'hooks/useServiceContainer';
import { useTitle } from 'hooks/useTitle';

import { ContentBox } from 'components/ContentBox/ContentBox';
import { ExpandableSection } from 'components/ExpandableSection/ExpandableSection';
import { FormInput } from 'components/FormInput/FormInput';
import { PageLayout } from 'components/PageLayout/PageLayout';
import { SearchSelect } from 'components/SearchSelect/SearchSelect';
import { ServiceContainerCreatingUpdating } from 'components/ServiceContainers/ServiceContainerCreatingUpdating';
import { TooltipWrapper } from 'components/TooltipWrapper/TooltipWrapper';

import * as buildConfigApi from 'services/buildConfigApi';
import * as environmentApi from 'services/environmentApi';
import * as productApi from 'services/productApi';

import { maxLengthValidator255, validateBuildScript } from 'utils/formValidationHelpers';
import { generatePageTitle } from 'utils/titleHelper';

interface IBuildConfigCreateEditPageProps {
  isEditPage?: boolean;
}

const fieldConfigs = {
  name: {
    isRequired: true,
    validators: [maxLengthValidator255],
  },
  environment: {
    isRequired: true,
  },
  buildType: {
    isRequired: true,
    validators: [
      {
        validator: validateBuildScript,
        errorMessage: '',
        relatedFields: ['buildScript'],
      },
    ],
  },
  buildScript: {
    isRequired: true,
    validators: [
      {
        validator: validateBuildScript,
        errorMessage: "The 'deploy' goal is required for maven builds in order to prevent artifact promotion issues.",
        relatedFields: ['buildType'],
      },
    ],
  },
  brewPullActive: {
    value: false,
  },
} satisfies IFieldConfigs;

export const BuildConfigCreateEditPage = ({ isEditPage = false }: IBuildConfigCreateEditPageProps) => {
  const { buildConfigId } = useParamsRequired();

  // create page
  const serviceContainerCreatePage = useServiceContainer(buildConfigApi.createBuildConfig);

  // edit page - get method
  const serviceContainerEditPageGet = useServiceContainer(buildConfigApi.getBuildConfig);
  const serviceContainerEditPageGetRunner = serviceContainerEditPageGet.run;

  // edit page - patch method
  const serviceContainerEditPagePatch = useServiceContainer(buildConfigApi.patchBuildConfig);

  const [showProductVersionSection, setShowProductVersionSection] = useState<boolean>(false);

  const { register, getFieldValue, getFieldState, getFieldErrors, handleSubmit, isSubmitDisabled } = useForm();
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>();
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [selectedProductVersion, setSelectedProductVersion] = useState<ProductVersion>();

  const [showDeprecatedEnvironments, setShowDeprecatedEnvironments] = useState<boolean>(false);
  const [isBuildTypeSelectOpen, setIsBuildTypeSelectOpen] = useState<boolean>(false);

  const productVersionRegisterObject = register<string>(buildConfigEntityAttributes.productVersion.id);

  const fetchEnvironments = useCallback(
    (requestConfig = {}) => {
      return environmentApi.getEnvironments(
        { hidden: false, deprecated: !showDeprecatedEnvironments ? false : undefined },
        requestConfig
      );
    },
    [showDeprecatedEnvironments]
  );

  const fetchProductVersions = useCallback(
    (requestConfig = {}) => {
      return selectedProduct ? productApi.getProductVersions({ id: selectedProduct.id }, requestConfig) : Promise.resolve([]);
    },
    [selectedProduct]
  );

  useTitle(
    generatePageTitle({
      pageType: isEditPage ? 'Edit' : 'Create',
      serviceContainer: serviceContainerEditPageGet,
      firstLevelEntity: 'Build Config',
    })
  );

  const submitCreate = (data: IFieldValues) => {
    return Promise.resolve();
  };

  const submitEdit = (data: IFieldValues) => {
    return Promise.resolve();
  };

  useEffect(() => {
    if (isEditPage) {
      serviceContainerEditPageGetRunner({ serviceData: { id: buildConfigId } });
    }
  }, [isEditPage, buildConfigId, serviceContainerEditPageGetRunner]);

  const formComponent = (
    <>
      <ContentBox padding marginBottom>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <FormGroup
            isRequired
            label={buildConfigEntityAttributes.name.title}
            fieldId={buildConfigEntityAttributes.name.id}
            helperText={
              <FormHelperText isHidden={getFieldState(buildConfigEntityAttributes.name.id) !== 'error'} isError>
                {getFieldErrors(buildConfigEntityAttributes.name.id)}
              </FormHelperText>
            }
          >
            <TextInput
              isRequired
              type="text"
              id={buildConfigEntityAttributes.name.id}
              name={buildConfigEntityAttributes.name.id}
              autoComplete="off"
              {...register<string>(buildConfigEntityAttributes.name.id, fieldConfigs.name)}
            />
          </FormGroup>

          <FormGroup label={buildConfigEntityAttributes.description.title} fieldId={buildConfigEntityAttributes.description.id}>
            <TextArea
              id={buildConfigEntityAttributes.description.id}
              name={buildConfigEntityAttributes.description.id}
              autoResize
              resizeOrientation="vertical"
              {...register<string>(buildConfigEntityAttributes.description.id)}
            />
          </FormGroup>

          <FormGroup
            isRequired
            label={buildConfigEntityAttributes.environment.title}
            fieldId={buildConfigEntityAttributes.environment.id}
            helperText={
              <>
                <FormHelperText isHidden={getFieldState(buildConfigEntityAttributes.environment.id) !== 'error'} isError>
                  {getFieldErrors(buildConfigEntityAttributes.environment.id)}
                </FormHelperText>

                {selectedEnvironment?.deprecated && (
                  <HelperText>
                    <HelperTextItem hasIcon variant="warning">
                      Selected Environment is deprecated
                    </HelperTextItem>
                  </HelperText>
                )}
              </>
            }
          >
            <FormInput<string>
              {...register<string>(buildConfigEntityAttributes.environment.id, fieldConfigs.environment)}
              render={({ value, validated, onChange }) => (
                <SearchSelect
                  selectedItem={value}
                  validated={validated}
                  onSelect={(_, environment: Environment) => {
                    onChange(environment.description!);
                    setSelectedEnvironment(environment);
                  }}
                  onClear={() => {
                    onChange('');
                    setSelectedEnvironment(undefined);
                  }}
                  fetchCallback={fetchEnvironments}
                  titleAttribute="description"
                  placeholderText="Select Environment"
                  getCustomDescription={(environment: Environment) =>
                    environment.deprecated ? (
                      <>
                        <ExclamationTriangleIcon color="#F0AB00" /> DEPRECATED
                      </>
                    ) : null
                  }
                />
              )}
            />
            <Checkbox
              id="show-deprecated"
              label="Show also deprecated"
              isChecked={showDeprecatedEnvironments}
              onChange={(checked) => {
                setShowDeprecatedEnvironments(checked);
              }}
              className="m-t-5"
            />
          </FormGroup>

          <FormGroup
            isRequired
            label={buildConfigEntityAttributes.buildType.title}
            fieldId={buildConfigEntityAttributes.buildType.id}
            helperText={
              <FormHelperText isHidden={getFieldState(buildConfigEntityAttributes.buildType.id) !== 'error'} isError>
                {getFieldErrors(buildConfigEntityAttributes.buildType.id)}
              </FormHelperText>
            }
          >
            <FormInput<string>
              {...register<string>(buildConfigEntityAttributes.buildType.id, fieldConfigs.buildType)}
              render={({ value, validated, onChange, onBlur }) => (
                <Select
                  menuAppendTo="parent"
                  id={buildConfigEntityAttributes.buildType.id}
                  name={buildConfigEntityAttributes.buildType.id}
                  variant="single"
                  isOpen={isBuildTypeSelectOpen}
                  selections={value || undefined}
                  validated={validated}
                  onToggle={setIsBuildTypeSelectOpen}
                  onSelect={(_, buildType, isPlaceholder) => {
                    if (!isPlaceholder) {
                      onChange(buildType as string);
                      setIsBuildTypeSelectOpen(false);
                    }
                  }}
                  onBlur={onBlur}
                  hasPlaceholderStyle
                  placeholderText="Select Build type"
                >
                  {buildConfigEntityAttributes.buildType.values.map((buildType, index) => (
                    <SelectOption key={index} value={buildType}>
                      {buildTypeData[buildType].title}
                    </SelectOption>
                  ))}
                </Select>
              )}
            />
          </FormGroup>

          <FormGroup
            isRequired
            label={buildConfigEntityAttributes.buildScript.title}
            fieldId={buildConfigEntityAttributes.buildScript.id}
            helperText={
              <FormHelperText isHidden={getFieldState(buildConfigEntityAttributes.buildScript.id) !== 'error'} isError>
                {getFieldErrors(buildConfigEntityAttributes.buildScript.id)}
              </FormHelperText>
            }
          >
            <FormInput<string>
              {...register<string>(buildConfigEntityAttributes.buildScript.id, fieldConfigs.buildScript)}
              render={({ value, onChange }) => (
                <CodeEditor code={value} onChange={onChange} isLineNumbersVisible height="250px" />
              )}
            />
          </FormGroup>

          <FormGroup
            label={buildConfigEntityAttributes.brewPullActive.title}
            fieldId={buildConfigEntityAttributes.brewPullActive.id}
          >
            <FormInput<boolean>
              {...register<boolean>(buildConfigEntityAttributes.brewPullActive.id, fieldConfigs.brewPullActive)}
              render={({ value, onChange, onBlur }) => {
                const isDisabled = getFieldValue(buildConfigEntityAttributes.buildType.id) === buildTypeData.NPM.id;

                return (
                  <TooltipWrapper tooltip={isDisabled ? 'Cannot set Brew pull active for the NPM build type.' : undefined}>
                    <Switch
                      id={buildConfigEntityAttributes.brewPullActive.id}
                      name={buildConfigEntityAttributes.brewPullActive.id}
                      label="Enabled"
                      labelOff="Disabled"
                      isChecked={!isDisabled ? value : false}
                      onChange={onChange}
                      onBlur={onBlur}
                      isDisabled={isDisabled}
                    />
                  </TooltipWrapper>
                );
              }}
            />
          </FormGroup>
        </Form>
      </ContentBox>

      <ExpandableSection
        title="Product Version"
        isExpanded={showProductVersionSection}
        onToggle={(isExpanded) => setShowProductVersionSection(isExpanded)}
      >
        <ContentBox padding>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <FormGroup label={`Product ${productEntityAttributes.name.title}`} fieldId={productEntityAttributes.name.id}>
              <SearchSelect
                selectedItem={selectedProduct?.name}
                onSelect={(_, product: Product) => {
                  setSelectedProduct(product);
                  productVersionRegisterObject.onChange('');
                  setSelectedProductVersion(undefined);
                }}
                onClear={() => {
                  setSelectedProduct(undefined);
                  productVersionRegisterObject.onChange('');
                  setSelectedProductVersion(undefined);
                }}
                fetchCallback={productApi.getProducts}
                titleAttribute="name"
                placeholderText="Select Product"
              />
            </FormGroup>

            <FormGroup
              isRequired={!!selectedProduct}
              label={buildConfigEntityAttributes.productVersion.title}
              fieldId={buildConfigEntityAttributes.productVersion.id}
              helperText={
                <FormHelperText isHidden={!selectedProduct || !!selectedProductVersion} isError>
                  Field must be filled.
                </FormHelperText>
              }
            >
              <FormInput<string>
                {...productVersionRegisterObject}
                render={({ value, validated, onChange }) => (
                  <SearchSelect
                    selectedItem={value}
                    validated={validated}
                    onSelect={(_, productVersion: ProductVersion) => {
                      onChange(productVersion.version);
                      setSelectedProductVersion(productVersion);
                    }}
                    onClear={() => {
                      onChange('');
                      setSelectedProductVersion(undefined);
                    }}
                    fetchCallback={fetchProductVersions}
                    titleAttribute="version"
                    placeholderText="Select Version"
                    isDisabled={!selectedProduct}
                  />
                )}
              />
            </FormGroup>
          </Form>
        </ContentBox>
      </ExpandableSection>

      <ContentBox marginTop background={false} shadow={false}>
        <ActionGroup>
          <Button
            variant="primary"
            isDisabled={isSubmitDisabled || (selectedProduct && !selectedProductVersion)}
            onClick={handleSubmit(isEditPage ? submitEdit : submitCreate)}
          >
            {isEditPage ? PageTitles.buildConfigEdit : PageTitles.buildConfigCreate}
          </Button>
        </ActionGroup>
      </ContentBox>
    </>
  );

  return (
    <PageLayout
      title={isEditPage ? PageTitles.buildConfigEdit : PageTitles.buildConfigCreate}
      description={
        isEditPage ? <>You can update current Build Config attributes below.</> : <>You can create a new Build Config.</>
      }
    >
      {isEditPage ? (
        <ServiceContainerCreatingUpdating
          {...serviceContainerEditPagePatch}
          serviceContainerLoading={serviceContainerEditPageGet}
          title="Build Config"
        >
          {formComponent}
        </ServiceContainerCreatingUpdating>
      ) : (
        <ServiceContainerCreatingUpdating {...serviceContainerCreatePage}>{formComponent}</ServiceContainerCreatingUpdating>
      )}
    </PageLayout>
  );
};