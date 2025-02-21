import { useCallback, useEffect, useMemo } from 'react';

import checkModifierKeyActivated from '../../data/utilities/checkModifierKeyActivated';
import { useAssignmentData } from '../assignment/AssignmentsContext';
import { useChartData } from '../context/ChartContext';
import { useDispatch } from '../context/DispatchContext';
import { useLoader } from '../context/LoaderContext';
import { usePreferences } from '../context/PreferencesContext';
import { useAlert } from '../elements/popup/Alert';
import { useModal } from '../elements/popup/Modal';
import { HighlightEventSource, useHighlightData } from '../highlight/index';
import { useCheckToolsVisibility } from '../hooks/useCheckToolsVisibility';
import useExport from '../hooks/useExport';
import useToolsFunctions from '../hooks/useToolsFunctions';
import { DISPLAYER_MODE } from '../reducer/core/Constants';
import {
  SET_KEY_PREFERENCES,
  APPLY_KEY_PREFERENCES,
  DELETE_INTEGRAL,
  DELETE_PEAK_NOTATION,
  DELETE_RANGE,
  DELETE_2D_ZONE,
  DELETE_EXCLUSION_ZONE,
  DELETE_MATRIX_GENERATION_EXCLUSION_ZONE,
} from '../reducer/types/Types';
import { options } from '../toolbar/ToolTypes';

