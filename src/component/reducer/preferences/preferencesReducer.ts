import { Draft, produce } from 'immer';

import { NMRiumWorkspace, NMRiumPreferences } from '../../NMRium';
import {
  getLocalStorage,
  removeData,
  storeData,
} from '../../utility/LocalStorage';
import Workspaces from '../../workspaces';
import {
  MultipleSpectraAnalysisPreferences,
  Workspace,
  WorkSpaceSource,
} from '../../workspaces/Workspace';
import { ActionType } from '../types/Types';

import { addWorkspace } from './actions/addWorkspace';
import {
  analyzeSpectra,
  changeAnalysisColumnValueKey,
  deleteAnalysisColumn,
  setSpectraAnalysisPanelsPreferences,
} from './actions/analyzeSpectra';
import { initPreferences } from './actions/initPreferences';
import { removeWorkspace } from './actions/removeWorkspace';
import { setActiveWorkspace } from './actions/setActiveWorkspace';
import { setPanelsPreferences } from './actions/setPanelsPreferences';
import { setPreferences } from './actions/setPreferences';
import { setWorkspace } from './actions/setWorkspace';
import { mapWorkspaces } from './utilities/mapWorkspaces';

const LOCAL_STORAGE_VERSION = 12;

export const WORKSPACES_KEYS = {
  componentKey: `nmrium-component-workspace`,
  nmriumKey: `nmrium-file-workspace`,
};

type InitPreferencesAction = ActionType<
  'INIT_PREFERENCES',
  {
    display: NMRiumPreferences;
    workspace: NMRiumWorkspace;
    customWorkspaces: Record<string, Workspace>;
    dispatch: any;
  }
>;
type SetPreferencesAction = ActionType<'SET_PREFERENCES', Partial<Workspace>>;
type SetPanelsPreferencesAction = ActionType<
  'SET_PANELS_PREFERENCES',
  { key: string; value: string }
>;

export type SetWorkspaceAction = ActionType<
  'SET_WORKSPACE',
  | { workspaceSource: 'any'; workspace: string }
  | { workspaceSource: 'nmriumFile'; data: Workspace }
>;
export type WorkspaceAction = ActionType<
  'REMOVE_WORKSPACE' | 'SET_ACTIVE_WORKSPACE',
  { workspace: string }
>;
export type AddWorkspaceAction = ActionType<
  'ADD_WORKSPACE',
  { workspace: string; data?: Omit<Workspace, 'version' | 'label'> }
>;
export type AnalyzeSpectraAction = ActionType<
  'ANALYZE_SPECTRA',
  { start: number; end: number; nucleus: string; columnKey?: string }
>;
export type ChangeAnalysisColumnValueKeyAction = ActionType<
  'CHANGE_ANALYSIS_COLUMN_VALUE_KEY',
  { columnKey: string; valueKey: string; nucleus: string }
>;
export type DeleteAnalysisColumn = ActionType<
  'DELETE_ANALYSIS_COLUMN',
  { columnKey: string; nucleus: string }
>;
export type SetSpectraAnalysisPanelPreferencesAction = ActionType<
  'SET_SPECTRA_ANALYSIS_PREFERENCES',
  { nucleus: string; data: MultipleSpectraAnalysisPreferences }
>;

type PreferencesActions =
  | InitPreferencesAction
  | SetPreferencesAction
  | SetPanelsPreferencesAction
  | SetWorkspaceAction
  | WorkspaceAction
  | AddWorkspaceAction
  | AnalyzeSpectraAction
  | ChangeAnalysisColumnValueKeyAction
  | DeleteAnalysisColumn
  | SetSpectraAnalysisPanelPreferencesAction;

export const WORKSPACES: Array<{
  key: NMRiumWorkspace;
  label: string;
}> = [
  {
    key: 'default',
    label: Workspaces.default.label,
  },
  {
    key: 'process1D',
    label: Workspaces.process1D.label,
  },
  {
    key: 'exercise',
    label: Workspaces.exercise.label,
  },
  {
    key: 'prediction',
    label: Workspaces.prediction.label,
  },
  {
    key: 'assignment',
    label: Workspaces.assignment.label,
  },
  {
    key: 'embedded',
    label: Workspaces.embedded.label,
  },
];

export type WorkspaceWithSource = Workspace & { source: WorkSpaceSource };
export type WorkspacesWithSource = Record<string, WorkspaceWithSource>;

export interface PreferencesState {
  version: number;
  workspaces: WorkspacesWithSource;
  originalWorkspaces: WorkspacesWithSource;
  dispatch: (action?: PreferencesActions) => void;
  workspace: {
    current: NMRiumWorkspace;
    base: NMRiumWorkspace | null;
  };
}

export const preferencesInitialState: PreferencesState = {
  version: LOCAL_STORAGE_VERSION,
  workspaces: {},
  originalWorkspaces: {},
  dispatch: () => null,
  workspace: {
    current: 'default',
    base: null,
  },
};

export function initPreferencesState(
  state: PreferencesState,
): PreferencesState {
  const nmrLocalStorageVersion = getLocalStorage(
    'nmr-local-storage-version',
    false,
  );

  let localData = getLocalStorage('nmr-general-settings');

  // remove old nmr-local-storage-version key
  if (nmrLocalStorageVersion && localData?.version) {
    removeData('nmr-local-storage-version');
  }

  //  if the local setting version != current settings version number
  if (!localData?.version || localData?.version !== LOCAL_STORAGE_VERSION) {
    removeData('nmr-general-settings');

    const data = {
      version: LOCAL_STORAGE_VERSION,
      ...(localData?.currentWorkspace && {
        currentWorkspace: localData?.currentWorkspace,
      }),
      workspaces: {},
    };
    storeData('nmr-general-settings', JSON.stringify(data));
  }

  const predefinedWorkspaces = mapWorkspaces(Workspaces as any, {
    source: 'predefined',
  });
  const localWorkspaces = mapWorkspaces(localData?.workspaces || {}, {
    source: 'user',
  });

  return {
    ...state,
    originalWorkspaces: { ...predefinedWorkspaces, ...localWorkspaces },
    workspaces: { ...predefinedWorkspaces, ...localWorkspaces },
  };
}

function innerPreferencesReducer(
  draft: Draft<PreferencesState>,
  action: PreferencesActions,
) {
  switch (action.type) {
    case 'INIT_PREFERENCES':
      return initPreferences(draft, action);
    case 'SET_PREFERENCES':
      return setPreferences(draft, action);
    case 'SET_PANELS_PREFERENCES':
      return setPanelsPreferences(draft, action);
    case 'SET_WORKSPACE':
      return setWorkspace(draft, action);
    case 'SET_ACTIVE_WORKSPACE':
      return setActiveWorkspace(draft, action);
    case 'ADD_WORKSPACE':
      return addWorkspace(draft, action);
    case 'REMOVE_WORKSPACE':
      return removeWorkspace(draft, action);
    case 'ANALYZE_SPECTRA':
      return analyzeSpectra(draft, action);
    case 'CHANGE_ANALYSIS_COLUMN_VALUE_KEY':
      return changeAnalysisColumnValueKey(draft, action);
    case 'DELETE_ANALYSIS_COLUMN':
      return deleteAnalysisColumn(draft, action);
    case 'SET_SPECTRA_ANALYSIS_PREFERENCES':
      return setSpectraAnalysisPanelsPreferences(draft, action);
    default:
      return draft;
  }
}
const preferencesReducer = produce(innerPreferencesReducer);

export default preferencesReducer;
