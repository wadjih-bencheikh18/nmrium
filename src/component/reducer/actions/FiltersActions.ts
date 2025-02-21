import { v4 } from '@lukeed/uuid';
import { current, Draft } from 'immer';

import * as Filters from '../../../data/Filters';
import * as FiltersManager from '../../../data/FiltersManager';
import {
  apply as apodization,
  defaultApodizationOptions,
} from '../../../data/data1d/filter1d/apodization';
import { apply as autoPhaseCorrection } from '../../../data/data1d/filter1d/autoPhaseCorrection';
import { apply as baselineCorrection } from '../../../data/data1d/filter1d/baselineCorrection';
import { apply as phaseCorrection } from '../../../data/data1d/filter1d/phaseCorrection';
import { apply as zeroFilling } from '../../../data/data1d/filter1d/zeroFilling';
import { Datum1D } from '../../../data/types/data1d';
import { Datum2D } from '../../../data/types/data2d';
import { options } from '../../toolbar/ToolTypes';
import { getSpectraByNucleus } from '../../utility/getSpectraByNucleus';
import nucleusToString from '../../utility/nucleusToString';
import { State } from '../Reducer';
import zoomHistoryManager from '../helper/ZoomHistoryManager';
import { getActiveSpectrum } from '../helper/getActiveSpectrum';
import { getActiveSpectrumOrFail } from '../helper/getActiveSpectrumOrFail';
import getRange from '../helper/getRange';
import { getStrongestPeak } from '../helper/getStrongestPeak';

import { setDomain, setMode } from './DomainActions';
import { applySignalProcessingFilter } from './MatrixGenerationAction';
import { changeSpectrumVerticalAlignment } from './PreferencesActions';
import { resetSelectedTool } from './ToolsActions';

function shiftSpectrumAlongXAxis(draft: Draft<State>, shiftValue) {
  //apply filter into the spectrum

  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const index = activeSpectrum?.index;

  FiltersManager.applyFilter(draft.data[index], [
    { name: Filters.shiftX.id, options: shiftValue },
  ]);
  resetSelectedTool(draft);
  setDomain(draft);
}

function applyZeroFillingFilter(draft: Draft<State>, action) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const index = activeSpectrum.index;
  const { size } = action.payload;
  const filters = [
    {
      name: Filters.zeroFilling.id,
      options: size,
    },
  ];
  FiltersManager.applyFilter(draft.data[index], filters);
  resetSelectedTool(draft);
  setDomain(draft);
  setMode(draft);
}

function calculateApodizationFilter(draft: Draft<State>, action) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const index = activeSpectrum.index;
  const options = action.payload;
  const {
    data: { x, re, im },
    info,
  } = draft.data[index] as Datum1D;

  let _data = { data: { x, re, im }, info };
  draft.toolOptions.data.apodizationOptions = options;
  apodization(_data as Datum1D, options);
  const { im: newIm, re: newRe } = _data.data;
  draft.tempData[index].data.im = newIm;
  draft.tempData[index].data.re = newRe;
}

function applyApodizationFilter(draft: Draft<State>, action) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const index = activeSpectrum.index;
  const options = action.payload;
  const filters = [
    {
      name: Filters.apodization.id,
      options,
    },
  ];
  FiltersManager.applyFilter(draft.data[index], filters);
  resetSelectedTool(draft);
  setDomain(draft);
  setMode(draft);
}

function calculateZeroFillingFilter(draft: Draft<State>, action) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const index = activeSpectrum.index;
  const { size } = action.payload;
  const {
    data: { x, re, im },
    filters,
    info,
  } = draft.data[index] as Datum1D;

  let _data = { data: { x, re, im }, filters, info };
  zeroFilling(_data as Datum1D, size);
  const { im: newIm, re: newRe, x: newX } = _data.data;
  draft.tempData[index].data.x = newX;
  draft.tempData[index].data.im = newIm;
  draft.tempData[index].data.re = newRe;
  draft.xDomain = [newX[0], newX[newX.length - 1]];
}
function applyFFTFilter(draft: Draft<State>) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const { index } = activeSpectrum;

  //apply filter into the spectrum
  FiltersManager.applyFilter(draft.data[index], [
    { name: Filters.fft.id, options: {} },
  ]);
  resetSelectedTool(draft);
  changeSpectrumVerticalAlignment(draft, { align: 'bottom' });

  setDomain(draft, { yDomain: { isChanged: true } });
  setMode(draft);
}
function applyManualPhaseCorrectionFilter(draft: Draft<State>, filterOptions) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const { index } = activeSpectrum;
  const { ph0, ph1 } = filterOptions;

  FiltersManager.applyFilter(draft.data[index], [
    {
      name: Filters.phaseCorrection.id,
      options: { ph0, ph1, absolute: false },
    },
  ]);

  resetSelectedTool(draft);
  draft.tempData = null;
  setDomain(draft);
}
function applyAbsoluteFilter(draft: Draft<State>) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const { index } = activeSpectrum;
  FiltersManager.applyFilter(draft.data[index], [
    {
      name: Filters.phaseCorrection.id,
      options: { absolute: true, ph0: 0, ph1: 0 },
    },
  ]);

  resetSelectedTool(draft);
  draft.tempData = null;
  setDomain(draft);
}

