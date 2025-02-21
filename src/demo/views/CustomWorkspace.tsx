import { CustomWorkspaces } from '../../component/workspaces/Workspace';

import View from './View';

const customWorkspaces: CustomWorkspaces = {
  metabo: {
    display: {
      general: {
        hideGeneralSettings: false,
        experimentalFeatures: { display: false },
        hidePanelOnLoad: false,
      },
      panels: {
        spectraPanel: { display: true, open: true },
        informationPanel: { display: true, open: false },
        integralsPanel: { display: false, open: false },
        rangesPanel: { display: false, open: false },
        structuresPanel: { display: false, open: false },
        filtersPanel: { display: false, open: false },
        zonesPanel: { display: false, open: false },
        automaticAssignmentPanel: { display: false, open: false },
        databasePanel: { display: true, open: false },
        multipleSpectraAnalysisPanel: { display: true, open: true },
        peaksPanel: { display: false, open: false },
        predictionPanel: { display: false, open: false },
        summaryPanel: { display: false, open: false },
        matrixGenerationPanel: { display: true },
      },
      toolBarButtons: {
        baselineCorrection: false,
        exclusionZones: true,
        exportAs: true,
        fastFourierTransform: false,
        import: true,
        integral: false,
        multipleSpectraAnalysis: true,
        phaseCorrection: false,
        rangePicking: false,
        realImaginary: false,
        slicing: false,
        spectraCenterAlignments: false,
        spectraStackAlignments: true,
        apodization: false,
        zeroFilling: false,
        zonePicking: false,
        zoomOut: true,
        zoom: true,
        peakPicking: false,
      },
    },
    general: { dimmedSpectraOpacity: 0.1 },
    formatting: {
      nuclei: {
        '1h': { name: '1H', ppm: '0.00', hz: '0.00' },
        '13c': { name: '13C', ppm: '0.00', hz: '0.00' },
        '15n': { name: '15N', ppm: '0.00', hz: '0.00' },
        '19f': { name: '19F', ppm: '0.00', hz: '0.00' },
        '29si': { name: '29Si', ppm: '0.00', hz: '0.00' },
        '31p': { name: '31P', ppm: '0.00', hz: '0.00' },
      },
      panels: {},
    },
    databases: {
      defaultDatabase: '',
      data: [
        {
          key: 'toc',
          label: 'Toc',
          url: 'https://data.cheminfo.org/nmr/database/toc.json',
          enabled: true,
        },
      ],
    },
    nmrLoaders: {
      general: {
        keepFID: false,
        keepFT: true,
        keep1D: true,
        keep2D: false,
        onlyReal: true,
      },
      bruker: {
        onlyFirstProcessedData: true,
        processingNumbers: '',
        experimentNumbers: '',
      },
    },
    label: 'Metabolomics',
    version: 1,
  },
};

export default function CustomWorkspace(props) {
  return (
    <View {...props} workspace="metabo" customWorkspaces={customWorkspaces} />
  );
}