function KeysListenerTracker() {
  const {
    keysPreferences,
    displayerMode,
    overDisplayer,
    data,
    view: {
      spectra: { activeTab },
    },
  } = useChartData();
  const dispatch = useDispatch();
  const { dispatch: dispatchPreferences } = usePreferences();
  const alert = useAlert();
  const modal = useModal();
  const openLoader = useLoader();

  const {
    handleChangeOption,
    handleFullZoomOut,
    alignSpectrumsVerticallyHandler,
    changeDisplayViewModeHandler,
  } = useToolsFunctions();

  const { saveToClipboardHandler, saveAsJSONHandler, saveAsHandler } =
    useExport();
  const isToolVisible = useCheckToolsVisibility();

  const { highlight, remove } = useHighlightData();

  const assignmentData = useAssignmentData();
  const allow1DTool = useMemo(() => {
    return displayerMode === DISPLAYER_MODE.DM_1D && data && data.length > 0;
  }, [data, displayerMode]);

  const deleteHandler = useCallback(
    async (sourceData) => {
      const {
        type,
        extra: { id, zone, spectrumID, colKey },
      } = sourceData;
      switch (type) {
        case HighlightEventSource.INTEGRAL: {
          dispatch({
            type: DELETE_INTEGRAL,
            integralID: id,
          });
          // remove keys from the highlighted list after delete
          remove();

          break;
        }
        case HighlightEventSource.PEAK: {
          dispatch({
            type: DELETE_PEAK_NOTATION,
            data: { id },
          });
          // remove keys from the highlighted list after delete
          remove();

          break;
        }
        case HighlightEventSource.RANGE: {
          dispatch({
            type: DELETE_RANGE,
            payload: {
              data: {
                id,
                assignmentData,
              },
            },
          });
          // remove keys from the highlighted list after delete
          remove();

          break;
        }
        case HighlightEventSource.ZONE: {
          dispatch({
            type: DELETE_2D_ZONE,
            payload: {
              id,
              assignmentData,
            },
          });
          // remove keys from the highlighted list after delete
          remove();

          break;
        }
        case HighlightEventSource.EXCLUSION_ZONE: {
          const buttons = [
            {
              text: 'Yes, for all spectra',
              handler: async () => {
                const hideLoading = await alert.showLoading(
                  'Delete all spectra exclusion zones in progress',
                );
                dispatch({
                  type: DELETE_EXCLUSION_ZONE,
                  payload: {
                    zone,
                  },
                });
                hideLoading();
              },
            },
            {
              text: 'Yes',
              handler: async () => {
                const hideLoading = await alert.showLoading(
                  'Delete exclusion zones in progress',
                );
                dispatch({
                  type: DELETE_EXCLUSION_ZONE,
                  payload: {
                    zone,
                    spectrumID,
                  },
                });
                hideLoading();
              },
            },
            { text: 'No' },
          ];

          modal.showConfirmDialog({
            message: 'Are you sure you want to delete the exclusion zone/s?',
            buttons,
          });
          modal.showConfirmDialog({
            message: 'Are you sure you want to delete the exclusion zone/s?',
            buttons,
          });

          break;
        }
        case HighlightEventSource.MATRIX_GENERATION_EXCLUSION_ZONE: {
          const buttons = [
            {
              text: 'Yes',
              handler: async () => {
                const hideLoading = await alert.showLoading(
                  'Delete all spectra exclusion zones in progress',
                );
                dispatch({
                  type: DELETE_MATRIX_GENERATION_EXCLUSION_ZONE,
                  payload: {
                    zone,
                  },
                });
                hideLoading();
              },
            },
            { text: 'No' },
          ];

          modal.showConfirmDialog({
            message:
              'Are you sure you want to delete the Matrix generation exclusion zones?',
            buttons,
          });

          break;
        }
        case HighlightEventSource.MULTIPLE_ANALYSIS_ZONE: {
          dispatchPreferences({
            type: 'DELETE_ANALYSIS_COLUMN',
            payload: { columnKey: colKey, nucleus: activeTab },
          });
          // remove keys from the highlighted list after delete
          remove();

          break;
        }

        default:
          break;
      }
    },
    [
      dispatch,
      remove,
      assignmentData,
      modal,
      alert,
      dispatchPreferences,
      activeTab,
    ],
  );

  const keysPreferencesListenerHandler = useCallback(
    (e, num) => {
      if (data && data.length > 0 && num >= 1 && num <= 9) {
        if (e.shiftKey) {
          dispatch({
            type: SET_KEY_PREFERENCES,
            keyCode: num,
          });
          alert.show(`Configuration Reset, press '${num}' again to reload it.`);
        } else if (!checkModifierKeyActivated(e)) {
          if (keysPreferences?.[num]) {
            dispatch({
              type: APPLY_KEY_PREFERENCES,
              keyCode: num,
            });
          } else {
            dispatch({
              type: SET_KEY_PREFERENCES,
              keyCode: num,
            });
            alert.show(
              `Configuration saved, press '${num}' again to reload it.`,
            );
          }
        }
      }
    },
    [alert, data, dispatch, keysPreferences],
  );

  const toolsListenerHandler = useCallback(
    (e) => {
      try {
        if (!e.shiftKey && !e.metaKey) {
          switch (e.key) {
            case 'f':
              if (isToolVisible('zoomOut')) {
                handleFullZoomOut();
              }
              break;
            case 'z':
            case 'Escape':
              if (isToolVisible('zoom')) {
                handleChangeOption(options.zoom.id);
              }
              break;
            case 'r': {
              if (isToolVisible('zonePicking')) {
                handleChangeOption(options.zonePicking.id);
              } else if (isToolVisible('rangePicking')) {
                handleChangeOption(options.rangePicking.id);
              }
              break;
            }
            case 'a': {
              if (isToolVisible('apodization')) {
                handleChangeOption(options.apodization.id);
              } else if (isToolVisible('phaseCorrection')) {
                handleChangeOption(options.phaseCorrection.id);
              }

              break;
            }
            case 'b': {
              if (isToolVisible('baselineCorrection')) {
                handleChangeOption(options.baselineCorrection.id);
              }

              break;
            }
            case 'p': {
              if (isToolVisible('peakPicking')) {
                handleChangeOption(options.peakPicking.id);
              }
              break;
            }
            case 'i': {
              if (isToolVisible('integral')) {
                handleChangeOption(options.integral.id);
              }

              break;
            }
            case 'e': {
              if (isToolVisible('exclusionZones')) {
                handleChangeOption(options.exclusionZones.id);
              }

              break;
            }
            default:
          }
        }

        if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
          switch (e.key) {
            case 'c': {
              if (allow1DTool && isToolVisible('spectraCenterAlignments')) {
                alignSpectrumsVerticallyHandler();
              }
              break;
            }
            case 's': {
              if (allow1DTool && isToolVisible('spectraStackAlignments')) {
                changeDisplayViewModeHandler();
              }
              break;
            }
            default:
          }
        }

        if (!e.shiftKey && (e.metaKey || e.ctrlKey)) {
          switch (e.key) {
            case 'c':
              void saveToClipboardHandler();
              e.preventDefault();
              break;
            case 's':
              if (isToolVisible('exportAs')) {
                saveAsJSONHandler();
                e.preventDefault();
              }
              break;
            case 'o':
              openLoader();
              e.preventDefault();
              break;
            default:
          }
        }
        if (e.shiftKey && (e.metaKey || e.ctrlKey)) {
          switch (e.key) {
            case 's':
            case 'S':
              void saveAsHandler();
              e.preventDefault();
              break;
            default:
          }
        }
      } catch (error: any) {
        reportError(error);
        alert.error(error.message);
      }
    },
    [
      alert,
      alignSpectrumsVerticallyHandler,
      allow1DTool,
      changeDisplayViewModeHandler,
      handleChangeOption,
      handleFullZoomOut,
      isToolVisible,
      openLoader,
      saveAsHandler,
      saveAsJSONHandler,
      saveToClipboardHandler,
    ],
  );

  const handleOnKeyDown = useCallback(
    (e) => {
      if (checkNotInputField(e) && overDisplayer) {
        const num = Number(e.code.slice(-1)) || 0;
        if (num > 0) {
          keysPreferencesListenerHandler(e, num);
        } else if (
          ['Delete', 'Backspace'].includes(e.key) &&
          highlight.sourceData
        ) {
          e.preventDefault();
          void deleteHandler(highlight.sourceData);
        } else {
          toolsListenerHandler(e);
        }
      }
    },
    [
      deleteHandler,
      highlight,
      keysPreferencesListenerHandler,
      overDisplayer,
      toolsListenerHandler,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleOnKeyDown);

    return () => document.removeEventListener('keydown', handleOnKeyDown);
  }, [handleOnKeyDown]);

  return null;
}

function checkNotInputField(e: Event) {
  const tags = ['input', 'textarea'];
  const tagName = (e.composedPath()[0] as HTMLElement).tagName.toLowerCase();
  if (!tags.includes(tagName)) return true;

  return false;
}

export default KeysListenerTracker;