function applyAutoPhaseCorrectionFilter(draft: Draft<State>) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const { index } = activeSpectrum;

  const { ph0, ph1 } = autoPhaseCorrection(draft.data[index] as Datum1D);

  FiltersManager.applyFilter(draft.data[index], [
    {
      name: Filters.phaseCorrection.id,
      options: { ph0, ph1, absolute: false },
    },
  ]);

  resetSelectedTool(draft);
  draft.tempData = null;
  setDomain(draft);
}

function calculateBaseLineCorrection(draft: Draft<State>, action?) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const { index } = activeSpectrum;
  const {
    data: { x, re, im },
    info,
  } = draft.data[index] as Datum1D;
  // save the baseline options temporary
  draft.toolOptions.data.baselineCorrection = {
    ...draft.toolOptions.data.baselineCorrection,
    ...(action?.options ? { options: action.options } : {}),
  };

  const { zones, options } = draft.toolOptions.data.baselineCorrection;
  const { livePreview, ...filterOptions } = options;
  if (livePreview) {
    let _data = { data: { x, re, im }, info };
    baselineCorrection(_data as Datum1D, {
      zones,
      ...filterOptions,
    });
    const { im: newIm, re: newRe } = _data.data;
    draft.tempData[index].data.im = newIm;
    draft.tempData[index].data.re = newRe;
  }
}
function calculateManualPhaseCorrection(draft: Draft<State>, filterOptions) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const { index } = activeSpectrum;
  const datum = draft.data[index] as Datum1D;

  const {
    data: { x, re, im },
    info,
  } = datum;

  const { ph0, ph1 } = filterOptions;
  let _data = { data: { x, re, im }, info };
  phaseCorrection(_data as Datum1D, { ph0, ph1 });
  const { im: newIm, re: newRe } = _data.data;
  draft.tempData[index].data.im = newIm;
  draft.tempData[index].data.re = newRe;
}

function enableFilter(draft: Draft<State>, filterID, checked) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);

  const { index } = activeSpectrum;

  //apply filter into the spectrum
  FiltersManager.enableFilter(draft.data[index], filterID, checked);

  resetSelectedTool(draft);
  setDomain(draft);
  setMode(draft);

  const zoomHistory = zoomHistoryManager(
    draft.zoom.history,
    draft.view.spectra.activeTab,
  );
  const zoomValue = zoomHistory.getLast();
  if (zoomValue) {
    draft.xDomain = zoomValue.xDomain;
    draft.yDomain = zoomValue.yDomain;
  }
}

function deleteFilter(draft: Draft<State>, actions) {
  const filterID = actions.payload.id;
  const activeSpectrum = getActiveSpectrumOrFail(draft);

  const { index } = activeSpectrum;
  //apply filter into the spectrum
  FiltersManager.deleteFilter(draft.data[index], filterID);

  resetSelectedTool(draft);
  setDomain(draft);
  setMode(draft);
}
function deleteSpectraFilter(draft: Draft<State>, actions) {
  const filterType = actions.payload.filterType;

  if (draft.view.spectra.activeTab) {
    for (const datum of draft.data) {
      if (
        nucleusToString(datum?.info?.nucleus) === draft.view.spectra.activeTab
      ) {
        const filtersResult =
          datum.filters?.filter((filter) => filter.name === filterType) || [];

        for (const filter of filtersResult) {
          FiltersManager.deleteFilter(datum, filter.id);
        }
      }
    }

    resetSelectedTool(draft);
    setDomain(draft);
    setMode(draft);
  }
}

function handleBaseLineCorrectionFilter(draft: Draft<State>, action) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const { index } = activeSpectrum;

  const { zones } = draft.toolOptions.data.baselineCorrection;
  const { livePreview, ...options } = action.options;

  FiltersManager.applyFilter(draft.data[index], [
    {
      name: Filters.baselineCorrection.id,
      options: {
        zones,
        ...options,
      },
    },
  ]);

  const xDomainSnapshot = draft.xDomain.slice();

  resetSelectedTool(draft);
  setDomain(draft);
  draft.xDomain = xDomainSnapshot;
}

