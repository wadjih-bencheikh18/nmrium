import { WorkspaceData } from './Workspace';

export const workspaceDefaultProperties: Required<WorkspaceData> = {
  display: {
    general: {
      hideGeneralSettings: false,
      experimentalFeatures: { display: false },
      hidePanelOnLoad: false,
    },

    panels: {
      spectraPanel: { display: false, open: false },
      informationPanel: { display: false, open: false },
      integralsPanel: { display: false, open: false },
      rangesPanel: { display: false, open: false },
      structuresPanel: { display: false, open: false },
      filtersPanel: { display: false, open: false },
      zonesPanel: { display: false, open: false },
      automaticAssignmentPanel: { display: false, open: false },
      databasePanel: { display: false, open: false },
      multipleSpectraAnalysisPanel: { display: false, open: false },
      peaksPanel: { display: false, open: false },
      predictionPanel: { display: false, open: false },
      summaryPanel: { display: false, open: false },
    },
    toolBarButtons: {
      baselineCorrection: false,
      exclusionZones: false,
      exportAs: false,
      fastFourierTransform: false,
      import: false,
      integral: false,
      multipleSpectraAnalysis: false,
      phaseCorrection: false,
      rangePicking: false,
      realImaginary: false,
      slicing: false,
      spectraCenterAlignments: false,
      spectraStackAlignments: false,
      apodization: false,
      zeroFilling: false,
      zonePicking: false,
      zoomOut: false,
      zoom: false,
      peakPicking: false,
    },
  },

  general: {
    dimmedSpectraOpacity: 0.1,
  },
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
      keepFID: true,
      keepFT: true,
      keep1D: true,
      keep2D: true,
      onlyReal: false,
    },
    bruker: {
      onlyFirstProcessedData: true,
    },
  },
};
