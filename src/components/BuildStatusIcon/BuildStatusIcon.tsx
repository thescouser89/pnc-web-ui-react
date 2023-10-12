import { Tooltip } from '@patternfly/react-core';
import { ExclamationTriangleIcon, OutlinedClockIcon } from '@patternfly/react-icons';

import { Build, GroupBuild } from 'pnc-api-types-ts';

import { buildStatusData } from 'common/buildStatusData';

import { isBuild } from 'utils/entityRecognition';

import styles from './BuildStatusIcon.module.css';

const alignmentData = {
  PREFER_TEMPORARY: {
    tooltip: `Test build, which cannot be used for product release and which will be garbage collected during automatic cleaning. 
    Latest temporary dependencies' versions were preferred in alignment.`,
    className: 'icon-color-info',
  },
  PREFER_PERSISTENT: {
    tooltip: `Test build, which cannot be used for product release and which will be garbage collected during automatic cleaning. 
    Latest persistent dependencies' versions were preferred in alignment.`,
    className: 'icon-color-warning',
  },
  NOT_SPECIFIED: {
    tooltip: `Test build, which cannot be used for product release and which will be garbage collected during automatic
    cleaning. Alignment Preference was not defined.`,
    className: 'icon-color-info',
  },
};

interface IBuildStatusIcon {
  build: Build | GroupBuild;
  long?: boolean;
}

/**
 * Represents a component for displaying the status of a build/groupBuild in form of an icon.
 * There are two versions: short (default) and long.
 *
 * Long version additionally also includes the status in the text format next to the icon.
 *
 * @param build - Build or GroupBuild
 * @param long - Whether the component should be of the long version
 */
export const BuildStatusIcon = ({ build, long }: IBuildStatusIcon) => {
  const selectedIconData = build.status ? buildStatusData[build.status] : buildStatusData.UNKNOWN;
  const selectedIconImage = selectedIconData.icon;
  const isCorrupted =
    isBuild(build) &&
    ((build as Build).attributes?.POST_BUILD_REPO_VALIDATION === 'REPO_SYSTEM_ERROR' ||
      (build as Build).attributes?.PNC_SYSTEM_ERROR === 'DISABLED_FIREWALL');

  return (
    <span className={styles['build-status-icon']}>
      <Tooltip removeFindDomNode content={<span>{selectedIconData.tooltip}</span>}>
        <img
          src={selectedIconImage}
          width="28px"
          height="28px"
          className={selectedIconData.className && styles[selectedIconData.className]}
          alt={selectedIconData.tooltip}
        />
      </Tooltip>
      {isCorrupted && (
        <Tooltip
          removeFindDomNode
          position="right"
          content={<span>The build may have completed successfully but has since been corrupted by a system error.</span>}
        >
          <ExclamationTriangleIcon />
        </Tooltip>
      )}
      {build.temporaryBuild && (
        <Tooltip
          removeFindDomNode
          position="right"
          content={<span>{alignmentData[build.alignmentPreference || 'NOT_SPECIFIED'].tooltip}</span>}
        >
          <OutlinedClockIcon className={styles[alignmentData[build.alignmentPreference || 'NOT_SPECIFIED'].className]} />
        </Tooltip>
      )}
      {long && build.status}
    </span>
  );
};