/**
 * reset spectrum data for specific point of time (Filter)
 * @param {object} draft
 * @param {object} options
 * @param {string}   options.id Filter id
 * @param {boolean=} options.resetTool
 * @param {boolean=} options.updateDomain
 * @param {boolean=} options.rollback
 */

function resetSpectrumByFilter(
  draft: Draft<State>,
  options?: {
    rollback?: boolean;
    resetTool?: boolean;
    updateDomain?: boolean;
    applyFilter?: boolean;
    searchBy?: 'id' | 'name';
    filterId?: string | null;
  },
) {
  const {
    updateDomain = true,
    rollback = false,
    searchBy = 'id',
    applyFilter = false, // the filter that we rollback and return the affect data for the selected spectrum
    filterId,
  } = options || {};

  let currentDatum: any = null;

  const currentActiveSpectrum = getActiveSpectrumOrFail(draft);

  const index = currentActiveSpectrum.index;
  const datum = draft.data[index] as Datum1D | Datum2D;

  if (filterId && draft.toolOptions.data.activeFilterID !== filterId) {
    const filterIndex = datum.filters.findIndex(
      (f) => f[searchBy] === filterId,
    );
    let filters: any[] = [];
    if (filterIndex !== -1) {
      filters = datum.filters.slice(
        0,
        rollback ? filterIndex : filterIndex + 1,
      );

      if (filters.length > 0) {
        draft.toolOptions.data.activeFilterID =
          datum.filters[rollback ? filterIndex - 1 : filterIndex]?.id;
      } else {
        draft.toolOptions.data.activeFilterID = null;
      }

      FiltersManager.reapplyFilters(datum, filters);

      if (applyFilter) {
        const { name, value: options } = datum.filters[filterIndex];
        const newDatum = current(draft).data[index];
        if (newDatum.info?.dimension === 1) {
          FiltersManager.applyFilter(newDatum, [{ name, options }]);
        }

        currentDatum = { datum: newDatum, index };
      }
    }
  } else {
    //close filter snapshot mode and replay all enabled filters
    draft.toolOptions.data.activeFilterID = null;
    FiltersManager.reapplyFilters(datum);
  }

  if (updateDomain) {
    setDomain(draft);
    setMode(draft);
  }
  if (applyFilter) {
    return currentDatum;
  }
}

function filterSnapshotHandler(draft: Draft<State>, action) {
  const { filterId } = action.payload;
  resetSpectrumByFilter(draft, { filterId });
}

function handleMultipleSpectraFilter(draft: Draft<State>, action) {
  const spectra = getSpectraByNucleus(draft.view.spectra.activeTab, draft.data);

  if (spectra && spectra.length > 0 && Array.isArray(action.payload)) {
    const exclusions =
      spectra[0].filters.find((f) => f.name === Filters.exclusionZones.id)
        ?.value || [];

    for (const spectrum of spectra) {
      const filters = action.payload.map((filter) => {
        if (filter.name === Filters.equallySpaced.id) {
          return {
            ...filter,
            options: { ...filter.options, exclusions },
          };
        }
        return filter;
      });

      FiltersManager.applyFilter(spectrum, filters);
    }
  }
  setDomain(draft);
}

function handleSignalProcessingFilter(draft: Draft<State>, action) {
  const { view } = draft;
  const nucleus = view.spectra.activeTab;

  const { options } = action.payload;

  view.matrixGeneration[nucleus] = options;

  applySignalProcessingFilter(draft);
}

function handleAddExclusionZone(draft: Draft<State>, action) {
  const { from: startX, to: endX } = action.payload;
  const range = getRange(draft, { startX, endX });

  let spectra: Datum1D[];

  const activeSpectrum = getActiveSpectrum(draft);
  if (activeSpectrum?.id) {
    const index = activeSpectrum?.index;
    spectra = [draft.data[index] as Datum1D];
  } else {
    spectra = getSpectraByNucleus(
      draft.view.spectra.activeTab,
      draft.data,
    ) as Datum1D[];
  }

  for (const spectrum of spectra) {
    FiltersManager.applyFilter(spectrum, [
      {
        name: Filters.exclusionZones.id,
        options: [
          {
            id: v4(),
            from: range[0],
            to: range[1],
          },
        ],
      },
    ]);
  }

  setDomain(draft);
}

function handleDeleteExclusionZone(draft: Draft<State>, action) {
  const { zone, spectrumID } = action.payload;

  // if spectrum id exists, remove the selected exclusion zone in the spectrum
  if (spectrumID) {
    const spectrumIndex = draft.data.findIndex(
      (spectrum) => spectrum.id === spectrumID,
    );
    const filter = draft.data[spectrumIndex].filters.find(
      (_filter) => _filter.name === Filters.exclusionZones.id,
    );
    if (filter) {
      if (filter.value.length === 1) {
        FiltersManager.deleteFilter(draft.data[spectrumIndex], filter.id);
      } else {
        filter.value = filter.value.filter((_zone) => _zone.id !== zone?.id);
        FiltersManager.reapplyFilters(draft.data[spectrumIndex]);
      }
    }
  } else {
    // remove all exclusion zones that have the same range in all spectra
    const data = getSpectraByNucleus(draft.view.spectra.activeTab, draft.data);
    for (const datum of data) {
      for (const filter of datum.filters) {
        if (filter.name === Filters.exclusionZones.id) {
          filter.value = filter.value.filter(
            (_zone) => zone.from !== _zone.from && zone.to !== _zone.to,
          );
          FiltersManager.reapplyFilters(datum);
        }
      }
    }
  }
}

function handleDisableFilterLivePreview(draft: Draft<State>, action) {
  const { selectedTool } = action.payload;

  setFilterChanges(draft, selectedTool);
  if (selectedTool === options.zeroFilling.id) {
    setDomain(draft, { yDomain: { isChanged: false } });
  }
}

function checkFilterHasTempData(selectedToolId: string) {
  return [
    options.phaseCorrection.id,
    options.baselineCorrection.id,
    options.apodization.id,
    options.zeroFilling.id,
  ].includes(selectedToolId);
}

function setFilterChanges(draft: Draft<State>, selectedFilterID) {
  const activeSpectrum = getActiveSpectrumOrFail(draft);
  const activeSpectrumId = activeSpectrum.id;

  // If the user selects the filter from the filters list or selects its tool and has a record in the filter list for preview and edit
  if (checkFilterHasTempData(selectedFilterID)) {
    //return back the spectra data to point of time before applying a specific filter

    const isPhaseCorrection = selectedFilterID === options.phaseCorrection.id;
    const updateDomain = [
      options.zeroFilling.id,
      options.apodization.id,
    ].includes(selectedFilterID);

    const rollbackSpectrumData = resetSpectrumByFilter(draft, {
      updateDomain,
      rollback: true,
      searchBy: 'name',
      filterId: selectedFilterID,
      applyFilter: isPhaseCorrection,
    });

    // create a temporary clone of the data

    draft.tempData = current(draft).data;

    if (rollbackSpectrumData) {
      draft.tempData[rollbackSpectrumData?.index] = rollbackSpectrumData?.datum;
    }

    switch (selectedFilterID) {
      case options.phaseCorrection.id: {
        // look for the strongest peak to set it as a pivot
        const { xValue, index } = getStrongestPeak(draft) || {
          xValue: 0,
          index: 0,
        };

        draft.toolOptions.data.pivot = { value: xValue, index };

        break;
      }
      case options.baselineCorrection.id: {
        const baselineCorrectionFilter: any = current(draft).data[
          activeSpectrum.index
        ].filters.find(
          (filter) => filter.name === options.baselineCorrection.id,
        );

        if (baselineCorrectionFilter) {
          draft.toolOptions.data.baselineCorrection.zones =
            baselineCorrectionFilter
              ? baselineCorrectionFilter.value.zones
              : [];
        }
        break;
      }
      case options.apodization.id: {
        draft.toolOptions.data.apodizationOptions = defaultApodizationOptions;
        break;
      }

      default:
        break;
    }
  } else if (checkFilterHasTempData(draft.toolOptions.selectedTool)) {
    draft.toolOptions.data.activeFilterID = null;
    const spectrumIndex = draft.data.findIndex(
      (spectrum) => spectrum.id === activeSpectrumId,
    );
    draft.data[spectrumIndex].data = draft.tempData[spectrumIndex].data;
  }
}

export {
  shiftSpectrumAlongXAxis,
  applyZeroFillingFilter,
  applyApodizationFilter,
  applyFFTFilter,
  applyManualPhaseCorrectionFilter,
  applyAutoPhaseCorrectionFilter,
  applyAbsoluteFilter,
  calculateManualPhaseCorrection,
  calculateBaseLineCorrection,
  calculateApodizationFilter,
  calculateZeroFillingFilter,
  handleMultipleSpectraFilter,
  enableFilter,
  deleteFilter,
  deleteSpectraFilter,
  handleBaseLineCorrectionFilter,
  filterSnapshotHandler,
  resetSpectrumByFilter,
  handleAddExclusionZone,
  handleDeleteExclusionZone,
  handleDisableFilterLivePreview,
  setFilterChanges,
  handleSignalProcessingFilter,
};
